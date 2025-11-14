import { supabase } from "./supabase"
import type { Post } from "@/types/database"

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
      `,
      )
      .eq("id", postId)
      .single()

    if (postError || !postData) {
      console.error("Error fetching post:", postError)
      return null
    }

    // Получаем теги
    const { data: postTagsData } = await supabase
      .from("post_tags")
      .select("tag_id, tags!post_tags_tag_id_fkey(name)")
      .eq("post_id", postId)

    const tags: string[] = []
    if (postTagsData) {
      postTagsData.forEach((pt) => {
        // tags может быть объектом или массивом в зависимости от запроса
        const tagsData = Array.isArray(pt.tags) ? pt.tags[0] : pt.tags
        const tagName = (tagsData as { name: string } | null | undefined)?.name
        if (tagName) {
          tags.push(tagName)
        }
      })
    }

    // Получаем статистику
    const { count: likesCount } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)

    const { count: commentsCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)

    const { count: viewsCount } = await supabase
      .from("views")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)

    // profiles может быть объектом или массивом в зависимости от запроса
    const profilesData = Array.isArray(postData.profiles)
      ? postData.profiles[0]
      : postData.profiles
    const author = profilesData as { username: string; role: string } | null | undefined

    return {
      id: postData.id,
      title: postData.title,
      content: postData.content,
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
    }
  } catch (error) {
    console.error("Error fetching post:", error)
    return null
  }
}

// Создание поста
export async function createPost(data: {
  title: string
  content: string
  category: string
  author_id: string
  tags: string[]
  source_url?: string
}): Promise<string | null> {
  try {
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
      .single()

    if (postError || !postData) {
      console.error("Error creating post:", postError)
      console.error("Post data:", data)
      console.error("Error details:", JSON.stringify(postError, null, 2))
      return null
    }

    const postId = postData.id

    // Создаем теги и связи с постом
    for (const tagName of data.tags) {
      // Проверяем, существует ли тег
      let { data: existingTag } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tagName)
        .single()

      let tagId: string

      if (!existingTag) {
        // Создаем новый тег
        const { data: newTag, error: tagError } = await supabase
          .from("tags")
          .insert({ name: tagName })
          .select("id")
          .single()

        if (tagError || !newTag) {
          console.error("Error creating tag:", tagError)
          continue
        }

        tagId = newTag.id
      } else {
        tagId = existingTag.id
      }

      // Создаем связь поста с тегом
      await supabase.from("post_tags").insert({
        post_id: postId,
        tag_id: tagId,
      })
    }

    return postId
  } catch (error) {
    console.error("Error creating post:", error)
    return null
  }
}

// Обновление поста
export async function updatePost(data: {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
}): Promise<boolean> {
  try {
    // Обновляем пост
    const { error: postError } = await supabase
      .from("posts")
      .update({
        title: data.title,
        content: data.content,
        category: data.category,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)

    if (postError) {
      console.error("Error updating post:", postError)
      return false
    }

    // Удаляем старые связи с тегами
    await supabase.from("post_tags").delete().eq("post_id", data.id)

    // Добавляем новые теги
    for (const tagName of data.tags) {
      // Проверяем, существует ли тег
      let { data: existingTag } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tagName)
        .single()

      let tagId: string

      if (!existingTag) {
        // Создаем новый тег
        const { data: newTag, error: tagError } = await supabase
          .from("tags")
          .insert({ name: tagName })
          .select("id")
          .single()

        if (tagError || !newTag) {
          console.error("Error creating tag:", tagError)
          continue
        }

        tagId = newTag.id
      } else {
        tagId = existingTag.id
      }

      // Создаем связь поста с тегом
      await supabase.from("post_tags").insert({
        post_id: data.id,
        tag_id: tagId,
      })
    }

    return true
  } catch (error) {
    console.error("Error updating post:", error)
    return false
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
    })

    // Если произошла ошибка, логируем её (но не прерываем выполнение)
    if (functionError) {
      console.error("Error recording view:", functionError)
    }
  } catch (error) {
    // Логируем ошибки, но не прерываем выполнение
    console.error("Error recording view:", error)
  }
}

