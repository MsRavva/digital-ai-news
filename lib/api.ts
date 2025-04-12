import { createServerSupabaseClient } from "./supabase"

export async function getPosts(category?: string) {
  const supabase = createServerSupabaseClient()

  // First, get the posts
  let query = supabase.from("posts").select("*")

  if (category) {
    query = query.eq("category", category)
  }

  query = query.order("created_at", { ascending: false })

  const { data: posts, error } = await query

  if (error) {
    console.error("Error fetching posts:", error)
    return []
  }

  if (!posts || posts.length === 0) {
    return []
  }

  // Get author information for all posts
  const authorIds = [...new Set(posts.map((post) => post.author_id))]
  const { data: authors } = await supabase.from("profiles").select("id, username, role").in("id", authorIds)

  // Create a map of author IDs to author data
  const authorMap = new Map()
  authors?.forEach((author) => {
    authorMap.set(author.id, author)
  })

  // Get post tags
  const { data: postTags } = await supabase
    .from("post_tags")
    .select("post_id, tag_id")
    .in(
      "post_id",
      posts.map((post) => post.id),
    )

  // Group tags by post ID
  const postTagsMap = new Map()
  postTags?.forEach((pt) => {
    if (!postTagsMap.has(pt.post_id)) {
      postTagsMap.set(pt.post_id, [])
    }
    postTagsMap.get(pt.post_id).push(pt.tag_id)
  })

  // Get all tag IDs
  const tagIds = [...new Set(postTags?.map((pt) => pt.tag_id) || [])]

  // Get tag names
  const { data: tags } = await supabase.from("tags").select("id, name").in("id", tagIds)

  // Create a map of tag IDs to tag names
  const tagMap = new Map()
  tags?.forEach((tag) => {
    tagMap.set(tag.id, tag.name)
  })

  // Get post stats
  const postStats = await Promise.all(
    posts.map(async (post) => {
      const stats = await getPostStats(post.id)
      return { postId: post.id, stats }
    }),
  )

  // Create a map of post IDs to stats
  const statsMap = new Map()
  postStats.forEach(({ postId, stats }) => {
    statsMap.set(postId, stats)
  })

  // Transform the data to match our UI needs
  return posts.map((post) => {
    const author = authorMap.get(post.author_id) || { username: "Unknown", role: "student" }
    const tagIds = postTagsMap.get(post.id) || []
    const postTags = tagIds.map((tagId) => tagMap.get(tagId)).filter(Boolean)
    const stats = statsMap.get(post.id) || { likesCount: 0, commentsCount: 0, viewsCount: 0 }

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        username: author.username,
        role: author.role,
      },
      created_at: post.created_at,
      category: post.category,
      tags: postTags,
      ...stats,
    }
  })
}

export async function getPostById(id: string) {
  const supabase = createServerSupabaseClient()

  // Get the post
  const { data: post, error } = await supabase.from("posts").select("*").eq("id", id).single()

  if (error || !post) {
    console.error("Error fetching post:", error)
    return null
  }

  // Get the author
  const { data: author } = await supabase.from("profiles").select("username, role").eq("id", post.author_id).single()

  // Get post tags
  const { data: postTags } = await supabase.from("post_tags").select("tag_id").eq("post_id", post.id)

  // Get tag names
  const tagIds = postTags?.map((pt) => pt.tag_id) || []
  const { data: tags } = await supabase.from("tags").select("name").in("id", tagIds)

  const postTags2 = tags?.map((tag) => tag.name) || []

  // Get stats
  const stats = await getPostStats(post.id)

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    author: {
      username: author?.username || "Unknown",
      role: author?.role || "student",
    },
    created_at: post.created_at,
    category: post.category,
    tags: postTags2,
    ...stats,
  }
}

export async function createPost(data: {
  title: string
  content: string
  category: string
  author_id: string
  tags: string[]
}) {
  const supabase = createServerSupabaseClient()

  // Insert post
  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      title: data.title,
      content: data.content,
      category: data.category,
      author_id: data.author_id,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating post:", error)
    throw error
  }

  // Process tags
  for (const tagName of data.tags) {
    // Check if tag exists
    const { data: existingTag } = await supabase.from("tags").select("id").eq("name", tagName).single()

    let tagId

    if (!existingTag) {
      // Create tag
      const { data: newTag, error: tagError } = await supabase.from("tags").insert({ name: tagName }).select().single()

      if (tagError) {
        console.error("Error creating tag:", tagError)
        continue
      }

      tagId = newTag.id
    } else {
      tagId = existingTag.id
    }

    // Create post_tag relationship
    await supabase.from("post_tags").insert({
      post_id: post.id,
      tag_id: tagId,
    })
  }

  return post
}

export async function getCommentsByPostId(postId: string) {
  const supabase = createServerSupabaseClient()

  // Get comments
  const { data: comments, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching comments:", error)
    return []
  }

  if (!comments || comments.length === 0) {
    return []
  }

  // Get author information
  const authorIds = [...new Set(comments.map((comment) => comment.author_id))]
  const { data: authors } = await supabase.from("profiles").select("id, username, role").in("id", authorIds)

  // Create a map of author IDs to author data
  const authorMap = new Map()
  authors?.forEach((author) => {
    authorMap.set(author.id, author)
  })

  // Transform the data
  const transformedComments = comments.map((comment) => {
    const author = authorMap.get(comment.author_id) || { username: "Unknown", role: "student" }

    return {
      id: comment.id,
      content: comment.content,
      author: {
        username: author.username,
        role: author.role,
      },
      created_at: comment.created_at,
      parent_id: comment.parent_id,
    }
  })

  // Organize into a tree structure
  const commentMap = new Map()
  const rootComments: any[] = []

  transformedComments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  transformedComments.forEach((comment) => {
    if (comment.parent_id) {
      const parentComment = commentMap.get(comment.parent_id)
      if (parentComment) {
        parentComment.replies.push(commentMap.get(comment.id))
      }
    } else {
      rootComments.push(commentMap.get(comment.id))
    }
  })

  return rootComments
}

export async function addComment(data: {
  content: string
  post_id: string
  author_id: string
  parent_id?: string
}) {
  const supabase = createServerSupabaseClient()

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      content: data.content,
      post_id: data.post_id,
      author_id: data.author_id,
      parent_id: data.parent_id,
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding comment:", error)
    throw error
  }

  return comment
}

export async function getAllTags() {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.from("tags").select("*")

  if (error) {
    console.error("Error fetching tags:", error)
    return []
  }

  return data
}

export async function getPostStats(postId: string) {
  const supabase = createServerSupabaseClient()

  // Get likes count
  const { count: likesCount } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)

  // Get comments count
  const { count: commentsCount } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)

  // Get views count
  const { count: viewsCount } = await supabase
    .from("views")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)

  return {
    likesCount: likesCount || 0,
    commentsCount: commentsCount || 0,
    viewsCount: viewsCount || 0,
  }
}

// Likes API
export async function likePost(postId: string, userId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("likes")
    .insert({
      post_id: postId,
      user_id: userId,
    })
    .select()
    .single()

  if (error) {
    // If the error is a duplicate key error, the user already liked the post
    if (error.code === "23505") {
      // Remove the like
      const { error: unlikeError } = await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId)

      if (unlikeError) {
        console.error("Error unliking post:", unlikeError)
        return { error: unlikeError }
      }

      return { liked: false, error: null }
    }

    console.error("Error liking post:", error)
    return { error }
  }

  return { liked: true, error: null }
}

// Views API
export async function recordView(postId: string, userId: string) {
  const supabase = createServerSupabaseClient()

  // Check if the user has already viewed the post
  const { data: existingView } = await supabase
    .from("views")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single()

  if (!existingView) {
    // Record the view
    const { error } = await supabase.from("views").insert({
      post_id: postId,
      user_id: userId,
    })

    if (error) {
      console.error("Error recording view:", error)
    }
  }
}
