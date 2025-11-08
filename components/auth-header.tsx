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
import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { useAuth } from "@/context/auth-context"
import { Moon, Newspaper, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useEffect, useState } from "react"

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm dark:bg-background/90 dark:border-border">
      <div className="w-[75%] mx-auto flex h-16 items-center justify-between">
        <div className="flex-1 flex items-center">
          <Link
            href="/"
            className="font-bold text-xl flex items-center group mr-8"
          >
            <div className="relative mr-3 group-hover:scale-110 transition-transform duration-200">
              <img
                src="/newspaper-icon.svg"
                alt="AI News Logo"
                width="40"
                height="40"
              />
            </div>
            <div className="flex items-center">
              <span className="text-accent font-extrabold">
                AI
              </span>
              <span className="ml-1.5 text-primary group-hover:text-primary transition-colors duration-200">
                News
              </span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-base font-medium transition-all duration-200 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-200"
            >
              Главная
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-8">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              className="text-primary hover:text-primary/80 hover:bg-primary/10 transition-all duration-200"
              onClick={toggleTheme}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}

          {!user || !profile ? (
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="saas" size="sm">
                  Войти
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="saas-secondary" size="sm">
                  Регистрация
                </Button>
              </Link>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative p-0 bg-transparent hover:bg-transparent rounded-md h-10 px-3 transition-all duration-200 flex items-center gap-2"
                >
                  <SimpleAvatar username={profile.username} size="sm" />
                  <span className="text-primary font-bold">
                    {profile.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-primary">
                      {profile.username}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors duration-200">
                    <Link href="/profile" className="w-full">
                      Профиль
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors duration-200"
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
