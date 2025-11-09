import { requireAuth } from "@/lib/auth-server"

export const dynamic = 'force-dynamic'

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Редирект на /login если не авторизован
  await requireAuth()
  return <>{children}</>
}

