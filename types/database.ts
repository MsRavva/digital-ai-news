export interface Profile {
  id: string
  username: string
  role: "student" | "teacher" | "admin"
  created_at: string
  updated_at?: string
  bio?: string
  location?: string
  website?: string
  social?: {
    github?: string
    vk?: string
  }
  avatar_url?: string
}

export interface Post {
  id: string
  title: string
  content: string
  author: {
    username: string
    role: string
  }
  created_at: string
  category: "news" | "materials" | "project-ideas" | "archived"
  tags: string[]
  likesCount?: number
  commentsCount?: number
  viewsCount?: number
  archived?: boolean
  pinned?: boolean
}

export interface Tag {
  id: string
  name: string
}

export interface Comment {
  id: string
  content: string
  author: {
    username: string
    role: string
  }
  created_at: string
  parent_id: string | null
  replies?: Comment[]
  likesCount?: number
}

export interface PostStats {
  likesCount: number
  commentsCount: number
  viewsCount: number
}
