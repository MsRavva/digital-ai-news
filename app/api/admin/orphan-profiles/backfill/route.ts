import { NextResponse } from "next/server";
import { backfillOrphanProfiles } from "@/lib/orphan-auth-backfill";
import { createServerSupabaseClient } from "@/lib/supabase-server";

async function requireTeacherOrAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: "student" | "teacher" | "admin" }>();

  if (error || !profile || (profile.role !== "teacher" && profile.role !== "admin")) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const };
}

export async function POST(request: Request) {
  const auth = await requireTeacherOrAdmin();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { batchSize?: number };
    const result = await backfillOrphanProfiles(body.batchSize);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[Orphan Backfill API] Unexpected error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
