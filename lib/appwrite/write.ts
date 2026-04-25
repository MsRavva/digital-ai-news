import { ID, Query } from "node-appwrite";
import { createAppwriteAdminClient } from "./server";
import { getAppwriteDatabaseId, getAppwriteTableId } from "./tables";

function getTablesDB() {
  const admin = createAppwriteAdminClient();
  if (!admin) {
    throw new Error("Appwrite admin client is not configured.");
  }
  return admin.tablesDB;
}

function normalizeTagNames(tags: string[]): string[] {
  const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
  return [...new Set(normalized)];
}

async function getOrCreateTagId(tagName: string): Promise<string | null> {
  const tablesDB = getTablesDB();
  const normalizedName = tagName.trim().toLowerCase();
  if (!normalizedName) {
    return null;
  }

  const existing = await tablesDB.listRows({
    databaseId: getAppwriteDatabaseId(),
    tableId: getAppwriteTableId("tags"),
    queries: [Query.equal("normalizedName", [normalizedName]), Query.limit(1)],
  });

  const existingTag = existing.rows?.[0];
  if (existingTag) {
    return existingTag.$id;
  }

  const created = await tablesDB.createRow({
    databaseId: getAppwriteDatabaseId(),
    tableId: getAppwriteTableId("tags"),
    rowId: ID.unique(),
    data: {
      name: tagName.trim(),
      normalizedName,
    },
  });

  return created.$id;
}

async function syncPostTags(postId: string, tags: string[]) {
  const tablesDB = getTablesDB();
  const normalizedTags = normalizeTagNames(tags);
  const tagIds = (await Promise.all(normalizedTags.map((tag) => getOrCreateTagId(tag)))).filter(
    (value): value is string => Boolean(value)
  );

  const currentRelations = await tablesDB.listRows({
    databaseId: getAppwriteDatabaseId(),
    tableId: getAppwriteTableId("post_tags"),
    queries: [Query.equal("postId", [postId])],
  });

  const currentRows = currentRelations.rows || [];
  const currentTagIds = new Set(currentRows.map((row) => String(row.tagId)));
  const nextTagIds = new Set(tagIds);

  for (const row of currentRows) {
    if (!nextTagIds.has(String(row.tagId))) {
      await tablesDB.deleteRow({
        databaseId: getAppwriteDatabaseId(),
        tableId: getAppwriteTableId("post_tags"),
        rowId: row.$id,
      });
    }
  }

  for (const tagId of tagIds) {
    if (!currentTagIds.has(tagId)) {
      await tablesDB.createRow({
        databaseId: getAppwriteDatabaseId(),
        tableId: getAppwriteTableId("post_tags"),
        rowId: ID.unique(),
        data: {
          postId,
          tagId,
        },
      });
    }
  }
}

export async function createAppwritePost(data: {
  title: string;
  content: string;
  category: string;
  author_id: string;
  tags: string[];
  source_url?: string;
}): Promise<string | null> {
  const tablesDB = getTablesDB();
  try {
    const post = await tablesDB.createRow({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("posts"),
      rowId: ID.unique(),
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        authorId: data.author_id,
        sourceUrl: data.source_url || null,
        archived: false,
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await syncPostTags(post.$id, data.tags);
    return post.$id;
  } catch (error) {
    console.error("Error creating Appwrite post:", error);
    return null;
  }
}

export async function updateAppwritePost(data: {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}): Promise<boolean> {
  const tablesDB = getTablesDB();
  try {
    await tablesDB.updateRow({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("posts"),
      rowId: data.id,
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        updatedAt: new Date().toISOString(),
      },
    });

    await syncPostTags(data.id, data.tags);
    return true;
  } catch (error) {
    console.error("Error updating Appwrite post:", error);
    return false;
  }
}

export async function recordAppwriteView(postId: string, userId: string): Promise<void> {
  const tablesDB = getTablesDB();
  try {
    const existing = await tablesDB.listRows({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("views"),
      queries: [Query.equal("postId", [postId]), Query.equal("userId", [userId]), Query.limit(1)],
    });

    if (existing.rows?.length) {
      return;
    }

    await tablesDB.createRow({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("views"),
      rowId: ID.unique(),
      data: { postId, userId, createdAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error("Error recording Appwrite view:", error);
  }
}

async function updatePostFlag(postId: string, field: "pinned" | "archived", value: boolean) {
  const tablesDB = getTablesDB();
  await tablesDB.updateRow({
    databaseId: getAppwriteDatabaseId(),
    tableId: getAppwriteTableId("posts"),
    rowId: postId,
    data: {
      [field]: value,
      updatedAt: new Date().toISOString(),
    },
  });
}

export async function toggleAppwritePinPost(postId: string): Promise<boolean> {
  const tablesDB = getTablesDB();
  try {
    const post = await tablesDB.getRow({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("posts"),
      rowId: postId,
    });

    await updatePostFlag(postId, "pinned", !post.pinned);
    return true;
  } catch (error) {
    console.error("Error toggling Appwrite pin:", error);
    return false;
  }
}

export async function archiveAppwritePost(postId: string): Promise<boolean> {
  try {
    await updatePostFlag(postId, "archived", true);
    return true;
  } catch (error) {
    console.error("Error archiving Appwrite post:", error);
    return false;
  }
}

export async function unarchiveAppwritePost(postId: string): Promise<boolean> {
  try {
    await updatePostFlag(postId, "archived", false);
    return true;
  } catch (error) {
    console.error("Error unarchiving Appwrite post:", error);
    return false;
  }
}

export async function deleteAppwritePost(postId: string): Promise<boolean> {
  const tablesDB = getTablesDB();
  try {
    const relatedTables = ["post_tags", "comments", "likes", "views"] as const;

    for (const table of relatedTables) {
      const key = table === "post_tags" ? "postId" : "postId";
      const rows = await tablesDB.listRows({
        databaseId: getAppwriteDatabaseId(),
        tableId: getAppwriteTableId(table),
        queries: [Query.equal(key, [postId])],
      });

      for (const row of rows.rows || []) {
        await tablesDB.deleteRow({
          databaseId: getAppwriteDatabaseId(),
          tableId: getAppwriteTableId(table),
          rowId: row.$id,
        });
      }
    }

    await tablesDB.deleteRow({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("posts"),
      rowId: postId,
    });

    return true;
  } catch (error) {
    console.error("Error deleting Appwrite post:", error);
    return false;
  }
}

export async function likeAppwritePost(postId: string, userId: string): Promise<boolean> {
  const tablesDB = getTablesDB();
  try {
    const existing = await tablesDB.listRows({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("likes"),
      queries: [Query.equal("postId", [postId]), Query.equal("userId", [userId]), Query.limit(1)],
    });

    const row = existing.rows?.[0];
    if (row) {
      await tablesDB.deleteRow({
        databaseId: getAppwriteDatabaseId(),
        tableId: getAppwriteTableId("likes"),
        rowId: row.$id,
      });
      return false;
    }

    await tablesDB.createRow({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("likes"),
      rowId: ID.unique(),
      data: { postId, userId, createdAt: new Date().toISOString() },
    });

    return true;
  } catch (error) {
    console.error("Error toggling Appwrite post like:", error);
    return false;
  }
}

export async function hasUserLikedAppwritePost(postId: string, userId: string): Promise<boolean> {
  const tablesDB = getTablesDB();
  try {
    const existing = await tablesDB.listRows({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("likes"),
      queries: [Query.equal("postId", [postId]), Query.equal("userId", [userId]), Query.limit(1)],
    });

    return Boolean(existing.rows?.length);
  } catch (error) {
    console.error("Error checking Appwrite post like:", error);
    return false;
  }
}

export async function addAppwriteComment(data: {
  content: string;
  post_id: string;
  author_id: string;
  parent_id?: string;
}): Promise<string | null> {
  const tablesDB = getTablesDB();
  try {
    const comment = await tablesDB.createRow({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("comments"),
      rowId: ID.unique(),
      data: {
        postId: data.post_id,
        authorId: data.author_id,
        content: data.content,
        parentId: data.parent_id || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    return comment.$id;
  } catch (error) {
    console.error("Error creating Appwrite comment:", error);
    return null;
  }
}

export async function deleteAppwriteComment(commentId: string): Promise<boolean> {
  const tablesDB = getTablesDB();
  try {
    const descendants = await tablesDB.listRows({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("comments"),
      queries: [Query.equal("parentId", [commentId])],
    });

    for (const row of descendants.rows || []) {
      await deleteAppwriteComment(row.$id);
    }

    const likes = await tablesDB.listRows({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("comment_likes"),
      queries: [Query.equal("commentId", [commentId])],
    });

    for (const row of likes.rows || []) {
      await tablesDB.deleteRow({
        databaseId: getAppwriteDatabaseId(),
        tableId: getAppwriteTableId("comment_likes"),
        rowId: row.$id,
      });
    }

    await tablesDB.deleteRow({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("comments"),
      rowId: commentId,
    });

    return true;
  } catch (error) {
    console.error("Error deleting Appwrite comment:", error);
    return false;
  }
}

export async function likeAppwriteComment(commentId: string, userId: string): Promise<boolean> {
  const tablesDB = getTablesDB();

  try {
    const existing = await tablesDB.listRows({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("comment_likes"),
      queries: [
        Query.equal("commentId", [commentId]),
        Query.equal("userId", [userId]),
        Query.limit(1),
      ],
    });

    if (existing.rows?.length) {
      return false;
    }

    await tablesDB.createRow({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("comment_likes"),
      rowId: ID.unique(),
      data: {
        commentId,
        userId,
        createdAt: new Date().toISOString(),
      },
    });

    return true;
  } catch (error) {
    console.error("Error liking Appwrite comment:", error);
    return false;
  }
}

export async function unlikeAppwriteComment(commentId: string, userId: string): Promise<boolean> {
  const tablesDB = getTablesDB();

  try {
    const existing = await tablesDB.listRows({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("comment_likes"),
      queries: [
        Query.equal("commentId", [commentId]),
        Query.equal("userId", [userId]),
        Query.limit(1),
      ],
    });

    const row = existing.rows?.[0];
    if (!row) {
      return true;
    }

    await tablesDB.deleteRow({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("comment_likes"),
      rowId: row.$id,
    });

    return true;
  } catch (error) {
    console.error("Error unliking Appwrite comment:", error);
    return false;
  }
}

export async function hasUserLikedAppwriteComment(
  commentId: string,
  userId: string
): Promise<boolean> {
  const tablesDB = getTablesDB();

  try {
    const existing = await tablesDB.listRows({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("comment_likes"),
      queries: [
        Query.equal("commentId", [commentId]),
        Query.equal("userId", [userId]),
        Query.limit(1),
      ],
    });

    return Boolean(existing.rows?.length);
  } catch (error) {
    console.error("Error checking Appwrite comment like:", error);
    return false;
  }
}
