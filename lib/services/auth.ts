import type { AuthError, User } from "@supabase/supabase-js";
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

export type OAuthProvider = "github" | "google";

export async function getOAuthRedirectUrl(
  provider: OAuthProvider,
  next?: string
): Promise<{ url: string | null; callbackUrl: string; error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite OAuth flow is not connected yet.");
    default:
      return getSupabaseOAuthRedirectUrl(provider, next);
  }
}

export async function signUp(
  email: string,
  password: string,
  username: string,
  role?: "student" | "teacher" | "admin"
): Promise<{ user: User | null; error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite sign-up flow is not connected yet.");
    default:
      return signUpWithSupabase(email, password, username, role);
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite sign-in flow is not connected yet.");
    default:
      return signInWithSupabase(email, password);
  }
}

export async function signInWithGoogle(next?: string): Promise<{ error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite Google OAuth flow is not connected yet.");
    default:
      return signInWithSupabaseGoogle(next);
  }
}

export async function signInWithGithub(next?: string): Promise<{ error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite GitHub OAuth flow is not connected yet.");
    default:
      return signInWithSupabaseGithub(next);
  }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite sign-out flow is not connected yet.");
    default:
      return signOutWithSupabase();
  }
}

export async function getCurrentUser(): Promise<User | null> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite current-user flow is not connected yet.");
    default:
      return getSupabaseCurrentUser();
  }
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite profile flow is not connected yet.");
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
      throw new Error("Appwrite profile update flow is not connected yet.");
    default:
      return updateSupabaseUserProfile(userId, profileData);
  }
}

export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite password reset flow is not connected yet.");
    default:
      return resetSupabasePassword(email);
  }
}

export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite password update flow is not connected yet.");
    default:
      return updateSupabasePassword(newPassword);
  }
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite auth subscription flow is not connected yet.");
    default:
      return subscribeToSupabaseAuthChanges(callback);
  }
}
