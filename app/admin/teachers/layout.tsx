import { requireAuth } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function TeachersLayout({ children }: { children: React.ReactNode }) {
  // Редирект на /login с возвратом обратно после авторизации
  await requireAuth("/admin/teachers");
  return <>{children}</>;
}
