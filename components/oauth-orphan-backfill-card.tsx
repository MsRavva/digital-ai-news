"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrphanProfilesSnapshot } from "@/types/database";

interface OAuthOrphanBackfillCardProps {
  snapshot: OrphanProfilesSnapshot;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ru-RU");
}

export function OAuthOrphanBackfillCard({ snapshot }: OAuthOrphanBackfillCardProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const eligibleCount = snapshot.candidates.filter(
    (candidate) =>
      !candidate.emailExistsInAuth && !candidate.idExistsInAuth && candidate.postsCount === 0
  ).length;

  const handleBackfill = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/orphan-profiles/backfill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ batchSize: 25 }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        result?: {
          processed: number;
          succeeded: number;
          failed: number;
        };
      };

      if (!response.ok || !payload.ok || !payload.result) {
        toast.error(payload.error || "Не удалось выполнить backfill orphan-профилей");
        return;
      }

      toast.success(
        `Backfill завершен: успешно ${payload.result.succeeded}, ошибок ${payload.result.failed}`
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Неизвестная ошибка backfill");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legacy orphan-профили</CardTitle>
        <CardDescription>
          Эти профили существуют в <span className="font-mono">public.profiles</span>, но еще не
          имеют соответствующих пользователей в <span className="font-mono">auth.users</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-sm text-muted-foreground">Профилей с email</div>
            <div className="mt-2 text-3xl font-semibold">{snapshot.totalProfilesWithEmail}</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-sm text-muted-foreground">Auth users с email</div>
            <div className="mt-2 text-3xl font-semibold">{snapshot.totalAuthUsersWithEmail}</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-sm text-muted-foreground">Orphan-профили</div>
            <div className="mt-2 text-3xl font-semibold">{snapshot.orphanProfilesCount}</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-sm text-muted-foreground">Auth без профиля</div>
            <div className="mt-2 text-3xl font-semibold">{snapshot.authWithoutProfileCount}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="font-medium">Пакетное восстановление через Supabase Admin API</div>
            <div className="text-sm text-muted-foreground">
              Кнопка создает до 25 недостающих <span className="font-mono">auth.users</span>, затем
              перепривязывает legacy <span className="font-mono">profiles.id</span> и все связанные
              ссылки. Автоматически исключаются профили, у которых уже есть публикации.
            </div>
          </div>
          <Button onClick={handleBackfill} disabled={isSubmitting || eligibleCount === 0}>
            {isSubmitting ? "Восстанавливаем..." : "Восстановить первые 25"}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Первые кандидаты на backfill</div>
          {snapshot.candidates.length === 0 ? (
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              Неразрешенных orphan-профилей не найдено.
            </div>
          ) : (
            <div className="space-y-3">
              {snapshot.candidates.map((candidate) => (
                <div key={candidate.profileId} className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{candidate.role}</Badge>
                        <Badge variant={candidate.totalReferences > 0 ? "default" : "secondary"}>
                          ссылок: {candidate.totalReferences}
                        </Badge>
                        {candidate.emailExistsInAuth ? (
                          <Badge variant="destructive">email уже есть в auth</Badge>
                        ) : null}
                        {candidate.postsCount > 0 ? (
                          <Badge variant="destructive">автор публикаций, исключен</Badge>
                        ) : null}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Email: <span className="text-foreground">{candidate.email}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Username: <span className="text-foreground">{candidate.username}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Legacy profile id:{" "}
                        <span className="font-mono text-foreground">{candidate.profileId}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground lg:text-right">
                      <div>Создан: {formatDate(candidate.createdAt)}</div>
                      <div>Посты: {candidate.postsCount}</div>
                      <div>Комментарии: {candidate.commentsCount}</div>
                      <div>Лайки: {candidate.likesCount}</div>
                      <div>Просмотры: {candidate.viewsCount}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
