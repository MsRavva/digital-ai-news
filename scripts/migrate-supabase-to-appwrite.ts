import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { AppwriteException, Client, Query, TablesDB, Users } from "node-appwrite";

type Role = "student" | "teacher" | "admin";

type SupabaseProfile = {
  id: string;
  email: string | null;
  username: string;
  role: Role;
  created_at: string;
  updated_at: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  social: unknown;
  avatar_url: string | null;
  preferred_category: string | null;
};

type SupabasePost = {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  category: "news" | "materials" | "project-ideas" | "archived";
  created_at: string;
  updated_at: string | null;
  archived: boolean | null;
  pinned: boolean | null;
  source_url: string | null;
};

type SupabaseTag = {
  id: string;
  name: string;
};

type SupabasePostTag = {
  post_id: string;
  tag_id: string;
};

type SupabaseLike = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

type SupabaseView = {
  id: string;
  post_id: string;
  user_id: string;
  viewed_at: string;
};

type SupabaseComment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string | null;
};

type SupabaseCommentLike = {
  id?: string;
  comment_id: string;
  user_id: string;
  created_at?: string;
};

type AppwriteRow = {
  $id: string;
  [key: string]: unknown;
};

type MigrationMode = "dry-run" | "apply";

const PAGE_SIZE = 1000;
const APPWRITE_LIMIT = 5000;
const TABLES = [
  "profiles",
  "posts",
  "tags",
  "post_tags",
  "comments",
  "likes",
  "comment_likes",
  "views",
] as const;

const args = new Set(process.argv.slice(2));
const mode: MigrationMode = args.has("--apply") ? "apply" : "dry-run";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function getEnv(name: string, fallback: string) {
  return process.env[name]?.trim() || fallback;
}

function tableId(name: string) {
  return getEnv(`APPWRITE_${name.toUpperCase()}_TABLE_ID`, name);
}

function getDatabaseId() {
  return getEnv("APPWRITE_DATABASE_ID", "digital_ai_news");
}

function isNotFound(error: unknown) {
  return error instanceof AppwriteException || (typeof error === "object" && error !== null)
    ? (error as { code?: number }).code === 404
    : false;
}

function isConflict(error: unknown) {
  return error instanceof AppwriteException || (typeof error === "object" && error !== null)
    ? (error as { code?: number }).code === 409
    : false;
}

function stableRowId(prefix: string, parts: string[]) {
  const hash = createHash("sha1").update(parts.join(":")).digest("hex").slice(0, 28);
  return `${prefix}_${hash}`;
}

function normalizeTagName(name: string) {
  return name.trim().toLowerCase();
}

function serializeJson(value: unknown) {
  if (!value) {
    return null;
  }
  return JSON.stringify(value);
}

function asNullableString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function sanitizeEmail(value: string | null | undefined) {
  const email = value?.trim().toLowerCase();
  if (!email) {
    return null;
  }

  const [localPart, domain] = email.split("@");
  const domainLabels = domain?.split(".") || [];
  const hasValidDomain = domainLabels.every((label) => {
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label);
  });
  const topLevelDomain = domainLabels.at(-1);

  if (
    !localPart ||
    !domain ||
    !hasValidDomain ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..") ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart) ||
    !/^[a-z0-9.-]+$/.test(domain) ||
    !domain.includes(".") ||
    !topLevelDomain ||
    !/^[a-z]{2,63}$/.test(topLevelDomain)
  ) {
    return null;
  }

  return email;
}

function sanitizeUsername(value: string | null | undefined, fallbackId: string) {
  const username = value?.trim() || `user_${fallbackId.slice(0, 8)}`;
  if (username.length <= 255) {
    return username;
  }

  return `${username.slice(0, 226)}_${createHash("sha1").update(username).digest("hex").slice(0, 28)}`;
}

function withStableSuffix(value: string, stableId: string) {
  const suffix = createHash("sha1").update(stableId).digest("hex").slice(0, 8);
  const base = value.length > 246 ? value.slice(0, 246) : value;
  return `${base}_${suffix}`;
}

function buildUniqueUsernames(profiles: SupabaseProfile[]) {
  const baseById = new Map(
    profiles.map((profile) => [profile.id, sanitizeUsername(profile.username, profile.id)])
  );
  const counts = new Map<string, number>();

  for (const username of baseById.values()) {
    const key = username
      .toLowerCase()
      .replaceAll("ё", "е")
      .normalize("NFKD")
      .replace(/\p{M}/gu, "");
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return new Map(
    profiles.map((profile) => {
      const username = baseById.get(profile.id) || `user_${profile.id.slice(0, 8)}`;
      const key = username
        .toLowerCase()
        .replaceAll("ё", "е")
        .normalize("NFKD")
        .replace(/\p{M}/gu, "");
      return [
        profile.id,
        (counts.get(key) || 0) > 1 ? withStableSuffix(username, profile.id) : username,
      ];
    })
  );
}

function createSupabaseClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function createAppwriteClients() {
  const endpoint = process.env.APPWRITE_ENDPOINT || requireEnv("NEXT_PUBLIC_APPWRITE_ENDPOINT");
  const projectId =
    process.env.APPWRITE_PROJECT_ID || requireEnv("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(requireEnv("APPWRITE_API_KEY"));

  return {
    tablesDB: new TablesDB(client),
    users: new Users(client),
  };
}

async function listSupabaseRows<T>(table: string): Promise<T[]> {
  const supabase = createSupabaseClient();
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase.from(table).select("*").range(from, to);

    if (error) {
      throw new Error(`Failed to read Supabase ${table}: ${error.message}`);
    }

    rows.push(...((data || []) as T[]));
    if (!data || data.length < PAGE_SIZE) {
      break;
    }
  }

  return rows;
}

async function listAppwriteRows(tablesDB: TablesDB, table: string): Promise<AppwriteRow[]> {
  const rows: AppwriteRow[] = [];

  for (let offset = 0; ; offset += APPWRITE_LIMIT) {
    const response = await tablesDB.listRows({
      databaseId: getDatabaseId(),
      tableId: tableId(table),
      queries: [Query.limit(APPWRITE_LIMIT), Query.offset(offset)],
    });

    rows.push(...((response.rows || []) as unknown as AppwriteRow[]));
    if (!response.rows || response.rows.length < APPWRITE_LIMIT) {
      break;
    }
  }

  return rows;
}

async function getAppwriteRow(tablesDB: TablesDB, table: string, rowId: string) {
  try {
    return (await tablesDB.getRow({
      databaseId: getDatabaseId(),
      tableId: tableId(table),
      rowId,
    })) as unknown as AppwriteRow;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

async function upsertRow(params: {
  tablesDB: TablesDB;
  table: string;
  rowId: string;
  data: Record<string, unknown>;
  dryRun: boolean;
  conflictQueries?: string[];
  conflictQueryGroups?: string[][];
}) {
  const existing = await getAppwriteRow(params.tablesDB, params.table, params.rowId);

  if (params.dryRun) {
    return existing ? "update" : "create";
  }

  if (existing) {
    try {
      await params.tablesDB.updateRow({
        databaseId: getDatabaseId(),
        tableId: tableId(params.table),
        rowId: params.rowId,
        data: params.data,
      });
    } catch (error) {
      if (params.table !== "profiles" || !isConflict(error)) {
        throw error;
      }

      const { email, legacySupabaseUserId, userId, username, ...safeProfileData } = params.data;
      await params.tablesDB.updateRow({
        databaseId: getDatabaseId(),
        tableId: tableId(params.table),
        rowId: params.rowId,
        data: safeProfileData,
      });
    }
    return "update";
  }

  try {
    await params.tablesDB.createRow({
      databaseId: getDatabaseId(),
      tableId: tableId(params.table),
      rowId: params.rowId,
      data: params.data,
    });
    return "create";
  } catch (error) {
    if (!isConflict(error)) {
      throw error;
    }

    const queryGroups = [
      ...(params.conflictQueries || []).map((query) => [query]),
      ...(params.conflictQueryGroups || []),
    ];

    for (const queryGroup of queryGroups) {
      const rows = await params.tablesDB.listRows({
        databaseId: getDatabaseId(),
        tableId: tableId(params.table),
        queries: [...queryGroup, Query.limit(1)],
      });
      const row = rows.rows?.[0];
      if (row) {
        await params.tablesDB.updateRow({
          databaseId: getDatabaseId(),
          tableId: tableId(params.table),
          rowId: row.$id,
          data: params.data,
        });
        return "update";
      }
    }

    await params.tablesDB.updateRow({
      databaseId: getDatabaseId(),
      tableId: tableId(params.table),
      rowId: params.rowId,
      data: params.data,
    });
    return "update";
  }
}

async function getAppwriteUsersByEmail(users: Users) {
  const result = new Map<string, string>();

  for (let offset = 0; ; offset += APPWRITE_LIMIT) {
    const response = await users.list({
      queries: [Query.limit(APPWRITE_LIMIT), Query.offset(offset)],
    });

    for (const user of response.users || []) {
      if (user.email) {
        result.set(user.email.toLowerCase(), user.$id);
      }
    }

    if (!response.users || response.users.length < APPWRITE_LIMIT) {
      break;
    }
  }

  return result;
}

function buildUserIdMap(params: {
  supabaseProfiles: SupabaseProfile[];
  appwriteProfiles: AppwriteRow[];
  appwriteUsersByEmail: Map<string, string>;
}) {
  const result = new Map<string, string>();

  for (const profile of params.appwriteProfiles) {
    const legacyId =
      typeof profile.legacySupabaseUserId === "string" ? profile.legacySupabaseUserId : null;
    const userId = typeof profile.userId === "string" ? profile.userId : null;
    if (legacyId && userId) {
      result.set(legacyId, userId);
    }
  }

  for (const profile of params.supabaseProfiles) {
    const email = sanitizeEmail(profile.email);
    const appwriteUserId = email ? params.appwriteUsersByEmail.get(email) : null;
    result.set(profile.id, appwriteUserId || result.get(profile.id) || profile.id);
  }

  return result;
}

function profileRowId(profile: SupabaseProfile, appwriteProfileByEmail: Map<string, AppwriteRow>) {
  const email = sanitizeEmail(profile.email);
  if (!email) {
    return profile.id;
  }

  return appwriteProfileByEmail.get(email)?.$id || profile.id;
}

async function main() {
  const dryRun = mode === "dry-run";
  const { tablesDB, users } = createAppwriteClients();

  console.log(`Migration mode: ${mode}`);

  const [
    supabaseProfiles,
    supabasePosts,
    supabaseTags,
    supabasePostTags,
    supabaseComments,
    supabaseLikes,
    supabaseCommentLikes,
    supabaseViews,
  ] = await Promise.all([
    listSupabaseRows<SupabaseProfile>("profiles"),
    listSupabaseRows<SupabasePost>("posts"),
    listSupabaseRows<SupabaseTag>("tags"),
    listSupabaseRows<SupabasePostTag>("post_tags"),
    listSupabaseRows<SupabaseComment>("comments"),
    listSupabaseRows<SupabaseLike>("likes"),
    listSupabaseRows<SupabaseCommentLike>("comment_likes"),
    listSupabaseRows<SupabaseView>("views"),
  ]);

  let appwriteProfiles = await listAppwriteRows(tablesDB, "profiles");
  const supabaseProfileIds = new Set(supabaseProfiles.map((profile) => profile.id));
  const misfiledProfiles = appwriteProfiles.filter((row) => {
    return (
      supabaseProfileIds.has(row.$id) &&
      typeof row.legacySupabaseUserId === "string" &&
      row.legacySupabaseUserId !== row.$id
    );
  });

  if (misfiledProfiles.length > 0) {
    console.log(`Found ${misfiledProfiles.length} misfiled Appwrite profile rows.`);
    if (!dryRun) {
      for (const row of misfiledProfiles) {
        await tablesDB.deleteRow({
          databaseId: getDatabaseId(),
          tableId: tableId("profiles"),
          rowId: row.$id,
        });
      }
      appwriteProfiles = await listAppwriteRows(tablesDB, "profiles");
    }
  }

  const appwriteUsersByEmail = await getAppwriteUsersByEmail(users);
  const appwriteProfileByEmail = new Map(
    appwriteProfiles
      .filter((row) => typeof row.email === "string")
      .map((row) => [sanitizeEmail(String(row.email)), row] as const)
      .filter((entry): entry is [string, AppwriteRow] => Boolean(entry[0]))
  );
  const userIdByLegacyId = buildUserIdMap({
    supabaseProfiles,
    appwriteProfiles,
    appwriteUsersByEmail,
  });
  const usernameByLegacyId = buildUniqueUsernames(supabaseProfiles);

  const stats: Record<string, Record<string, number>> = {};
  const count = (table: string, action: string) => {
    stats[table] ||= {};
    stats[table][action] = (stats[table][action] || 0) + 1;
  };

  for (const profile of supabaseProfiles) {
    const rowId = profileRowId(profile, appwriteProfileByEmail);
    const userId = userIdByLegacyId.get(profile.id) || profile.id;
    const email = sanitizeEmail(profile.email);
    const username =
      usernameByLegacyId.get(profile.id) || sanitizeUsername(profile.username, profile.id);
    const action = await upsertRow({
      tablesDB,
      table: "profiles",
      rowId,
      dryRun,
      conflictQueries: [
        Query.equal("legacySupabaseUserId", [profile.id]),
        ...(email ? [Query.equal("email", [email])] : []),
      ],
      data: {
        userId,
        legacySupabaseUserId: profile.id,
        email,
        username,
        role: profile.role,
        bio: asNullableString(profile.bio),
        location: asNullableString(profile.location),
        website: asNullableString(profile.website),
        social: serializeJson(profile.social),
        avatarUrl: asNullableString(profile.avatar_url),
        preferredCategory: asNullableString(profile.preferred_category),
        createdAt: profile.created_at,
        updatedAt: profile.updated_at || new Date().toISOString(),
      },
    });
    count("profiles", action);
  }

  for (const tag of supabaseTags) {
    const action = await upsertRow({
      tablesDB,
      table: "tags",
      rowId: tag.id,
      dryRun,
      conflictQueries: [Query.equal("normalizedName", [normalizeTagName(tag.name)])],
      data: {
        name: tag.name,
        normalizedName: normalizeTagName(tag.name),
      },
    });
    count("tags", action);
  }

  const appwriteTags = await listAppwriteRows(tablesDB, "tags");
  const appwriteTagIdByNormalizedName = new Map(
    appwriteTags
      .filter((row) => typeof row.normalizedName === "string")
      .map((row) => [String(row.normalizedName), row.$id])
  );
  const tagIdBySupabaseId = new Map(
    supabaseTags.map((tag) => {
      const normalizedName = normalizeTagName(tag.name);
      return [tag.id, appwriteTagIdByNormalizedName.get(normalizedName) || tag.id];
    })
  );

  for (const post of supabasePosts) {
    if (!post.author_id) {
      count("posts", "skipped_missing_author");
      continue;
    }

    const authorId = userIdByLegacyId.get(post.author_id) || post.author_id;
    const action = await upsertRow({
      tablesDB,
      table: "posts",
      rowId: post.id,
      dryRun,
      data: {
        title: post.title,
        content: post.content,
        category: post.category,
        authorId,
        authorUsernameSnapshot: usernameByLegacyId.get(post.author_id) || null,
        archived: Boolean(post.archived || post.category === "archived"),
        pinned: Boolean(post.pinned),
        sourceUrl: asNullableString(post.source_url),
        createdAt: post.created_at,
        updatedAt: post.updated_at || post.created_at,
      },
    });
    count("posts", action);
  }

  for (const relation of supabasePostTags) {
    const tagId = tagIdBySupabaseId.get(relation.tag_id) || relation.tag_id;
    const action = await upsertRow({
      tablesDB,
      table: "post_tags",
      rowId: stableRowId("pt", [relation.post_id, relation.tag_id]),
      dryRun,
      conflictQueryGroups: [
        [Query.equal("postId", [relation.post_id]), Query.equal("tagId", [tagId])],
      ],
      data: {
        postId: relation.post_id,
        tagId,
      },
    });
    count("post_tags", action);
  }

  for (const comment of supabaseComments) {
    const action = await upsertRow({
      tablesDB,
      table: "comments",
      rowId: comment.id,
      dryRun,
      data: {
        postId: comment.post_id,
        authorId: userIdByLegacyId.get(comment.author_id) || comment.author_id,
        content: comment.content,
        parentId: comment.parent_id,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at || comment.created_at,
      },
    });
    count("comments", action);
  }

  for (const like of supabaseLikes) {
    const action = await upsertRow({
      tablesDB,
      table: "likes",
      rowId: like.id,
      dryRun,
      conflictQueryGroups: [
        [Query.equal("postId", [like.post_id]), Query.equal("userId", [like.user_id])],
      ],
      data: {
        postId: like.post_id,
        userId: userIdByLegacyId.get(like.user_id) || like.user_id,
        createdAt: like.created_at,
      },
    });
    count("likes", action);
  }

  for (const like of supabaseCommentLikes) {
    const action = await upsertRow({
      tablesDB,
      table: "comment_likes",
      rowId: like.id || stableRowId("cl", [like.comment_id, like.user_id]),
      dryRun,
      conflictQueryGroups: [
        [Query.equal("commentId", [like.comment_id]), Query.equal("userId", [like.user_id])],
      ],
      data: {
        commentId: like.comment_id,
        userId: userIdByLegacyId.get(like.user_id) || like.user_id,
        createdAt: like.created_at || new Date().toISOString(),
      },
    });
    count("comment_likes", action);
  }

  for (const view of supabaseViews) {
    const action = await upsertRow({
      tablesDB,
      table: "views",
      rowId: view.id,
      dryRun,
      conflictQueryGroups: [
        [Query.equal("postId", [view.post_id]), Query.equal("userId", [view.user_id])],
      ],
      data: {
        postId: view.post_id,
        userId: userIdByLegacyId.get(view.user_id) || view.user_id,
        createdAt: view.viewed_at,
      },
    });
    count("views", action);
  }

  console.table(stats);

  const totals = await Promise.all(
    TABLES.map(async (table) => {
      const appwriteRows = await tablesDB
        .listRows({
          databaseId: getDatabaseId(),
          tableId: tableId(table),
          queries: [Query.limit(1)],
        })
        .catch((error) => {
          if (isNotFound(error)) {
            return { total: null };
          }
          throw error;
        });

      return {
        table,
        appwriteTotal: appwriteRows.total,
      };
    })
  );

  console.table(totals);

  if (dryRun) {
    console.log("Dry-run completed. Re-run with --apply to write data.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
