import type { OAuthAuditProvider, OAuthAuditSource, OAuthAuditStatus } from "./oauth-audit";

interface RecordOAuthAuditClientEventInput {
  flowId: string;
  provider: OAuthAuditProvider;
  source: OAuthAuditSource;
  sourcePath: string;
  redirectTo?: string | null;
  step: string;
  status: OAuthAuditStatus;
  message?: string;
  diagnostics?: string[];
  stepDetails?: Record<string, string>;
}

export function createOAuthFlowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `oauth-${Date.now()}`;
}

export async function recordOAuthAuditClientEvent(
  input: RecordOAuthAuditClientEventInput
): Promise<void> {
  try {
    await fetch("/api/oauth-audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      keepalive: true,
    });
  } catch (error) {
    console.error("[OAuth Audit Client] Failed to record event:", error);
  }
}
