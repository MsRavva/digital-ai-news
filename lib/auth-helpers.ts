import type { Profile } from "@/types/database";
import { validateUsername } from "./validation";

export function shouldUpdateProfile(profile: Profile | null): boolean {
  if (!profile) return false;

  const usernameError = validateUsername(profile.username);
  const hasEmail = profile.email && profile.email.trim() !== "";

  return !!(usernameError || !hasEmail);
}

export function getProfileUpdateMessage(profile: Profile | null): string | null {
  if (!profile) return null;

  const hasEmail = profile.email && profile.email.trim() !== "";

  if (!hasEmail) {
    return "Пожалуйста, укажите ваш email";
  }

  const usernameError = validateUsername(profile.username);
  if (usernameError) {
    return "Пожалуйста, введите корректные Имя и Фамилию";
  }

  return null;
}

export function getRedirectUrl(searchParams: URLSearchParams | null, fallback = "/"): string {
  if (!searchParams) return fallback;

  const redirect = searchParams.get("redirect");

  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }

  return fallback;
}

export function hasRole(
  profile: Profile | null,
  roles: Array<"student" | "teacher" | "admin">
): boolean {
  if (!profile) return false;
  return roles.includes(profile.role);
}
