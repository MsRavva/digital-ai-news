import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function MainNav() {
  return (
    <div className="flex-1 flex items-center justify-between">
      <div className="flex items-center">
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
      <div className="relative w-full max-w-xs hidden md:block ml-auto">
        <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-[hsl(var(--saas-purple))]" />
        <Input
          type="search"
          placeholder="Поиск..."
          className="w-full pl-9 h-9 bg-background/50 backdrop-blur-sm border-[hsl(var(--saas-purple)/0.2)] focus:border-[hsl(var(--saas-purple))] focus:ring-[hsl(var(--saas-purple)/0.1)] transition-all duration-200 dark:bg-gray-800/50 dark:border-gray-700"
        />
      </div>
    </div>
  )
}
