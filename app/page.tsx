import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { PostsList } from "@/components/posts-list"
import { TagsFilter } from "@/components/tags-filter"
import { RandomContent } from "@/components/random-content"
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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm dark:bg-[#090b0d]/90 dark:border-[#181c22]">
        <div className="w-[75%] mx-auto flex h-16 items-center justify-between">
          <MainNav />
          <div className="flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="w-[75%] py-6 mx-auto">
          <div className="flex flex-col items-center mb-8 text-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">AI News</h1>
              <p className="text-muted-foreground">Последние новости и обсуждения в мире искусственного интеллекта</p>
            </div>
            <div className="mt-4 flex gap-3">
              <div className="relative md:hidden">
                <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-[hsl(var(--saas-purple))]" />
                <Input
                  type="search"
                  placeholder="Поиск..."
                  className="w-full pl-9 bg-background/50 backdrop-blur-sm border-[hsl(var(--saas-purple)/0.2)] focus:border-[hsl(var(--saas-purple))] focus:ring-[hsl(var(--saas-purple)/0.1)] transition-all duration-200 dark:bg-gray-800/50 dark:border-gray-700"
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
              <div className="md:col-span-3">
                <div className="sticky top-24">
                  <TagsFilter tags={tags} />
                </div>
              </div>

              <div className="md:col-span-9">
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

          <div className="mt-12">
            <RandomContent />
          </div>
        </div>
      </main>


    </div>
  )
}
