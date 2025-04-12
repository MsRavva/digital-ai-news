import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function MainNav() {
  return (
    <div className="flex items-center space-x-6">
      <Link href="/" className="font-bold text-xl flex items-center">
        <span className="text-saas-purple mr-1">AI</span>News
      </Link>
      <nav className="hidden md:flex items-center space-x-6">
        <Link href="/" className="text-sm font-medium transition-colors hover:text-saas-purple">
          Главная
        </Link>
        <Link href="/forum" className="text-sm font-medium transition-colors hover:text-saas-purple">
          Форум
        </Link>
        <Link href="/materials" className="text-sm font-medium transition-colors hover:text-saas-purple">
          Материалы
        </Link>
        <Link href="/pricing" className="text-sm font-medium transition-colors hover:text-saas-purple">
          Тарифы
        </Link>
        <Link href="/docs" className="text-sm font-medium transition-colors hover:text-saas-purple">
          Документация
        </Link>
      </nav>
      <div className="relative w-full max-w-sm hidden md:block">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Поиск..."
          className="w-full pl-8 bg-background dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
    </div>
  )
}
