import { Query } from "node-appwrite";
import type { Comment, Post, Profile } from "@/types/database";
import { createAppwriteAdminClient } from "./server";
import { getAppwriteDatabaseId, getAppwriteTableId } from "./tables";

type AppwriteRow = {
  $id: string;
  [key: string]: unknown;
};

type AppwriteProfileRow = AppwriteRow & {
  userId: string;
  email?: string | null;
  username: string;
  role: Profile["role"];
  createdAt: string;
  updatedAt?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  social?: string | null;
  avatarUrl?: string | null;
  preferredCategory?: string | null;
};

type AppwritePostRow = AppwriteRow & {
  title: string;
  content: string;
  category: Post["category"];
  authorId: string;
  archived?: boolean | null;
  pinned?: boolean | null;
  createdAt: string;
};

type AppwriteCommentRow = AppwriteRow & {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
};

type AppwritePostTagRow = AppwriteRow & {
  postId: string;
  tagId: string;
};

type AppwriteTagRow = AppwriteRow & {
  name: string;
};

function getTablesDB() {
  const admin = createAppwriteAdminClient();

  if (!admin) {
    throw new Error("Appwrite admin client is not configured.");
  }

  return admin.tablesDB;
}

function parseSocial(value: string | null | undefined): Profile["social"] | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function mapProfile(row: AppwriteProfileRow): Profile {
  return {
    id: row.userId,
    username: row.username,
    email: row.email || undefined,
    role: row.role,
    created_at: row.createdAt,
    updated_at: row.updatedAt || undefined,
    bio: row.bio || undefined,
    location: row.location || undefined,
    website: row.website || undefined,
    social: parseSocial(row.social),
    avatar_url: row.avatarUrl || undefined,
    preferredCategory: row.preferredCategory || undefined,
  };
}

async function listRows<T extends AppwriteRow>(
  tableName: string,
  queries: string[] = []
): Promise<T[]> {
  const tablesDB = getTablesDB();
  const response = await tablesDB.listRows({
    databaseId: getAppwriteDatabaseId(),
    tableId: getAppwriteTableId(tableName),
    queries: [Query.limit(5000), ...queries],
  });

  return (response.rows || []) as unknown as T[];
}

async function getProfilesMap(userIds: string[]): Promise<Map<string, Profile>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const uniqueUserIds = [...new Set(userIds)];
  const rows = await listRows<AppwriteProfileRow>("profiles", [
    Query.equal("userId", uniqueUserIds),
  ]);

  return new Map(rows.map((row) => [row.userId, mapProfile(row)]));
}

async function getTagNamesByPostId(postIds: string[]): Promise<Map<string, string[]>> {
  if (postIds.length === 0) {
    return new Map();
  }

  const postTags = await listRows<AppwritePostTagRow>("post_tags", [
    Query.equal("postId", postIds),
  ]);
  const tagIds = [...new Set(postTags.map((row) => row.tagId).filter(Boolean))];
  const tags = tagIds.length
    ? await listRows<AppwriteTagRow>("tags", [Query.equal("$id", tagIds)])
    : [];

  const tagNameById = new Map(tags.map((tag) => [tag.$id, tag.name]));
  const result = new Map<string, string[]>();

  for (const relation of postTags) {
    const tagName = tagNameById.get(relation.tagId);
    if (!tagName) {
      continue;
    }

    const current = result.get(relation.postId) || [];
    current.push(tagName);
    result.set(relation.postId, current);
  }

  return result;
}

async function getCountMap(
  tableName: string,
  key: string,
  ids: string[]
): Promise<Map<string, number>> {
  if (ids.length === 0) {
    return new Map();
  }

  const rows = await listRows<AppwriteRow>(tableName, [Query.equal(key, ids)]);
  const result = new Map<string, number>();

  for (const row of rows) {
    const value = row[key];
    if (typeof value !== "string") {
      continue;
    }
    result.set(value, (result.get(value) || 0) + 1);
  }

  return result;
}

async function getCommentLikesCountMap(commentIds: string[]): Promise<Map<string, number>> {
  return getCountMap("comment_likes", "commentId", commentIds);
}

function mapPost(
  row: AppwritePostRow,
  profiles: Map<string, Profile>,
  tagsByPostId: Map<string, string[]>,
  likesCountMap: Map<string, number>,
  commentsCountMap: Map<string, number>,
  viewsCountMap: Map<string, number>
): Post {
  const author = profiles.get(row.authorId);

  return {
    id: row.$id,
    title: row.title,
    content: row.content,
    author_id: row.authorId,
    author: {
      username: author?.username || "Unknown",
      role: author?.role || "student",
    },
    created_at: row.createdAt,
    category: row.category,
    tags: tagsByPostId.get(row.$id) || [],
    likesCount: likesCountMap.get(row.$id) || 0,
    commentsCount: commentsCountMap.get(row.$id) || 0,
    viewsCount: viewsCountMap.get(row.$id) || 0,
    archived: row.archived || false,
    pinned: row.pinned || false,
  };
}

export async function getAppwritePosts(
  category?: string,
  includeArchived = false,
  archivedOnly = false
): Promise<Post[]> {
  const queries: string[] = [];

  if (category && category !== "all") {
    queries.push(Query.equal("category", [category]));
  }

  if (archivedOnly) {
    queries.push(Query.equal("archived", [true]));
  } else if (!includeArchived) {
    queries.push(Query.equal("archived", [false]));
  }

  const postRows = await listRows<AppwritePostRow>("posts", queries);
  const postIds = postRows.map((row) => row.$id);
  const authorIds = postRows.map((row) => row.authorId);

  const [profiles, tagsByPostId, likesCountMap, commentsCountMap, viewsCountMap] =
    await Promise.all([
      getProfilesMap(authorIds),
      getTagNamesByPostId(postIds),
      getCountMap("likes", "postId", postIds),
      getCountMap("comments", "postId", postIds),
      getCountMap("views", "postId", postIds),
    ]);

  return postRows
    .map((row) =>
      mapPost(row, profiles, tagsByPostId, likesCountMap, commentsCountMap, viewsCountMap)
    )
    .sort((left, right) => {
      const pinnedDelta = Number(right.pinned || false) - Number(left.pinned || false);
      if (pinnedDelta !== 0) {
        return pinnedDelta;
      }
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });
}

export async function getAppwritePostById(postId: string): Promise<Post | null> {
  const tablesDB = getTablesDB();
  let row: AppwritePostRow;

  try {
    row = (await tablesDB.getRow({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("posts"),
      rowId: postId,
    })) as unknown as AppwritePostRow;
  } catch (error) {
    console.error("Error fetching Appwrite post by id:", error);
    return null;
  }

  const [profiles, tagsByPostId, likesCountMap, commentsCountMap, viewsCountMap] =
    await Promise.all([
      getProfilesMap([row.authorId]),
      getTagNamesByPostId([row.$id]),
      getCountMap("likes", "postId", [row.$id]),
      getCountMap("comments", "postId", [row.$id]),
      getCountMap("views", "postId", [row.$id]),
    ]);

  return mapPost(row, profiles, tagsByPostId, likesCountMap, commentsCountMap, viewsCountMap);
}

export async function getAppwriteCommentsByPostId(postId: string): Promise<Comment[]> {
  const rows = await listRows<AppwriteCommentRow>("comments", [Query.equal("postId", [postId])]);
  const profiles = await getProfilesMap(rows.map((row) => row.authorId));
  const likesCountMap = await getCommentLikesCountMap(rows.map((row) => row.$id));

  const commentMap = new Map<string, Comment>();
  const rootComments: Comment[] = [];

  for (const row of rows.sort((left, right) => {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  })) {
    const author = profiles.get(row.authorId);
    commentMap.set(row.$id, {
      id: row.$id,
      content: row.content,
      author: {
        username: author?.username || "Unknown",
        role: author?.role || "student",
      },
      created_at: row.createdAt,
      parent_id: row.parentId || null,
      replies: [],
      likesCount: likesCountMap.get(row.$id) || 0,
    });
  }

  for (const comment of commentMap.values()) {
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent?.replies) {
        parent.replies.push(comment);
      }
      continue;
    }

    rootComments.push(comment);
  }

  return rootComments;
}

export async function getAppwriteTeachers(): Promise<Profile[]> {
  const rows = await listRows<AppwriteProfileRow>("profiles", [Query.equal("role", ["teacher"])]);

  return rows.map(mapProfile).sort((left, right) => {
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
}

export async function getAppwriteUserPreference(
  userId: string,
  key: "preferredCategory" | "preferredViewMode" | "themePreference"
): Promise<string | null> {
  const admin = createAppwriteAdminClient();
  if (!admin) {
    return null;
  }

  const rows = await listRows<AppwriteProfileRow>("profiles", [
    Query.equal("userId", [userId]),
    Query.limit(1),
  ]);
  const row = rows[0];

  if (!row) {
    return null;
  }

  const value = row[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}
