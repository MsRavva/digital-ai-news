import { NextResponse } from "next/server";
import { requireSupabaseUser } from "@/lib/appwrite/route-guards";
import {
  deleteAppwriteComment,
  hasUserLikedAppwriteComment,
  likeAppwriteComment,
  unlikeAppwriteComment,
} from "@/lib/appwrite/write";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireSupabaseUser();
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;
  const success = await deleteAppwriteComment(id);
  return NextResponse.json({ success });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireSupabaseUser();
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;
  const payload = (await request.json()) as {
    action: "like" | "unlike" | "hasLiked";
    userId?: string;
  };

  switch (payload.action) {
    case "like":
      return NextResponse.json({ success: await likeAppwriteComment(id, payload.userId || "") });
    case "unlike":
      return NextResponse.json({ success: await unlikeAppwriteComment(id, payload.userId || "") });
    case "hasLiked":
      return NextResponse.json({
        success: await hasUserLikedAppwriteComment(id, payload.userId || ""),
      });
    default:
      return NextResponse.json({ success: false }, { status: 400 });
  }
}
