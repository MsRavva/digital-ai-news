import { requireGuest } from "@/lib/auth-server"

export const dynamic = 'force-dynamic'

export default async function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Редирект на главную если уже авторизован
  await requireGuest()
  return <>{children}</>
}

