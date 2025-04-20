"use client"

import Link from "next/link"
import { Newspaper, Archive, FileDown } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export function MainNav() {
  const { profile, user } = useAuth();
  const isTeacherOrAdmin = profile && (profile.role === "teacher" || profile.role === "admin");
  const canScrape = isTeacherOrAdmin || (user && user.uid === '4J9Vf4tqKOU7vDcz99h6nBu0gHx2');

  return (
    <div className="flex-1 flex items-center justify-between">
      <div className="flex items-center">
        <Link href="/" className="font-bold text-xl flex items-center group mr-8">
          <div className="relative mr-3 group-hover:scale-110 transition-transform duration-200">
            <img src="/newspaper-icon.svg" alt="AI News Logo" width="40" height="40" />
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

          {/* Ссылка на архив для учителей и админов */}
          {isTeacherOrAdmin && (
            <Link
              href="/archive"
              className="text-base font-medium transition-all duration-200 hover:text-[hsl(var(--saas-purple))] relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-[hsl(var(--saas-purple))] after:transition-all after:duration-200 flex items-center gap-1"
            >
              <Archive className="h-4 w-4" />
              Архив
            </Link>
          )}

          {/* Ссылка на импорт новостей для учителей, админов и Василия Смирнова */}
          {canScrape && (
            <Link
              href="/scrape-news"
              className="text-base font-medium transition-all duration-200 hover:text-[hsl(var(--saas-purple))] relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-[hsl(var(--saas-purple))] after:transition-all after:duration-200 flex items-center gap-1"
            >
              <FileDown className="h-4 w-4" />
              Импорт новостей
            </Link>
          )}
        </nav>
      </div>
    </div>
  )
}
