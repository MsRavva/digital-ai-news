"use client"

import { SimpleAvatar } from "@/components/ui/simple-avatar"
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
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { Moon, Sun, User, FileText, Settings, LogOut, Plus } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function UserNav() {
  const { user, profile, signOut } = useAuth()
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Only show the toggle after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center space-x-4">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            className="text-[hsl(var(--saas-purple))] hover:text-[hsl(var(--saas-purple-dark))] hover:bg-[hsl(var(--saas-purple)/0.1)] transition-all duration-200"
            onClick={toggleTheme}
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        )}
        <div className="flex items-center space-x-2">
          <Link href="/login">
            <Button variant="saas" size="sm">Войти</Button>
          </Link>
          <Link href="/register">
            <Button variant="saas-secondary" size="sm">Регистрация</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0">
      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          className="text-[hsl(var(--saas-purple))] hover:text-[hsl(var(--saas-purple-dark))] hover:bg-[hsl(var(--saas-purple)/0.1)] transition-all duration-200"
          onClick={toggleTheme}
        >
          {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative p-0 bg-transparent hover:bg-transparent rounded-md h-12 px-3 transition-all duration-200 flex items-center gap-4">
            <SimpleAvatar username={profile.username} size="xl" />
            <span className="text-[hsl(var(--saas-purple))] font-bold text-lg">
              {profile.username}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal py-3">
            <div className="flex flex-col space-y-2">
              <p className="text-lg font-medium leading-none text-[hsl(var(--saas-purple-dark))] dark:text-[hsl(var(--saas-purple-light))]">{profile.username}</p>
              <p className="text-base leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer hover:bg-[hsl(var(--saas-purple)/0.1)] hover:text-[hsl(var(--saas-purple))] focus:bg-[hsl(var(--saas-purple)/0.1)] focus:text-[hsl(var(--saas-purple))] transition-colors duration-200">
              <Link href="/profile" className="w-full flex items-center">
                <User className="mr-2 h-4 w-4" />
                Профиль
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-[hsl(var(--saas-purple)/0.1)] hover:text-[hsl(var(--saas-purple))] focus:bg-[hsl(var(--saas-purple)/0.1)] focus:text-[hsl(var(--saas-purple))] transition-colors duration-200">
              <Link href="/my-posts" className="w-full flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Мои публикации
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-[hsl(var(--saas-purple)/0.1)] hover:text-[hsl(var(--saas-purple))] focus:bg-[hsl(var(--saas-purple)/0.1)] focus:text-[hsl(var(--saas-purple))] transition-colors duration-200">
              <Link href="/settings" className="w-full flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Настройки
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-[hsl(var(--saas-purple)/0.1)] hover:text-[hsl(var(--saas-purple))] focus:bg-[hsl(var(--saas-purple)/0.1)] focus:text-[hsl(var(--saas-purple))] transition-colors duration-200">
              <Link href="/create" className="w-full flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Создать публикацию
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            className="cursor-pointer hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 dark:focus:bg-red-950/50 dark:focus:text-red-400 transition-colors duration-200"
          >
            <div className="flex items-center w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
