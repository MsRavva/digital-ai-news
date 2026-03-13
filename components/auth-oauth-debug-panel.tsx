"use client";

import {
  AlertCircle,
  CheckCircle2,
  CircleDotDashed,
  ExternalLink,
  LoaderCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  OAUTH_DEBUG_STEPS,
  type OAuthDebugProvider,
  type OAuthDebugState,
  type OAuthDebugStepStatus,
} from "@/lib/oauth-debug";

function getStepIcon(status: OAuthDebugStepStatus) {
  if (status === "success") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  }

  if (status === "error") {
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  }

  return <CircleDotDashed className="h-4 w-4 text-muted-foreground" />;
}

function getProviderLabel(provider?: OAuthDebugProvider) {
  if (provider === "github") return "GitHub";
  if (provider === "google") return "Google";
  return "OAuth";
}

function getStatusLabel(status?: OAuthDebugState["status"]) {
  if (status === "success") return "Успех";
  if (status === "error") return "Ошибка";
  if (status === "running") return "В процессе";
  return "Ожидание";
}

export function AuthOAuthDebugPanel({
  state,
  isAuthenticated,
}: {
  state: OAuthDebugState | null;
  isAuthenticated: boolean;
}) {
  const providerLabel = getProviderLabel(state?.provider);
  const hasManualLink = !!state?.providerUrl && state.status !== "success";

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Диагностика OAuth</CardTitle>
        <CardDescription className="text-center">
          Отслеживаем каждый шаг {providerLabel} авторизации и финального возврата в приложение.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Провайдер</span>
            <span className="font-medium">{providerLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Статус</span>
            <span className="font-medium">{getStatusLabel(state?.status)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Сессия в приложении</span>
            <span className="font-medium">{isAuthenticated ? "Есть" : "Нет"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Целевой маршрут</span>
            <span className="truncate font-medium">{state?.redirectTo || "/"}</span>
          </div>
        </div>

        <div className="space-y-3">
          {OAUTH_DEBUG_STEPS.map((step) => {
            const stepState = state?.steps[step.id];

            return (
              <div key={step.id} className="rounded-md border p-3">
                <div className="flex items-center gap-3">
                  {getStepIcon(stepState?.status || "pending")}
                  <div className="min-w-0">
                    <div className="font-medium">{step.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {stepState?.detail || "Шаг еще не подтвержден."}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {state?.status === "running" ? (
          <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
            <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
            <span>{state.message || "Ждем следующий шаг OAuth..."}</span>
          </div>
        ) : null}

        {state?.status === "error" ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {state.message || "OAuth flow завершился с ошибкой."}
          </div>
        ) : null}

        {state?.status === "success" ? (
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            {state.message || "Последний чек получен. Выполняем главный редирект."}
          </div>
        ) : null}

        {hasManualLink ? (
          <a
            href={state.providerUrl}
            className="flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <ExternalLink className="h-4 w-4" />
            Открыть {providerLabel} вручную
          </a>
        ) : null}

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="truncate">
            Callback: {state?.callbackUrl || "будет показан после старта"}
          </div>
          <div className="truncate">Flow ID: {state?.flowId || "еще не создан"}</div>
        </div>
      </CardContent>
    </Card>
  );
}
