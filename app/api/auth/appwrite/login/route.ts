import { NextResponse } from "next/server";
import {
  clearAppwriteSessionCookie,
  createEmailPasswordAppwriteSession,
  getAppwriteSessionCookieConfig,
} from "@/lib/appwrite/auth";
import { getAppwritePublicConfig } from "@/lib/appwrite/env";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: { message: "Email и пароль обязательны" } },
        { status: 400 }
      );
    }

    const { session, error } = await createEmailPasswordAppwriteSession(email, password);

    if (error || !session) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const config = getAppwritePublicConfig();
    if (!config) {
      return NextResponse.json(
        { error: { message: "Appwrite public config is not available." } },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ user: { id: session.userId, email } });
    response.cookies.set(
      `a_session_${config.projectId}`,
      session.secret,
      getAppwriteSessionCookieConfig(session.expire)
    );

    return response;
  } catch (error) {
    console.error("Appwrite login error:", error);
    return NextResponse.json({ error: { message: "Не удалось выполнить вход" } }, { status: 500 });
  }
}

export async function DELETE() {
  await clearAppwriteSessionCookie();
  return NextResponse.json({ success: true });
}
