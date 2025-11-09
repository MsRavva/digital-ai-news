"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SimpleAvatar } from "@/components/simple-avatar"
import { useAuth } from "@/context/auth-context"
import { FileText, LogOut, Plus, User } from "lucide-react"
import Link from "next/link"

export function UserNav() {
  const { user, profile, signOut } = useAuth()

  if (!user || !profile) {
    return (
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Войти</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/register">Регистрация</Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-auto p-2 gap-2 hover:bg-accent"
        >
          <SimpleAvatar username={profile.username} size="sm" />
          <span className="hidden sm:inline-block font-medium">
            {profile.username}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile.username}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center w-full">
              <User className="mr-2 h-4 w-4" />
              Профиль
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/my-posts" className="flex items-center w-full">
              <FileText className="mr-2 h-4 w-4" />
              Мои публикации
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/create" className="flex items-center w-full">
              <Plus className="mr-2 h-4 w-4" />
              Создать публикацию
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

