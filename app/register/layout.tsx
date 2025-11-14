export const dynamic = 'force-dynamic'

export default async function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Защита маршрутов теперь обрабатывается в proxy.ts
  return <>{children}</>
}

