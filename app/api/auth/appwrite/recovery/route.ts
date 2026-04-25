import { NextResponse } from "next/server";
import { createAppwriteRecovery, updateAppwriteRecovery } from "@/lib/appwrite/auth";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email) {
      return NextResponse.json({ error: { message: "Email обязателен" } }, { status: 400 });
    }

    const { error } = await createAppwriteRecovery(email);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Appwrite recovery create error:", error);
    return NextResponse.json(
      { error: { message: "Не удалось отправить recovery email" } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, secret, password } = (await request.json()) as {
      userId?: string;
      secret?: string;
      password?: string;
    };

    if (!userId || !secret || !password) {
      return NextResponse.json(
        { error: { message: "userId, secret и password обязательны" } },
        { status: 400 }
      );
    }

    const { error } = await updateAppwriteRecovery(userId, secret, password);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Appwrite recovery update error:", error);
    return NextResponse.json({ error: { message: "Не удалось обновить пароль" } }, { status: 500 });
  }
}
