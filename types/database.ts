export interface Profile {
  id: string;
  username: string;
  email?: string; // Опциональное поле для обратной совместимости с существующими профилями
  role: "student" | "teacher" | "admin";
  created_at: string;
  updated_at?: string;
  bio?: string;
  location?: string;
  website?: string;
  social?: {
    github?: string;
    vk?: string;
  };
  avatar_url?: string;
  preferredCategory?: string; // Предпочтительная категория публикаций
}

export interface OAuthAuditLogEvent {
  at: string;
  step: string;
  status: "running" | "success" | "error";
  message?: string;
}

export interface OAuthAuditLog {
  id: string;
  flow_id: string;
  provider: "github" | "google";
  source: "login" | "register" | "unknown";
  source_path?: string | null;
  redirect_to?: string | null;
  status: "running" | "success" | "error";
  current_step: string;
  last_message?: string | null;
  user_id?: string | null;
  username?: string | null;
  step_details: Record<string, string>;
  diagnostics: string[];
  events: OAuthAuditLogEvent[];
  ip_address?: string | null;
  user_agent?: string | null;
  started_at: string;
  last_event_at: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrphanProfileCandidate {
  profileId: string;
  email: string;
  username: string;
  role: "student" | "teacher" | "admin";
  createdAt: string;
  updatedAt?: string | null;
  emailExistsInAuth: boolean;
  idExistsInAuth: boolean;
  postsCount: number;
  commentsCount: number;
  likesCount: number;
  viewsCount: number;
  commentLikesCount: number;
  totalReferences: number;
}

export interface OrphanProfilesSnapshot {
  totalProfilesWithEmail: number;
  totalAuthUsersWithEmail: number;
  orphanProfilesCount: number;
  authWithoutProfileCount: number;
  candidates: OrphanProfileCandidate[];
}

export interface OrphanProfileBackfillResult {
  profileId: string;
  email: string;
  status: "success" | "error" | "skipped";
  message: string;
  newUserId?: string;
}

export interface OrphanProfileBackfillRun {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: OrphanProfileBackfillResult[];
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author_id?: string;
  author: {
    username: string;
    role: string;
  };
  created_at: string;
  category: "news" | "materials" | "project-ideas" | "archived";
  tags: string[];
  likesCount?: number;
  commentsCount?: number;
  viewsCount?: number;
  archived?: boolean;
  pinned?: boolean;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Comment {
  id: string;
  content: string;
  author: {
    username: string;
    role: string;
  };
  created_at: string;
  parent_id: string | null;
  replies?: Comment[];
  likesCount?: number;
}

export interface PostStats {
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
}
