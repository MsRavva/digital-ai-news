import { NextResponse } from "next/server";
import { requireSupabaseUser } from "@/lib/appwrite/route-guards";
import {
  archiveAppwritePost,
  deleteAppwritePost,
  hasUserLikedAppwritePost,
  likeAppwritePost,
  recordAppwriteView,
  toggleAppwritePinPost,
  unarchiveAppwritePost,
  updateAppwritePost,
} from "@/lib/appwrite/write";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireSupabaseUser();
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;
  const payload = (await request.json()) as {
    title: string;
    content: string;
    category: string;
    tags: string[];
  };

  const success = await updateAppwritePost({ id, ...payload });
  return NextResponse.json({ success });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireSupabaseUser();
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;
  const success = await deleteAppwritePost(id);
  return NextResponse.json({ success });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireSupabaseUser();
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;
  const payload = (await request.json()) as {
    action: "togglePin" | "archive" | "unarchive" | "like" | "hasLiked" | "recordView";
    userId?: string;
  };

  switch (payload.action) {
    case "togglePin":
      return NextResponse.json({ success: await toggleAppwritePinPost(id) });
    case "archive":
      return NextResponse.json({ success: await archiveAppwritePost(id) });
    case "unarchive":
      return NextResponse.json({ success: await unarchiveAppwritePost(id) });
    case "like":
      return NextResponse.json({ success: await likeAppwritePost(id, payload.userId || "") });
    case "hasLiked":
      return NextResponse.json({
        success: await hasUserLikedAppwritePost(id, payload.userId || ""),
      });
    case "recordView":
      await recordAppwriteView(id, payload.userId || "");
      return NextResponse.json({ success: true });
    default:
      return NextResponse.json({ success: false }, { status: 400 });
  }
}
