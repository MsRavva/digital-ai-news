import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { PostsList } from "@/components/posts-list"
import { TagsFilter } from "@/components/tags-filter"
import { getPosts, getAllTags } from "@/lib/api"
import Link from "next/link"
import { Search, Plus, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"

export default async function Home() {
  // Fetch posts and tags
  const allPosts = await getPosts()
  const newsPosts = await getPosts("news")
  const materialsPosts = await getPosts("materials")
  const discussionsPosts = await getPosts("discussions")
  const tags = await getAllTags()

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#e9e1ff] via-[#f0f7ff] to-[#e8f0ff] dark:from-[#0f172a] dark:to-[#1e293b]">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm dark:bg-[#111827]/80 dark:border-[#1f2937]">
        <div className="container flex h-16 items-center">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">AI News</h1>
              <p className="text-muted-foreground">Последние новости и обсуждения в мире искусственного интеллекта</p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <div className="relative md:hidden">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Поиск..."
                  className="w-full pl-8 bg-background dark:bg-[#1e293b] dark:border-[#374151]"
                />
              </div>
              <Link href="/create">
                <Button variant="saas">
                  <Plus className="mr-2 h-4 w-4" /> Создать публикацию
                </Button>
              </Link>
            </div>
          </div>

          <div className="saas-window mb-8">
            <div className="saas-window-header">
              <div className="saas-window-dot saas-window-dot-red"></div>
              <div className="saas-window-dot saas-window-dot-yellow"></div>
              <div className="saas-window-dot saas-window-dot-green"></div>
              <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">AI News Platform</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
              <div className="md:col-span-1">
                <div className="sticky top-24">
                  <TagsFilter tags={tags} />
                </div>
              </div>

              <div className="md:col-span-3">
                <Tabs defaultValue="all" className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <TabsList className="bg-white/50 backdrop-blur-sm dark:bg-[#1e293b]">
                      <TabsTrigger value="all">Все</TabsTrigger>
                      <TabsTrigger value="news">Новости</TabsTrigger>
                      <TabsTrigger value="materials">Учебные материалы</TabsTrigger>
                      <TabsTrigger value="discussions">Обсуждения</TabsTrigger>
                    </TabsList>
                    <Button variant="saas-secondary" size="sm" className="gap-1">
                      <Filter className="h-4 w-4" /> Фильтры
                    </Button>
                  </div>
                  <TabsContent value="all">
                    <Card className="p-0 border-0 shadow-none dark:bg-transparent">
                      <PostsList posts={allPosts} />
                    </Card>
                  </TabsContent>
                  <TabsContent value="news">
                    <Card className="p-0 border-0 shadow-none dark:bg-transparent">
                      <PostsList posts={newsPosts} />
                    </Card>
                  </TabsContent>
                  <TabsContent value="materials">
                    <Card className="p-0 border-0 shadow-none dark:bg-transparent">
                      <PostsList posts={materialsPosts} />
                    </Card>
                  </TabsContent>
                  <TabsContent value="discussions">
                    <Card className="p-0 border-0 shadow-none dark:bg-transparent">
                      <PostsList posts={discussionsPosts} />
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Используется ведущими образовательными учреждениями</h2>
            <div className="flex flex-wrap justify-center items-center gap-8 mt-8 opacity-70">
              <div className="w-32 h-12 flex items-center justify-center">
                <div className="text-xl font-bold">University 1</div>
              </div>
              <div className="w-32 h-12 flex items-center justify-center">
                <div className="text-xl font-bold">School 2</div>
              </div>
              <div className="w-32 h-12 flex items-center justify-center">
                <div className="text-xl font-bold">Academy 3</div>
              </div>
              <div className="w-32 h-12 flex items-center justify-center">
                <div className="text-xl font-bold">Institute 4</div>
              </div>
              <div className="w-32 h-12 flex items-center justify-center">
                <div className="text-xl font-bold">College 5</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white/80 backdrop-blur-sm dark:bg-[#111827]/80 dark:border-[#1f2937]">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-3">Платформа</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-saas-purple">
                    Главная
                  </Link>
                </li>
                <li>
                  <Link href="/forum" className="text-sm text-muted-foreground hover:text-saas-purple">
                    Форум
                  </Link>
                </li>
                <li>
                  <Link href="/materials" className="text-sm text-muted-foreground hover:text-saas-purple">
                    Материалы
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Ресурсы</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs" className="text-sm text-muted-foreground hover:text-saas-purple">
                    Документация
                  </Link>
                </li>
                <li>
                  <Link href="/guides" className="text-sm text-muted-foreground hover:text-saas-purple">
                    Руководства
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="text-sm text-muted-foreground hover:text-saas-purple">
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Компания</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-muted-foreground hover:text-saas-purple">
                    О нас
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-sm text-muted-foreground hover:text-saas-purple">
                    Блог
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-sm text-muted-foreground hover:text-saas-purple">
                    Карьера
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Правовая информация</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-saas-purple">
                    Конфиденциальность
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-saas-purple">
                    Условия использования
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-sm text-muted-foreground hover:text-saas-purple">
                    Политика cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t dark:border-[#1f2937]">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <Link href="/" className="font-bold text-xl flex items-center">
                  <span className="text-saas-purple mr-1">AI</span>News
                </Link>
                <p className="text-sm text-muted-foreground mt-1">© 2023 AI News. Все права защищены.</p>
              </div>
              <div className="flex space-x-4">
                <Link href="#" className="text-muted-foreground hover:text-saas-purple">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-saas-purple">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
