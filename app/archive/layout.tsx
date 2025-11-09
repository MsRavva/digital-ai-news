import { requireAuth } from "@/lib/auth-server"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function ArchiveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  // Проверяем, что пользователь - учитель или администратор
  // Это проверка на клиенте, но для дополнительной защиты
  // можно добавить проверку роли здесь, если нужно

  return <>{children}</>
}

