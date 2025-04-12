export interface Profile {
  id: string
  username: string
  role: "student" | "teacher" | "admin"
  created_at: string
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
  category: "news" | "materials" | "discussions"
  tags: string[]
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
}

export interface PostStats {
  likesCount: number
  commentsCount: number
  viewsCount: number
}
