import type { OAuthAuditLog, OAuthAuditLogEvent } from "@/types/database";
import { createAdminClient } from "./supabase-admin";

export type OAuthAuditProvider = "github" | "google";
export type OAuthAuditSource = "login" | "register" | "unknown";
export type OAuthAuditStatus = "running" | "success" | "error";

export const OAUTH_AUDIT_QUERY_SOURCE = "oauth_source";

interface OAuthAuditDbRow {
  id: string;
  flow_id: string;
  provider: OAuthAuditProvider;
  source: OAuthAuditSource;
  source_path: string | null;
  redirect_to: string | null;
  status: OAuthAuditStatus;
  current_step: string;
  last_message: string | null;
  user_id: string | null;
  username: string | null;
  step_details: Record<string, string> | null;
  diagnostics: string[] | null;
  events: OAuthAuditLogEvent[] | null;
  ip_address: string | null;
  user_agent: string | null;
  started_at: string;
  last_event_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecordOAuthAuditEventInput {
  flowId: string;
  provider: OAuthAuditProvider;
  source?: OAuthAuditSource;
  sourcePath?: string;
  redirectTo?: string | null;
  step: string;
  status: OAuthAuditStatus;
  message?: string;
  diagnostics?: string[];
  stepDetails?: Record<string, string>;
  userId?: string | null;
  username?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

function nowIso() {
  return new Date().toISOString();
}

function toSafeDiagnostics(items?: string[]): string[] {
  if (!items?.length) return [];

  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(-50);
}

function toSafeStepDetails(stepDetails?: Record<string, string>): Record<string, string> {
  if (!stepDetails) return {};

  return Object.fromEntries(
    Object.entries(stepDetails)
      .filter(([, value]) => typeof value === "string" && value.trim() !== "")
      .slice(-20)
  );
}

function mergeDiagnostics(existing: string[] | null, next?: string[]): string[] {
  const merged = [...(existing || []), ...toSafeDiagnostics(next)];
  return merged.slice(-80);
}

function mergeEvents(
  existing: OAuthAuditLogEvent[] | null,
  input: Pick<RecordOAuthAuditEventInput, "step" | "status" | "message">
): OAuthAuditLogEvent[] {
  return [
    ...(existing || []),
    {
      at: nowIso(),
      step: input.step,
      status: input.status,
      message: input.message,
    },
  ].slice(-40);
}

function mapRow(row: OAuthAuditDbRow): OAuthAuditLog {
  return {
    ...row,
    source_path: row.source_path,
    redirect_to: row.redirect_to,
    last_message: row.last_message,
    user_id: row.user_id,
    username: row.username,
    step_details: row.step_details || {},
    diagnostics: row.diagnostics || [],
    events: row.events || [],
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    completed_at: row.completed_at,
  };
}

export async function recordOAuthAuditEvent(
  input: RecordOAuthAuditEventInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();
    const { data: existing, error: existingError } = await admin
      .from("oauth_audit_logs")
      .select("*")
      .eq("flow_id", input.flowId)
      .maybeSingle<OAuthAuditDbRow>();

    if (existingError) {
      console.error("[OAuth Audit] Error fetching existing log:", existingError);
      return { success: false, error: existingError.message };
    }

    const timestamp = nowIso();
    const payload = {
      flow_id: input.flowId,
      provider: existing?.provider || input.provider,
      source: existing?.source || input.source || "unknown",
      source_path: existing?.source_path || input.sourcePath || null,
      redirect_to: existing?.redirect_to || input.redirectTo || null,
      status: input.status,
      current_step: input.step,
      last_message: input.message || existing?.last_message || null,
      user_id: input.userId || existing?.user_id || null,
      username: input.username || existing?.username || null,
      step_details: {
        ...(existing?.step_details || {}),
        ...toSafeStepDetails(input.stepDetails),
      },
      diagnostics: mergeDiagnostics(existing?.diagnostics || null, input.diagnostics),
      events: mergeEvents(existing?.events || null, input),
      ip_address: existing?.ip_address || input.ipAddress || null,
      user_agent: existing?.user_agent || input.userAgent || null,
      started_at: existing?.started_at || timestamp,
      last_event_at: timestamp,
      completed_at: input.status === "running" ? existing?.completed_at || null : timestamp,
      updated_at: timestamp,
    };

    const { error } = await admin.from("oauth_audit_logs").upsert(payload, {
      onConflict: "flow_id",
      ignoreDuplicates: false,
    });

    if (error) {
      console.error("[OAuth Audit] Error upserting log:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[OAuth Audit] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getOAuthAuditLogs(limit = 100): Promise<OAuthAuditLog[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("oauth_audit_logs")
    .select("*")
    .order("last_event_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[OAuth Audit] Error loading logs:", error);
    return [];
  }

  return ((data || []) as OAuthAuditDbRow[]).map(mapRow);
}
