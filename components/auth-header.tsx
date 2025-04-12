"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AuthHeader() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const { user, profile, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Only show the toggle after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm dark:bg-[#090b0d]/90 dark:border-[#181c22]">
      <div className="w-[75%] mx-auto flex h-16 items-center justify-between">
        <div className="flex-1 flex items-center">
          <Link href="/" className="font-bold text-xl flex items-center group mr-8">
            <div className="relative mr-3 group-hover:scale-110 transition-transform duration-200">
              <img
                src="/robot-purple.svg"
                alt="AI Robot Logo"
                width="48"
                height="48"
              />
            </div>
            <div className="flex items-center">
              <span className="bg-[radial-gradient(circle_at_center,_#3b82f6_0%,_hsl(var(--saas-purple))_100%)] bg-clip-text text-transparent font-extrabold">AI</span>
              <span className="ml-1.5 group-hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">News</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-base font-medium transition-all duration-200 hover:text-[hsl(var(--saas-purple))] relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-[hsl(var(--saas-purple))] after:transition-all after:duration-200"
            >
              Главная
            </Link>
            <Link
              href="/forum"
              className="text-base font-medium transition-all duration-200 hover:text-[hsl(var(--saas-purple))] relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-[hsl(var(--saas-purple))] after:transition-all after:duration-200"
            >
              Форум
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-8">
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

          {!user || !profile ? (
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="default" size="sm">Войти</Button>
              </Link>
              <Link href="/register">
                <Button variant="saas-gradient" size="sm">Регистрация</Button>
              </Link>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative p-0 bg-transparent hover:bg-transparent border-2 border-[hsl(var(--saas-purple))] rounded-md h-10 px-3 transition-all duration-200 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[hsl(var(--saas-purple))]">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span className="text-[hsl(var(--saas-purple))] font-bold text-lg">
                    {(() => {
                      const nameParts = profile.username.split(' ');
                      if (nameParts.length >= 2) {
                        // Фамилия + Имя (первые буквы)
                        return `${nameParts[0][0]}${nameParts[1][0]}`;
                      } else {
                        // Если только одно слово, берем первые две буквы
                        return profile.username.substring(0, 2);
                      }
                    })().toUpperCase()}
                  </span>
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
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-[hsl(var(--saas-purple)/0.1)] hover:text-[hsl(var(--saas-purple))] focus:bg-[hsl(var(--saas-purple)/0.1)] focus:text-[hsl(var(--saas-purple))] transition-colors duration-200"
                    onClick={() => signOut()}
                  >
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
