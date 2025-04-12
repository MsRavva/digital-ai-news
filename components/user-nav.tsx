"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function UserNav() {
  const { user, profile, signOut } = useAuth()
  const { setTheme, theme, resolvedTheme } = useTheme()
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
      <div className="flex items-center gap-4">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            className="mr-2 text-[hsl(var(--saas-purple))] hover:text-[hsl(var(--saas-purple-dark))] hover:bg-[hsl(var(--saas-purple)/0.1)] transition-all duration-200"
            onClick={toggleTheme}
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        )}
        <Link href="/login">
          <Button variant="default" size="sm">Войти</Button>
        </Link>
        <Link href="/register">
          <Button variant="saas-gradient" size="sm">Регистрация</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
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
          <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden border-2 border-[hsl(var(--saas-purple)/0.3)] hover:border-[hsl(var(--saas-purple))] transition-all duration-200">
            <Avatar className="h-full w-full">
              <AvatarImage src="/placeholder.svg?height=36&width=36" alt="Аватар" />
              <AvatarFallback className="bg-[hsl(var(--saas-purple))] text-white font-medium">
                {profile.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-[hsl(var(--saas-purple-dark))] dark:text-[hsl(var(--saas-purple-light))]">{profile.username}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer hover:bg-[hsl(var(--saas-purple)/0.1)] hover:text-[hsl(var(--saas-purple))] focus:bg-[hsl(var(--saas-purple)/0.1)] focus:text-[hsl(var(--saas-purple))] transition-colors duration-200">
              <Link href="/profile" className="w-full">
                Профиль
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-[hsl(var(--saas-purple)/0.1)] hover:text-[hsl(var(--saas-purple))] focus:bg-[hsl(var(--saas-purple)/0.1)] focus:text-[hsl(var(--saas-purple))] transition-colors duration-200">
              <Link href="/my-posts" className="w-full">
                Мои публикации
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-[hsl(var(--saas-purple)/0.1)] hover:text-[hsl(var(--saas-purple))] focus:bg-[hsl(var(--saas-purple)/0.1)] focus:text-[hsl(var(--saas-purple))] transition-colors duration-200">
              <Link href="/settings" className="w-full">
                Настройки
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            className="cursor-pointer hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 dark:focus:bg-red-950/50 dark:focus:text-red-400 transition-colors duration-200"
          >
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
