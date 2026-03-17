import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { type RecordOAuthAuditEventInput, recordOAuthAuditEvent } from "@/lib/oauth-audit";

function getIpAddress(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RecordOAuthAuditEventInput;

    if (!body.flowId || !body.provider || !body.step || !body.status) {
      return NextResponse.json(
        { ok: false, error: "Missing required OAuth audit fields" },
        { status: 400 }
      );
    }

    const result = await recordOAuthAuditEvent({
      ...body,
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get("user-agent"),
    });

    if (!result.success) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[OAuth Audit API] Unexpected error:", error);
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
}
