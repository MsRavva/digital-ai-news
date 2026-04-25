import { cookies } from "next/headers";
import { Account, OAuthProvider, Query } from "node-appwrite";
import { createAdminClient as createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Profile } from "@/types/database";
import { getAppwritePublicConfig, getAppwriteSessionCookieName } from "./env";
import { createAppwriteAdminClient, createAppwriteSessionClient } from "./server";
import { getAppwriteDatabaseId, getAppwriteTableId } from "./tables";

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthErrorLike {
  message: string;
  code?: string | number;
  status?: number;
}

interface LegacySupabaseProfile {
  id: string;
  username: string;
  email?: string | null;
  role: Profile["role"];
  created_at: string;
  updated_at?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  social?: Profile["social"] | null;
  avatar_url?: string | null;
  preferred_category?: string | null;
}

function toAuthError(error: unknown, fallback: string): AuthErrorLike {
  if (error instanceof Error) {
    const errorLike = error as Error & { code?: string | number; status?: number; type?: string };
    return {
      message: errorLike.message || fallback,
      code: errorLike.code || errorLike.type,
      status: errorLike.status,
    };
  }

  return { message: fallback };
}

export function getAppwriteSessionCookieConfig(expiresAt?: string | Date) {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/",
    ...(expiresAt ? { expires: new Date(expiresAt) } : {}),
  };
}

export async function setAppwriteSessionCookie(sessionSecret: string, expiresAt?: string) {
  const config = getAppwritePublicConfig();
  if (!config) {
    throw new Error("Appwrite public config is not available.");
  }

  const cookieStore = await cookies();
  cookieStore.set(
    getAppwriteSessionCookieName(config.projectId),
    sessionSecret,
    getAppwriteSessionCookieConfig(expiresAt)
  );
}

export async function clearAppwriteSessionCookie() {
  const config = getAppwritePublicConfig();
  if (!config) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.delete(getAppwriteSessionCookieName(config.projectId));
}

export async function getAppwriteSessionSecret(): Promise<string | null> {
  const config = getAppwritePublicConfig();
  if (!config) {
    return null;
  }

  const cookieStore = await cookies();
  return cookieStore.get(getAppwriteSessionCookieName(config.projectId))?.value || null;
}

export async function getAppwriteCurrentUser(): Promise<AuthUser | null> {
  const sessionSecret = await getAppwriteSessionSecret();
  if (!sessionSecret) {
    return null;
  }

  const sessionClient = createAppwriteSessionClient(sessionSecret);
  if (!sessionClient) {
    return null;
  }

  try {
    const account = new Account(sessionClient.client);
    const user = await account.get();
    return {
      id: user.$id,
      email: user.email || undefined,
    };
  } catch (error) {
    console.error("Error getting Appwrite current user:", error);
    return null;
  }
}

export async function getAppwriteProfile(userId: string): Promise<Profile | null> {
  const admin = createAppwriteAdminClient();
  if (!admin) {
    return null;
  }

  try {
    const profiles = await admin.tablesDB.listRows({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("profiles"),
      queries: [Query.equal("userId", [userId]), Query.limit(1)],
    });

    const row = profiles.rows?.[0] as unknown as
      | {
          userId: string;
          username: string;
          email?: string | null;
          role: Profile["role"];
          createdAt: string;
          updatedAt?: string | null;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          social?: string | null;
          avatarUrl?: string | null;
          preferredCategory?: string | null;
        }
      | undefined;

    if (!row) {
      return null;
    }

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
      social: row.social ? (JSON.parse(row.social) as Profile["social"]) : undefined,
      avatar_url: row.avatarUrl || undefined,
      preferredCategory: row.preferredCategory || undefined,
    };
  } catch (error) {
    console.error("Error getting Appwrite profile:", error);
    return null;
  }
}

export async function createEmailPasswordAppwriteSession(email: string, password: string) {
  const admin = createAppwriteAdminClient();
  if (!admin) {
    return { session: null, error: { message: "Appwrite admin client is not configured." } };
  }

  try {
    const account = new Account(admin.client);
    const session = await account.createEmailPasswordSession({ email, password });
    return { session, error: null };
  } catch (error) {
    return { session: null, error: toAuthError(error, "Не удалось создать Appwrite session") };
  }
}

async function findLegacySupabaseProfileByEmail(
  email: string
): Promise<LegacySupabaseProfile | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error reading legacy Supabase profile for relink:", error);
      return null;
    }

    return (data as LegacySupabaseProfile | null) || null;
  } catch (error) {
    console.error("Unexpected relink lookup error:", error);
    return null;
  }
}

async function upsertAppwriteProfileForUser(params: {
  userId: string;
  email?: string;
  fallbackUsername: string;
  role?: Profile["role"];
}) {
  const admin = createAppwriteAdminClient();
  if (!admin) {
    throw new Error("Appwrite admin client is not configured.");
  }

  const legacyProfile = params.email ? await findLegacySupabaseProfileByEmail(params.email) : null;
  const existingRows = await admin.tablesDB.listRows({
    databaseId: getAppwriteDatabaseId(),
    tableId: getAppwriteTableId("profiles"),
    queries: [Query.equal("userId", [params.userId]), Query.limit(1)],
  });

  const existingRow = existingRows.rows?.[0];
  const profileData = {
    userId: params.userId,
    legacySupabaseUserId: legacyProfile?.id || null,
    email: params.email || legacyProfile?.email || null,
    username: legacyProfile?.username || params.fallbackUsername,
    role: legacyProfile?.role || params.role || "student",
    bio: legacyProfile?.bio || null,
    location: legacyProfile?.location || null,
    website: legacyProfile?.website || null,
    social: legacyProfile?.social ? JSON.stringify(legacyProfile.social) : null,
    avatarUrl: legacyProfile?.avatar_url || null,
    preferredCategory: legacyProfile?.preferred_category || null,
    createdAt: legacyProfile?.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingRow) {
    await admin.tablesDB.updateRow({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("profiles"),
      rowId: existingRow.$id,
      data: profileData,
    });
    return;
  }

  await admin.tablesDB.createRow({
    databaseId: getAppwriteDatabaseId(),
    tableId: getAppwriteTableId("profiles"),
    rowId: "unique()",
    data: profileData,
  });
}

export async function createAppwriteUser(params: {
  email: string;
  password: string;
  username: string;
  role?: "student" | "teacher" | "admin";
}) {
  const admin = createAppwriteAdminClient();
  if (!admin) {
    return { user: null, error: { message: "Appwrite admin client is not configured." } };
  }

  try {
    const createdUser = await admin.users.create({
      userId: "unique()",
      email: params.email,
      password: params.password,
      name: params.username,
    });

    await upsertAppwriteProfileForUser({
      userId: createdUser.$id,
      email: params.email,
      fallbackUsername: params.username,
      role: params.role || "student",
    });

    return {
      user: {
        id: createdUser.$id,
        email: createdUser.email || undefined,
      },
      error: null,
    };
  } catch (error) {
    return { user: null, error: toAuthError(error, "Не удалось создать Appwrite пользователя") };
  }
}

export async function deleteCurrentAppwriteSession() {
  const sessionSecret = await getAppwriteSessionSecret();
  if (!sessionSecret) {
    return { error: null };
  }

  const sessionClient = createAppwriteSessionClient(sessionSecret);
  if (!sessionClient) {
    return { error: null };
  }

  try {
    const account = new Account(sessionClient.client);
    await account.deleteSession({ sessionId: "current" });
    return { error: null };
  } catch (error) {
    return { error: toAuthError(error, "Не удалось удалить Appwrite session") };
  }
}

export async function ensureAppwriteProfileForCurrentUser() {
  const sessionUser = await getAppwriteCurrentUser();
  if (!sessionUser) {
    return null;
  }

  await upsertAppwriteProfileForUser({
    userId: sessionUser.id,
    email: sessionUser.email,
    fallbackUsername: sessionUser.email?.split("@")[0] || "user",
  });

  return getAppwriteProfile(sessionUser.id);
}

export async function getAppwriteOAuthRedirectUrl(provider: "github" | "google", next?: string) {
  const admin = createAppwriteAdminClient();
  const config = getAppwritePublicConfig();

  if (!admin || !config) {
    return {
      url: null,
      callbackUrl: "",
      error: { message: "Appwrite config is not available." } as AuthErrorLike,
    };
  }

  const origin = process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL || "http://localhost:3000";
  const successUrl = new URL("/auth/callback", origin);
  successUrl.searchParams.set("provider", "appwrite");
  if (next) {
    successUrl.searchParams.set("next", next);
  }

  const failureUrl = new URL("/login", origin);
  failureUrl.searchParams.set("error", "auth_failed");

  try {
    const account = new Account(admin.client);
    const url = await account.createOAuth2Token({
      provider: provider === "github" ? OAuthProvider.Github : OAuthProvider.Google,
      success: successUrl.toString(),
      failure: failureUrl.toString(),
    });

    return { url, callbackUrl: successUrl.toString(), error: null };
  } catch (error) {
    return {
      url: null,
      callbackUrl: successUrl.toString(),
      error: toAuthError(error, "Не удалось подготовить Appwrite OAuth URL"),
    };
  }
}

export async function createAppwriteOAuthSession(userId: string, secret: string) {
  const admin = createAppwriteAdminClient();
  if (!admin) {
    return { session: null, error: { message: "Appwrite admin client is not configured." } };
  }

  try {
    const account = new Account(admin.client);
    const session = await account.createSession({ userId, secret });
    return { session, error: null };
  } catch (error) {
    return {
      session: null,
      error: toAuthError(error, "Не удалось завершить Appwrite OAuth session"),
    };
  }
}

export async function createAppwriteRecovery(email: string) {
  const admin = createAppwriteAdminClient();
  if (!admin) {
    return { error: { message: "Appwrite admin client is not configured." } };
  }

  try {
    const origin = process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL || "http://localhost:3000";
    const recoveryUrl = new URL("/reset-password", origin);
    recoveryUrl.searchParams.set("provider", "appwrite");

    const account = new Account(admin.client);
    await account.createRecovery({ email, url: recoveryUrl.toString() });

    return { error: null };
  } catch (error) {
    return { error: toAuthError(error, "Не удалось отправить Appwrite recovery email") };
  }
}

export async function updateAppwriteRecovery(userId: string, secret: string, password: string) {
  const admin = createAppwriteAdminClient();
  if (!admin) {
    return { error: { message: "Appwrite admin client is not configured." } };
  }

  try {
    const account = new Account(admin.client);
    await account.updateRecovery({ userId, secret, password });
    return { error: null };
  } catch (error) {
    return { error: toAuthError(error, "Не удалось обновить пароль через Appwrite recovery") };
  }
}

export async function updateAppwriteProfile(userId: string, profileData: Partial<Profile>) {
  const admin = createAppwriteAdminClient();
  if (!admin) {
    return { success: false, error: { message: "Appwrite admin client is not configured." } };
  }

  try {
    const rows = await admin.tablesDB.listRows({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("profiles"),
      queries: [Query.equal("userId", [userId]), Query.limit(1)],
    });

    const row = rows.rows?.[0];
    if (!row) {
      return { success: false, error: { message: "Profile not found" } };
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (profileData.username !== undefined) updateData.username = profileData.username;
    if (profileData.email !== undefined) updateData.email = profileData.email;
    if (profileData.bio !== undefined) updateData.bio = profileData.bio;
    if (profileData.location !== undefined) updateData.location = profileData.location;
    if (profileData.website !== undefined) updateData.website = profileData.website;
    if (profileData.social !== undefined) updateData.social = JSON.stringify(profileData.social);
    if (profileData.avatar_url !== undefined) updateData.avatarUrl = profileData.avatar_url;
    if (profileData.preferredCategory !== undefined) {
      updateData.preferredCategory = profileData.preferredCategory;
    }

    await admin.tablesDB.updateRow({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("profiles"),
      rowId: row.$id,
      data: updateData,
    });

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toAuthError(error, "Не удалось обновить Appwrite профиль") };
  }
}

export async function updateAppwriteUserPreferences(
  userId: string,
  preferences: {
    preferredCategory?: string;
    preferredViewMode?: "table" | "bento";
    themePreference?: "light" | "dark" | "system";
  }
) {
  const admin = createAppwriteAdminClient();
  if (!admin) {
    return false;
  }

  try {
    const rows = await admin.tablesDB.listRows({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("profiles"),
      queries: [Query.equal("userId", [userId]), Query.limit(1)],
    });

    const row = rows.rows?.[0];
    if (!row) {
      return false;
    }

    await admin.tablesDB.updateRow({
      databaseId: getAppwriteDatabaseId(),
      tableId: getAppwriteTableId("profiles"),
      rowId: row.$id,
      data: {
        updatedAt: new Date().toISOString(),
        ...(preferences.preferredCategory !== undefined
          ? { preferredCategory: preferences.preferredCategory }
          : {}),
        ...(preferences.preferredViewMode !== undefined
          ? { preferredViewMode: preferences.preferredViewMode }
          : {}),
        ...(preferences.themePreference !== undefined
          ? { themePreference: preferences.themePreference }
          : {}),
      },
    });

    return true;
  } catch (error) {
    console.error("Error updating Appwrite preferences:", error);
    return false;
  }
}
