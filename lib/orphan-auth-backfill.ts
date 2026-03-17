import type {
  OrphanProfileBackfillRun,
  OrphanProfileCandidate,
  OrphanProfilesSnapshot,
  Profile,
} from "@/types/database";
import { createAdminClient } from "./supabase-admin";

const ORPHAN_BACKFILL_APP_METADATA_FLAG = "legacy_profile_backfill";
const ORPHAN_BACKFILL_DEFAULT_BATCH = 25;
const ORPHAN_BACKFILL_MAX_BATCH = 50;

interface AuthUserSummary {
  id: string;
  email: string | null;
}

interface ProfileRow {
  id: string;
  email: string | null;
  username: string;
  role: Profile["role"];
  created_at: string;
  updated_at: string | null;
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || null;
}

function isEligibleForAutomaticBackfill(candidate: OrphanProfileCandidate) {
  return !candidate.emailExistsInAuth && !candidate.idExistsInAuth && candidate.postsCount === 0;
}

async function listAllAuthUsers() {
  const admin = createAdminClient();
  const users: AuthUserSummary[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const pageUsers = (data?.users || []).map((user) => ({
      id: user.id,
      email: user.email ?? null,
    }));

    users.push(...pageUsers);

    if (pageUsers.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
}

async function countReferencesByProfileId(
  table: "posts" | "comments" | "likes" | "views" | "comment_likes",
  column: "author_id" | "user_id",
  ids: string[]
) {
  if (!ids.length) {
    return new Map<string, number>();
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from(table).select(column).in(column, ids);

  if (error) {
    throw error;
  }

  const counts = new Map<string, number>();
  for (const row of data || []) {
    const value = (row as Record<string, unknown>)[column];
    if (typeof value !== "string") {
      continue;
    }

    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return counts;
}

async function getProfiles() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, username, role, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as ProfileRow[];
}

export async function getOrphanProfilesSnapshot(limit = 100): Promise<OrphanProfilesSnapshot> {
  const [profiles, authUsers] = await Promise.all([getProfiles(), listAllAuthUsers()]);

  const authIds = new Set(authUsers.map((user) => user.id));
  const authEmails = new Set(
    authUsers.map((user) => normalizeEmail(user.email)).filter((email): email is string => !!email)
  );

  const profilesWithEmail = profiles.filter((profile) => normalizeEmail(profile.email));
  const orphanProfiles = profilesWithEmail.filter((profile) => !authIds.has(profile.id));
  const orphanIds = orphanProfiles.map((profile) => profile.id);

  const [postsCount, commentsCount, likesCount, viewsCount, commentLikesCount] = await Promise.all([
    countReferencesByProfileId("posts", "author_id", orphanIds),
    countReferencesByProfileId("comments", "author_id", orphanIds),
    countReferencesByProfileId("likes", "user_id", orphanIds),
    countReferencesByProfileId("views", "user_id", orphanIds),
    countReferencesByProfileId("comment_likes", "user_id", orphanIds),
  ]);

  const candidates: OrphanProfileCandidate[] = orphanProfiles
    .map((profile) => {
      const email = normalizeEmail(profile.email);
      const profilePostsCount = postsCount.get(profile.id) || 0;
      const profileCommentsCount = commentsCount.get(profile.id) || 0;
      const profileLikesCount = likesCount.get(profile.id) || 0;
      const profileViewsCount = viewsCount.get(profile.id) || 0;
      const profileCommentLikesCount = commentLikesCount.get(profile.id) || 0;

      return {
        profileId: profile.id,
        email: profile.email!.trim(),
        username: profile.username,
        role: profile.role,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        emailExistsInAuth: !!email && authEmails.has(email),
        idExistsInAuth: authIds.has(profile.id),
        postsCount: profilePostsCount,
        commentsCount: profileCommentsCount,
        likesCount: profileLikesCount,
        viewsCount: profileViewsCount,
        commentLikesCount: profileCommentLikesCount,
        totalReferences:
          profilePostsCount +
          profileCommentsCount +
          profileLikesCount +
          profileViewsCount +
          profileCommentLikesCount,
      };
    })
    .sort((left, right) => {
      if (right.totalReferences !== left.totalReferences) {
        return right.totalReferences - left.totalReferences;
      }

      return left.createdAt.localeCompare(right.createdAt);
    })
    .slice(0, limit);

  const authWithoutProfileCount = authUsers.filter(
    (user) => !profiles.some((profile) => profile.id === user.id)
  ).length;

  return {
    totalProfilesWithEmail: profilesWithEmail.length,
    totalAuthUsersWithEmail: authUsers.filter((user) => normalizeEmail(user.email)).length,
    orphanProfilesCount: orphanProfiles.length,
    authWithoutProfileCount,
    candidates,
  };
}

export async function backfillOrphanProfiles(batchSize = ORPHAN_BACKFILL_DEFAULT_BATCH) {
  const safeBatchSize = Math.max(1, Math.min(batchSize, ORPHAN_BACKFILL_MAX_BATCH));
  const admin = createAdminClient();
  const snapshot = await getOrphanProfilesSnapshot(500);
  const candidates = snapshot.candidates
    .filter(isEligibleForAutomaticBackfill)
    .slice(0, safeBatchSize);

  const results: OrphanProfileBackfillRun["results"] = [];

  for (const candidate of candidates) {
    try {
      const createUserResult = await admin.auth.admin.createUser({
        email: candidate.email,
        email_confirm: true,
        user_metadata: {
          username: candidate.username,
          full_name: candidate.username,
          legacy_profile_id: candidate.profileId,
          [ORPHAN_BACKFILL_APP_METADATA_FLAG]: true,
        },
        app_metadata: {
          role: candidate.role,
          provider: "email",
          providers: ["email"],
          legacy_profile_id: candidate.profileId,
          [ORPHAN_BACKFILL_APP_METADATA_FLAG]: true,
        },
      });

      if (createUserResult.error || !createUserResult.data.user) {
        results.push({
          profileId: candidate.profileId,
          email: candidate.email,
          status: "error",
          message: createUserResult.error?.message || "Supabase не вернул созданного пользователя",
        });
        continue;
      }

      const newUserId = createUserResult.data.user.id;
      const { error: reassignError } = await admin.rpc("reassign_profile_id", {
        old_profile_id: candidate.profileId,
        new_profile_id: newUserId,
      });

      if (reassignError) {
        await admin.auth.admin.deleteUser(newUserId);
        results.push({
          profileId: candidate.profileId,
          email: candidate.email,
          status: "error",
          message: `Не удалось перепривязать профиль: ${reassignError.message}`,
          newUserId,
        });
        continue;
      }

      results.push({
        profileId: candidate.profileId,
        email: candidate.email,
        status: "success",
        message: "Auth-пользователь создан, профиль и ссылки перепривязаны",
        newUserId,
      });
    } catch (error) {
      results.push({
        profileId: candidate.profileId,
        email: candidate.email,
        status: "error",
        message: error instanceof Error ? error.message : "Неизвестная ошибка backfill",
      });
    }
  }

  return {
    processed: results.length,
    succeeded: results.filter((result) => result.status === "success").length,
    failed: results.filter((result) => result.status === "error").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    results,
  } satisfies OrphanProfileBackfillRun;
}

export { isEligibleForAutomaticBackfill };
