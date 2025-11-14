export const dynamic = 'force-dynamic'

export default async function CreatePostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Защита маршрутов теперь обрабатывается в proxy.ts
  return <>{children}</>
}

