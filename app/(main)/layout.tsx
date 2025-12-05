export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // Защита маршрутов теперь обрабатывается в proxy.ts
  return <>{children}</>;
}
