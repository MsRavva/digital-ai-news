"use client"

import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { CreatePostForm } from "@/components/create-post-form"

export default function CreatePost() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Создать публикацию</h1>
          <CreatePostForm />
        </div>
      </main>
    </div>
  )
}
