import { redirect } from "next/navigation";
import { HeroHeader } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth-server";
import { getOAuthAuditLogs } from "@/lib/oauth-audit";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleString("ru-RU");
}

function getStatusLabel(status: "running" | "success" | "error") {
  if (status === "success") return "Успех";
  if (status === "error") return "Ошибка";
  return "В процессе";
}

function getStatusVariant(status: "running" | "success" | "error") {
  if (status === "success") return "default";
  if (status === "error") return "destructive";
  return "secondary";
}

export default async function OAuthAuditPage() {
  await requireAuth("/profile/oauth-audit");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "teacher" && profile.role !== "admin")) {
    redirect("/");
  }

  const logs = await getOAuthAuditLogs(100);
  const successCount = logs.filter((log) => log.status === "success").length;
  const errorCount = logs.filter((log) => log.status === "error").length;
  const runningCount = logs.filter((log) => log.status === "running").length;

  return (
    <>
      <HeroHeader />
      <div className="container mx-auto w-[90%] px-4 pb-8 pt-24">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Журнал OAuth-сессий</CardTitle>
              <CardDescription>
                Здесь сохраняются все попытки входа через GitHub и Google независимо от результата.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="text-sm text-muted-foreground">Успешно</div>
                <div className="mt-2 text-3xl font-semibold">{successCount}</div>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="text-sm text-muted-foreground">С ошибкой</div>
                <div className="mt-2 text-3xl font-semibold">{errorCount}</div>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="text-sm text-muted-foreground">В процессе</div>
                <div className="mt-2 text-3xl font-semibold">{runningCount}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Последние 100 OAuth-flow</CardTitle>
              <CardDescription>
                Учительский доступ: {profile.username}. Отсортировано по последнему событию.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Логи OAuth пока не накоплены.
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border bg-card/60 p-4 shadow-sm transition-colors"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={getStatusVariant(log.status)}>
                              {getStatusLabel(log.status)}
                            </Badge>
                            <Badge variant="outline">
                              {log.provider === "github" ? "GitHub" : "Google"}
                            </Badge>
                            <Badge variant="outline">
                              {log.source === "register"
                                ? "Регистрация"
                                : log.source === "login"
                                  ? "Логин"
                                  : "Неизвестно"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Flow ID:{" "}
                            <span className="font-mono text-foreground">{log.flow_id}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Текущий шаг: <span className="text-foreground">{log.current_step}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Пользователь:{" "}
                            <span className="text-foreground">
                              {log.username || log.user_id || "еще не определен"}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Redirect:{" "}
                            <span className="text-foreground">{log.redirect_to || "/"}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Сообщение:{" "}
                            <span className="text-foreground">{log.last_message || "—"}</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground lg:text-right">
                          <div>Старт: {formatDate(log.started_at)}</div>
                          <div>Последнее событие: {formatDate(log.last_event_at)}</div>
                          <div>Завершение: {formatDate(log.completed_at)}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-lg border bg-muted/20 p-3">
                          <div className="mb-2 text-sm font-medium">Диагностика</div>
                          <div className="max-h-48 space-y-1 overflow-auto font-mono text-xs text-muted-foreground">
                            {log.diagnostics.length > 0 ? (
                              log.diagnostics.map((item, index) => (
                                <div key={`${log.id}-diag-${index}`}>{item}</div>
                              ))
                            ) : (
                              <div>Диагностические записи отсутствуют.</div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-lg border bg-muted/20 p-3">
                          <div className="mb-2 text-sm font-medium">Хронология шагов</div>
                          <div className="max-h-48 space-y-2 overflow-auto text-xs text-muted-foreground">
                            {log.events.length > 0 ? (
                              log.events.map((event, index) => (
                                <div
                                  key={`${log.id}-event-${index}`}
                                  className="rounded border p-2"
                                >
                                  <div className="font-medium text-foreground">
                                    {event.step} · {getStatusLabel(event.status)}
                                  </div>
                                  <div>{formatDate(event.at)}</div>
                                  <div>{event.message || "—"}</div>
                                </div>
                              ))
                            ) : (
                              <div>История шагов отсутствует.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
