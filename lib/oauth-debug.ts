import { getSafePostAuthRedirect } from "./oauth-redirect";

export const OAUTH_DEBUG_STORAGE_KEY = "oauth_debug_state";
export const OAUTH_DEBUG_QUERY_FLAG = "oauth_debug";
export const OAUTH_DEBUG_QUERY_FLOW = "oauth_flow";
export const OAUTH_DEBUG_QUERY_PROVIDER = "oauth_provider";
export const OAUTH_DEBUG_QUERY_STATUS = "oauth_status";
export const OAUTH_DEBUG_QUERY_STEP = "oauth_step";
export const OAUTH_DEBUG_QUERY_MESSAGE = "oauth_message";
export const OAUTH_DEBUG_QUERY_STEP_DETAILS = "oauth_step_details";
export const OAUTH_DEBUG_QUERY_DIAGNOSTICS = "oauth_diagnostics";
export const OAUTH_DEBUG_REDIRECT_TIMEOUT_MS = 1500;
export const OAUTH_DEBUG_FINAL_REDIRECT_DELAY_MS = 1200;

export const OAUTH_DEBUG_STEPS = [
  { id: "start_requested", label: "Запрошен старт OAuth" },
  { id: "provider_url_ready", label: "Получен URL GitHub/Supabase" },
  { id: "redirect_triggered", label: "Браузеру передан переход на GitHub" },
  { id: "callback_reached", label: "Возврат в callback приложения" },
  { id: "code_exchanged", label: "Code exchange завершен" },
  { id: "profile_checked", label: "Профиль пользователя проверен" },
  { id: "final_redirect_ready", label: "Последний чек получен, готовим редирект" },
] as const;

export type OAuthDebugStepId = (typeof OAUTH_DEBUG_STEPS)[number]["id"];
export type OAuthDebugStepStatus = "pending" | "success" | "error";
export type OAuthDebugProvider = "github" | "google";
export type OAuthDebugFlowStatus = "idle" | "running" | "success" | "error";
export type OAuthDebugQueryStatus = "success" | "error";

export interface OAuthDebugStepState {
  status: OAuthDebugStepStatus;
  detail?: string;
}

export interface OAuthDebugState {
  flowId: string;
  provider: OAuthDebugProvider;
  redirectTo: string;
  callbackUrl: string;
  providerUrl?: string;
  status: OAuthDebugFlowStatus;
  message?: string;
  updatedAt: string;
  steps: Record<OAuthDebugStepId, OAuthDebugStepState>;
  diagnostics: string[];
}

type SearchParamsLike = { toString(): string } | null | undefined;

function createEmptySteps(): Record<OAuthDebugStepId, OAuthDebugStepState> {
  return Object.fromEntries(
    OAUTH_DEBUG_STEPS.map((step) => [step.id, { status: "pending" } satisfies OAuthDebugStepState])
  ) as Record<OAuthDebugStepId, OAuthDebugStepState>;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function isOAuthDebugProvider(
  value: string | null | undefined
): value is OAuthDebugProvider {
  return value === "github" || value === "google";
}

export function getSafeOAuthDebugRedirect(redirectTo?: string | null, fallback = "/"): string {
  return getSafePostAuthRedirect(redirectTo) || fallback;
}

export function createOAuthDebugState({
  flowId,
  provider,
  redirectTo,
  callbackUrl,
}: {
  flowId: string;
  provider: OAuthDebugProvider;
  redirectTo: string;
  callbackUrl: string;
}): OAuthDebugState {
  return {
    flowId,
    provider,
    redirectTo,
    callbackUrl,
    status: "idle",
    updatedAt: nowIso(),
    steps: createEmptySteps(),
    diagnostics: [],
  };
}

export function setOAuthDebugStep(
  state: OAuthDebugState,
  step: OAuthDebugStepId,
  status: OAuthDebugStepStatus,
  detail?: string
): OAuthDebugState {
  return {
    ...state,
    status:
      status === "error"
        ? "error"
        : state.status === "success"
          ? "success"
          : state.status === "error"
            ? "error"
            : "running",
    updatedAt: nowIso(),
    steps: {
      ...state.steps,
      [step]: {
        status,
        detail,
      },
    },
  };
}

export function setOAuthDebugStatus(
  state: OAuthDebugState,
  status: OAuthDebugFlowStatus,
  message?: string
): OAuthDebugState {
  return {
    ...state,
    status,
    message,
    updatedAt: nowIso(),
  };
}

export function setOAuthDebugProviderUrl(
  state: OAuthDebugState,
  providerUrl: string
): OAuthDebugState {
  return {
    ...state,
    providerUrl,
    updatedAt: nowIso(),
  };
}

export function setOAuthDebugDiagnostics(
  state: OAuthDebugState,
  diagnostics: string[]
): OAuthDebugState {
  return {
    ...state,
    diagnostics,
    updatedAt: nowIso(),
  };
}

export function finalizeOAuthDebugSuccess(
  state: OAuthDebugState,
  message = "OAuth завершен, финальный редирект готов."
): OAuthDebugState {
  return setOAuthDebugStatus(state, "success", message);
}

export function finalizeOAuthDebugError(
  state: OAuthDebugState,
  step: OAuthDebugStepId,
  message: string
): OAuthDebugState {
  return setOAuthDebugStatus(setOAuthDebugStep(state, step, "error", message), "error", message);
}

export function buildOAuthDebugLoginPath({
  flowId,
  provider,
  redirectTo,
  status,
  step,
  message,
  stepDetails,
  diagnostics,
}: {
  flowId: string;
  provider: OAuthDebugProvider;
  redirectTo?: string | null;
  status: OAuthDebugQueryStatus;
  step: OAuthDebugStepId;
  message?: string;
  stepDetails?: Partial<Record<OAuthDebugStepId, string>>;
  diagnostics?: string[];
}): string {
  const params = new URLSearchParams();
  params.set(OAUTH_DEBUG_QUERY_FLAG, "1");
  params.set(OAUTH_DEBUG_QUERY_FLOW, flowId);
  params.set(OAUTH_DEBUG_QUERY_PROVIDER, provider);
  params.set(OAUTH_DEBUG_QUERY_STATUS, status);
  params.set(OAUTH_DEBUG_QUERY_STEP, step);

  const safeRedirect = getSafePostAuthRedirect(redirectTo);
  if (safeRedirect && safeRedirect !== "/") {
    params.set("redirect", safeRedirect);
  }

  if (message) {
    params.set(OAUTH_DEBUG_QUERY_MESSAGE, message);
  }

  if (stepDetails && Object.keys(stepDetails).length > 0) {
    params.set(OAUTH_DEBUG_QUERY_STEP_DETAILS, JSON.stringify(stepDetails));
  }

  if (diagnostics && diagnostics.length > 0) {
    params.set(OAUTH_DEBUG_QUERY_DIAGNOSTICS, JSON.stringify(diagnostics));
  }

  return `/login?${params.toString()}`;
}

function parseJsonParam<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function parseOAuthDebugPayload(searchParams: SearchParamsLike): {
  enabled: boolean;
  flowId: string | null;
  provider: OAuthDebugProvider | null;
  status: OAuthDebugQueryStatus | null;
  step: OAuthDebugStepId | null;
  message: string | null;
  redirectTo: string;
  stepDetails: Partial<Record<OAuthDebugStepId, string>>;
  diagnostics: string[];
} {
  const params = new URLSearchParams(searchParams?.toString());
  const provider = params.get(OAUTH_DEBUG_QUERY_PROVIDER);
  const status = params.get(OAUTH_DEBUG_QUERY_STATUS);
  const step = params.get(OAUTH_DEBUG_QUERY_STEP);
  const stepDetails =
    parseJsonParam<Partial<Record<OAuthDebugStepId, string>>>(
      params.get(OAUTH_DEBUG_QUERY_STEP_DETAILS)
    ) || {};
  const diagnostics = parseJsonParam<string[]>(params.get(OAUTH_DEBUG_QUERY_DIAGNOSTICS)) || [];

  return {
    enabled: params.get(OAUTH_DEBUG_QUERY_FLAG) === "1",
    flowId: params.get(OAUTH_DEBUG_QUERY_FLOW),
    provider: isOAuthDebugProvider(provider) ? provider : null,
    status: status === "success" || status === "error" ? status : null,
    step: OAUTH_DEBUG_STEPS.some((item) => item.id === step) ? (step as OAuthDebugStepId) : null,
    message: params.get(OAUTH_DEBUG_QUERY_MESSAGE),
    redirectTo: getSafeOAuthDebugRedirect(params.get("redirect")),
    stepDetails,
    diagnostics: Array.isArray(diagnostics) ? diagnostics : [],
  };
}

export function readOAuthDebugState(): OAuthDebugState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(OAUTH_DEBUG_STORAGE_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as OAuthDebugState;
  } catch {
    return null;
  }
}

export function writeOAuthDebugState(state: OAuthDebugState): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(OAUTH_DEBUG_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Debug state is best-effort only.
  }
}

export function clearOAuthDebugState(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(OAUTH_DEBUG_STORAGE_KEY);
  } catch {
    // Debug state is best-effort only.
  }
}
