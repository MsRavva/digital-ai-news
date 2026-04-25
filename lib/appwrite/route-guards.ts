import { NextResponse } from "next/server";
import { getAppwriteCurrentUser, getAppwriteProfile } from "@/lib/appwrite/auth";
import { getBackendProvider } from "@/lib/backend-provider";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function requireSupabaseUser() {
  if (getBackendProvider() === "appwrite") {
    const user = await getAppwriteCurrentUser();

    if (!user) {
      return {
        user: null,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    return { user, response: null };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, response: null };
}

export async function requireAdminOrTeacher() {
  const auth = await requireSupabaseUser();
  if (auth.response || !auth.user) {
    return auth;
  }

  if (getBackendProvider() === "appwrite") {
    const profile = await getAppwriteProfile(auth.user.id);

    if (profile?.role !== "admin" && profile?.role !== "teacher") {
      return {
        user: auth.user,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }

    return { user: auth.user, response: null };
  }

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && profile?.role !== "teacher") {
    return {
      user: auth.user,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user: auth.user, response: null };
}
