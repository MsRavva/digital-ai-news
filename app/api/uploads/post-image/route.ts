import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const POST_IMAGES_BUCKET = "post-images";
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();

  if (fromName) {
    return fromName;
  }

  const mimeToExtension: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return mimeToExtension[file.type] || "bin";
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const rawFile = formData?.get("file");

  if (!(rawFile instanceof File)) {
    return NextResponse.json({ ok: false, error: "Файл изображения не передан." }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.has(rawFile.type)) {
    return NextResponse.json(
      { ok: false, error: "Поддерживаются только JPG, PNG, WEBP и GIF." },
      { status: 400 }
    );
  }

  if (rawFile.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Изображение должно быть меньше 4 МБ." },
      { status: 400 }
    );
  }

  const extension = getFileExtension(rawFile);
  const now = new Date();
  const storagePath = [
    user.id,
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    `${Date.now()}-${crypto.randomUUID()}.${extension}`,
  ].join("/");

  const arrayBuffer = await rawFile.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(POST_IMAGES_BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: rawFile.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("[Post Image Upload] Storage upload failed:", uploadError);
    return NextResponse.json(
      { ok: false, error: "Не удалось загрузить изображение в Storage." },
      { status: 500 }
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from(POST_IMAGES_BUCKET)
    .getPublicUrl(storagePath);

  return NextResponse.json({
    ok: true,
    bucket: POST_IMAGES_BUCKET,
    path: storagePath,
    publicUrl: publicUrlData.publicUrl,
  });
}
