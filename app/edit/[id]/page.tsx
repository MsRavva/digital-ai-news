import { EditPostForm } from "@/components/edit-post-form"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Metadata } from "next"
import React, { Suspense } from "react"

type Props = {
  params: { id: string }
}

export default async function EditPost({ params }: Props) {
  const { id: postId } = await params
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm dark:bg-background/90 dark:border-border">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full" style={{ maxWidth: '90%' }}>
          <div className="saas-window mb-8">
            <div className="saas-window-header">
              <div className="saas-window-dot saas-window-dot-red"></div>
              <div className="saas-window-dot saas-window-dot-yellow"></div>
              <div className="saas-window-dot saas-window-dot-green"></div>
            </div>
            <div className="p-6">
              <h1 className="text-3xl font-bold tracking-tight mb-6">
                Редактировать публикацию
              </h1>
              <EditPostForm postId={postId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
