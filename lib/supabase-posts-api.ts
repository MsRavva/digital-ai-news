import type { Post } from "@/types/database";
import { supabase } from "./supabase";

function normalizeTagNames(tags: string[]): string[] {
  const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
  return [...new Set(normalized)];
}

async function getOrCreateTagId(tagName: string): Promise<string | null> {
  const normalizedTag = tagName.trim();
  if (!normalizedTag) return null;

  const { data: existingTag, error: selectError } = await supabase
    .from("tags")
    .select("id")
    .eq("name", normalizedTag)
    .maybeSingle();

  if (selectError) {
    console.error("Error fetching tag:", selectError);
    return null;
  }

  if (existingTag?.id) {
    return existingTag.id;
  }

  const { data: createdTag, error: createError } = await supabase
    .from("tags")
    .insert({ name: normalizedTag })
    .select("id")
    .maybeSingle();

  if (!createError && createdTag?.id) {
    return createdTag.id;
  }

  const errorCode = createError?.code;
  const errorMessage = (createError?.message || "").toLowerCase();
  const isDuplicate =
    errorCode === "23505" || errorMessage.includes("duplicate") || errorMessage.includes("unique");

  if (isDuplicate) {
    const { data: retryTag, error: retryError } = await supabase
      .from("tags")
      .select("id")
      .eq("name", normalizedTag)
      .maybeSingle();

    if (retryError) {
      console.error("Error re-fetching duplicated tag:", retryError);
      return null;
    }

    return retryTag?.id || null;
  }

  console.error("Error creating tag:", createError);
  return null;
}

async function resolveTagIds(tags: string[]): Promise<string[] | null> {
  const tagIds: string[] = [];

  for (const tagName of normalizeTagNames(tags)) {
    const tagId = await getOrCreateTagId(tagName);
    if (!tagId) {
      return null;
    }
    tagIds.push(tagId);
  }

  return tagIds;
}

// Получение поста по ID
export async function getPostById(postId: string): Promise<Post | null> {
  try {
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select(
        `
        id,
        title,
        content,
        category,
        created_at,
        archived,
        pinned,
        author_id,
        profiles!posts_author_id_fkey (
          username,
          role
        )
      `
      )
      .eq("id", postId)
      .single();

    if (postError || !postData) {
      console.error("Error fetching post:", postError);
      return null;
    }

    // Получаем теги
    const { data: postTagsData } = await supabase
      .from("post_tags")
      .select("tag_id, tags!post_tags_tag_id_fkey(name)")
      .eq("post_id", postId);

    const tags: string[] = [];
    if (postTagsData) {
      postTagsData.forEach((pt) => {
        // tags может быть объектом или массивом в зависимости от запроса
        const tagsData = Array.isArray(pt.tags) ? pt.tags[0] : pt.tags;
        const tagName = (tagsData as { name: string } | null | undefined)?.name;
        if (tagName) {
          tags.push(tagName);
        }
      });
    }

    // Получаем статистику
    const { count: likesCount } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    const { count: commentsCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    const { count: viewsCount } = await supabase
      .from("views")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    // profiles может быть объектом или массивом в зависимости от запроса
    const profilesData = Array.isArray(postData.profiles)
      ? postData.profiles[0]
      : postData.profiles;
    const author = profilesData as { username: string; role: string } | null | undefined;

    return {
      id: postData.id,
      title: postData.title,
      content: postData.content,
      author_id: postData.author_id,
      author: {
        username: author?.username || "Unknown",
        role: author?.role || "student",
      },
      created_at: postData.created_at,
      category: postData.category as Post["category"],
      tags,
      likesCount: likesCount || 0,
      commentsCount: commentsCount || 0,
      viewsCount: viewsCount || 0,
      archived: postData.archived || false,
      pinned: postData.pinned || false,
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

// Создание поста
export async function createPost(data: {
  title: string;
  content: string;
  category: string;
  author_id: string;
  tags: string[];
  source_url?: string;
}): Promise<string | null> {
  let postId: string | null = null;

  try {
    const normalizedTags = normalizeTagNames(data.tags);

    // Создаем пост
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert({
        title: data.title,
        content: data.content,
        category: data.category,
        author_id: data.author_id,
        source_url: data.source_url || null,
        archived: false,
        pinned: false,
      })
      .select("id")
      .single();

    if (postError || !postData) {
      console.error("Error creating post:", postError);
      console.error("Post data:", data);
      console.error("Error details:", JSON.stringify(postError, null, 2));
      return null;
    }

    postId = postData.id;

    if (normalizedTags.length > 0) {
      const tagIds = await resolveTagIds(normalizedTags);
      if (!tagIds) {
        throw new Error("Не удалось подготовить теги публикации");
      }

      const relations = tagIds.map((tagId) => ({
        post_id: postId,
        tag_id: tagId,
      }));

      const { error: relationError } = await supabase.from("post_tags").insert(relations);

      if (relationError) {
        console.error("Error creating post tags relation:", relationError);
        throw new Error("Не удалось сохранить теги публикации");
      }
    }

    return postId;
  } catch (error) {
    console.error("Error creating post:", error);

    // Компенсация при частичном создании: удаляем пост, если он уже был создан.
    if (postId) {
      await supabase.from("post_tags").delete().eq("post_id", postId);
      await supabase.from("posts").delete().eq("id", postId);
    }

    return null;
  }
}

// Обновление поста
export async function updatePost(data: {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}): Promise<boolean> {
  try {
    const normalizedTags = normalizeTagNames(data.tags);
    const newTagIds = await resolveTagIds(normalizedTags);
    if (!newTagIds) {
      throw new Error("Не удалось подготовить теги публикации");
    }

    // Обновляем пост
    const { error: postError } = await supabase
      .from("posts")
      .update({
        title: data.title,
        content: data.content,
        category: data.category,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (postError) {
      console.error("Error updating post:", postError);
      return false;
    }

    const { data: currentRelations, error: currentRelationsError } = await supabase
      .from("post_tags")
      .select("tag_id")
      .eq("post_id", data.id);

    if (currentRelationsError) {
      console.error("Error fetching current post tags:", currentRelationsError);
      return false;
    }

    const currentTagIds = new Set((currentRelations || []).map((relation) => relation.tag_id));
    const nextTagIds = new Set(newTagIds);

    const toDelete = [...currentTagIds].filter((tagId) => !nextTagIds.has(tagId));
    const toInsert = [...nextTagIds].filter((tagId) => !currentTagIds.has(tagId));

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("post_tags")
        .delete()
        .eq("post_id", data.id)
        .in("tag_id", toDelete);

      if (deleteError) {
        console.error("Error deleting removed post tags:", deleteError);
        return false;
      }
    }

    if (toInsert.length > 0) {
      const relations = toInsert.map((tagId) => ({
        post_id: data.id,
        tag_id: tagId,
      }));

      const { error: insertError } = await supabase.from("post_tags").insert(relations);

      if (insertError) {
        console.error("Error inserting new post tags:", insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating post:", error);
    return false;
  }
}

// Запись просмотра
export async function recordView(postId: string, userId: string): Promise<void> {
  try {
    // Используем SQL функцию для безопасной записи просмотра
    // Функция использует ON CONFLICT DO NOTHING, что полностью предотвращает ошибку 409
    const { error: functionError } = await supabase.rpc("safe_record_view", {
      p_post_id: postId,
      p_user_id: userId,
    });

    // Если произошла ошибка, логируем её (но не прерываем выполнение)
    if (functionError) {
      console.error("Error recording view:", functionError);
    }
  } catch (error) {
    // Логируем ошибки, но не прерываем выполнение
    console.error("Error recording view:", error);
  }
}
