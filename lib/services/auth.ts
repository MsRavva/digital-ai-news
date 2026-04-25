import type { AuthError } from "@supabase/supabase-js";
import { getBackendProvider } from "@/lib/backend-provider";
import {
  getCurrentUser as getSupabaseCurrentUser,
  getOAuthRedirectUrl as getSupabaseOAuthRedirectUrl,
  getUserProfile as getSupabaseUserProfile,
  resetPassword as resetSupabasePassword,
  signIn as signInWithSupabase,
  signInWithGithub as signInWithSupabaseGithub,
  signInWithGoogle as signInWithSupabaseGoogle,
  signOut as signOutWithSupabase,
  signUp as signUpWithSupabase,
  subscribeToAuthChanges as subscribeToSupabaseAuthChanges,
  updatePassword as updateSupabasePassword,
  updateUserProfile as updateSupabaseUserProfile,
} from "@/lib/supabase-auth";
import type { Profile } from "@/types/database";

export interface AuthUser {
  id: string;
  email?: string;
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = (await response.json().catch(() => null)) as
    | { error?: AuthError; user?: T }
    | T
    | null;

  if (!response.ok) {
    throw (
      (data && typeof data === "object" && "error" in data ? data.error : null) || {
        message: `Request failed with status ${response.status}`,
        status: response.status,
      }
    );
  }

  return data as T;
}

export type OAuthProvider = "github" | "google";

export async function getOAuthRedirectUrl(
  provider: OAuthProvider,
  next?: string
): Promise<{ url: string | null; callbackUrl: string; error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      try {
        return await requestJson<{
          url: string | null;
          callbackUrl: string;
          error: AuthError | null;
        }>(
          `/auth/callback?provider=appwrite-init&oauth_provider=${provider}${next ? `&next=${encodeURIComponent(next)}` : ""}`,
          { method: "GET", headers: {} }
        );
      } catch (error) {
        return { url: null, callbackUrl: "", error: error as AuthError };
      }
    default:
      return getSupabaseOAuthRedirectUrl(provider, next);
  }
}

export async function signUp(
  email: string,
  password: string,
  username: string,
  role?: "student" | "teacher" | "admin"
): Promise<{ user: AuthUser | null; error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      try {
        const result = await requestJson<{ user: AuthUser }>("/api/auth/appwrite/register", {
          method: "POST",
          body: JSON.stringify({ email, password, username, role }),
        });
        return { user: result.user, error: null };
      } catch (error) {
        return { user: null, error: error as AuthError };
      }
    default:
      return signUpWithSupabase(email, password, username, role);
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      try {
        const result = await requestJson<{ user: AuthUser }>("/api/auth/appwrite/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        return { user: result.user, error: null };
      } catch (error) {
        return { user: null, error: error as AuthError };
      }
    default:
      return signInWithSupabase(email, password);
  }
}

export async function signInWithGoogle(next?: string): Promise<{ error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      return getOAuthRedirectUrl("google", next).then(({ error }) => ({ error }));
    default:
      return signInWithSupabaseGoogle(next);
  }
}

export async function signInWithGithub(next?: string): Promise<{ error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      return getOAuthRedirectUrl("github", next).then(({ error }) => ({ error }));
    default:
      return signInWithSupabaseGithub(next);
  }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      try {
        await requestJson<{ success: true }>("/api/auth/appwrite/logout", { method: "POST" });
        if (typeof window !== "undefined") {
          window.location.replace("/login");
        }
        return { error: null };
      } catch (error) {
        return { error: error as AuthError };
      }
    default:
      return signOutWithSupabase();
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  switch (getBackendProvider()) {
    case "appwrite":
      try {
        const result = await requestJson<{ user: AuthUser | null; profile: Profile | null }>(
          "/api/auth/appwrite/me",
          { method: "GET" }
        );
        return result.user;
      } catch {
        return null;
      }
    default:
      return getSupabaseCurrentUser();
  }
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  switch (getBackendProvider()) {
    case "appwrite":
      try {
        const result = await requestJson<{ user: AuthUser | null; profile: Profile | null }>(
          "/api/auth/appwrite/me",
          { method: "GET" }
        );
        return result.user?.id === userId ? result.profile : null;
      } catch {
        return null;
      }
    default:
      return getSupabaseUserProfile(userId);
  }
}

export async function updateUserProfile(
  userId: string,
  profileData: Partial<Profile>
): Promise<{ success: boolean; error: unknown }> {
  switch (getBackendProvider()) {
    case "appwrite":
      try {
        const result = await requestJson<{ success: boolean; error: unknown }>(
          "/api/appwrite/profile",
          {
            method: "PATCH",
            body: JSON.stringify({ profileData }),
          }
        );

        return result;
      } catch (error) {
        return { success: false, error };
      }
    default:
      return updateSupabaseUserProfile(userId, profileData);
  }
}

export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      try {
        await requestJson<{ success: true }>("/api/auth/appwrite/recovery", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        return { error: null };
      } catch (error) {
        return { error: error as AuthError };
      }
    default:
      return resetSupabasePassword(email);
  }
}

export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      if (typeof window === "undefined") {
        return { error: { message: "Recovery context is not available" } as AuthError };
      }

      try {
        const url = new URL(window.location.href);
        const userId = url.searchParams.get("userId");
        const secret = url.searchParams.get("secret");

        if (!userId || !secret) {
          return { error: { message: "Recovery token is missing" } as AuthError };
        }

        await requestJson<{ success: true }>("/api/auth/appwrite/recovery", {
          method: "PUT",
          body: JSON.stringify({ userId, secret, password: newPassword }),
        });

        return { error: null };
      } catch (error) {
        return { error: error as AuthError };
      }
    default:
      return updateSupabasePassword(newPassword);
  }
}

export function subscribeToAuthChanges(callback: (user: AuthUser | null) => void) {
  switch (getBackendProvider()) {
    case "appwrite": {
      let stopped = false;

      void getCurrentUser().then((user) => {
        if (!stopped) {
          callback(user as never);
        }
      });

      return () => {
        stopped = true;
      };
    }
    default:
      return subscribeToSupabaseAuthChanges(callback);
  }
}
