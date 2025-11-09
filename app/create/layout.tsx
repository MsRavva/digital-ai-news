import { requireAuth } from "@/lib/auth-server"

export const dynamic = 'force-dynamic'

export default async function CreatePostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()
  return <>{children}</>
}

