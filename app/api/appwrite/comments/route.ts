import { NextResponse } from "next/server";
import { requireSupabaseUser } from "@/lib/appwrite/route-guards";
import { addAppwriteComment } from "@/lib/appwrite/write";

export async function POST(request: Request) {
  const auth = await requireSupabaseUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const payload = (await request.json()) as {
      content: string;
      post_id: string;
      author_id: string;
      parent_id?: string;
    };

    const commentId = await addAppwriteComment(payload);
    return NextResponse.json({ commentId });
  } catch (error) {
    console.error("Appwrite comment create error:", error);
    return NextResponse.json({ commentId: null }, { status: 500 });
  }
}
