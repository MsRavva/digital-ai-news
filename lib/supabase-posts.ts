import { supabase } from "./supabase"
import type { Post } from "@/types/database"

// Получение всех постов
export async function getPosts(
  category?: string,
  includeArchived = false,
  archivedOnly = false,
): Promise<Post[]> {
  try {
    let query = supabase
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

    // Добавляем фильтр по категории, если указана
    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    // Добавляем фильтр по архивации
    if (archivedOnly) {
      query = query.eq("archived", true)
    } else if (!includeArchived) {
      query = query.or("archived.eq.false,archived.is.null")
    }

    // Сортировка: сначала закрепленные, затем по дате
    query = query.order("pinned", { ascending: false }).order("created_at", { ascending: false })

    const { data: postsData, error: postsError } = await query

    if (postsError) {
      console.error("Error fetching posts:", postsError)
      return []
    }

    if (!postsData) {
      return []
    }

    // Получаем ID всех постов
    const postIds = postsData.map((post) => post.id)

    // Получаем теги для всех постов
    const { data: postTagsData, error: postTagsError } = await supabase
      .from("post_tags")
      .select("post_id, tag_id, tags!post_tags_tag_id_fkey(name)")
      .in("post_id", postIds)

    if (postTagsError) {
      console.error("Error fetching post tags:", postTagsError)
    }

    // Группируем теги по постам
    const postTagsMap = new Map<string, string[]>()
    if (postTagsData) {
      postTagsData.forEach((pt) => {
        if (!postTagsMap.has(pt.post_id)) {
          postTagsMap.set(pt.post_id, [])
        }
        // tags может быть объектом или массивом в зависимости от запроса
        const tagsData = Array.isArray(pt.tags) ? pt.tags[0] : pt.tags
        const tagName = (tagsData as { name: string } | null | undefined)?.name
        if (tagName) {
          postTagsMap.get(pt.post_id)!.push(tagName)
        }
      })
    }

    // Получаем статистику (лайки, комментарии, просмотры)
    const { data: likesData } = await supabase
      .from("likes")
      .select("post_id")
      .in("post_id", postIds)

    const { data: commentsData } = await supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds)

    const { data: viewsData } = await supabase
      .from("views")
      .select("post_id")
      .in("post_id", postIds)

    // Подсчитываем статистику
    const likesCountMap = new Map<string, number>()
    const commentsCountMap = new Map<string, number>()
    const viewsCountMap = new Map<string, number>()

    likesData?.forEach((like) => {
      likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1)
    })

    commentsData?.forEach((comment) => {
      commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1)
    })

    viewsData?.forEach((view) => {
      viewsCountMap.set(view.post_id, (viewsCountMap.get(view.post_id) || 0) + 1)
    })

    // Формируем итоговый массив постов
    const posts: Post[] = postsData.map((post) => {
      // profiles может быть объектом или массивом в зависимости от запроса
      const profilesData = Array.isArray(post.profiles)
        ? post.profiles[0]
        : post.profiles
      const author = profilesData as { username: string; role: string } | null | undefined

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        author: {
          username: author?.username || "Unknown",
          role: author?.role || "student",
        },
        created_at: post.created_at,
        category: post.category as Post["category"],
        tags: postTagsMap.get(post.id) || [],
        likesCount: likesCountMap.get(post.id) || 0,
        commentsCount: commentsCountMap.get(post.id) || 0,
        viewsCount: viewsCountMap.get(post.id) || 0,
        archived: post.archived || false,
        pinned: post.pinned || false,
      }
    })

    return posts
  } catch (error) {
    console.error("Error fetching posts:", error)
    return []
  }
}

