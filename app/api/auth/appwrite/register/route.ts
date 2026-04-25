import { NextResponse } from "next/server";
import {
  createAppwriteUser,
  createEmailPasswordAppwriteSession,
  getAppwriteSessionCookieConfig,
} from "@/lib/appwrite/auth";
import { getAppwritePublicConfig } from "@/lib/appwrite/env";

export async function POST(request: Request) {
  try {
    const { email, password, username, role } = (await request.json()) as {
      email?: string;
      password?: string;
      username?: string;
      role?: "student" | "teacher" | "admin";
    };

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: { message: "Email, пароль и имя пользователя обязательны" } },
        { status: 400 }
      );
    }

    const created = await createAppwriteUser({
      email,
      password,
      username,
      role: role || "student",
    });
    if (created.error || !created.user) {
      return NextResponse.json({ error: created.error }, { status: 400 });
    }

    const { session, error } = await createEmailPasswordAppwriteSession(email, password);
    if (error || !session) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const config = getAppwritePublicConfig();
    if (!config) {
      return NextResponse.json(
        { error: { message: "Appwrite public config is not available." } },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ user: created.user });
    response.cookies.set(
      `a_session_${config.projectId}`,
      session.secret,
      getAppwriteSessionCookieConfig(session.expire)
    );

    return response;
  } catch (error) {
    console.error("Appwrite register error:", error);
    return NextResponse.json(
      { error: { message: "Не удалось выполнить регистрацию" } },
      { status: 500 }
    );
  }
}
