import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { ForumTopicsList } from "@/components/forum-topics-list"
import { TagsFilter } from "@/components/tags-filter"
import Link from "next/link"

export default function Forum() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Форум</h1>
          <Link href="/forum/create">
            <Button>Создать тему</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <TagsFilter />
          </div>

          <div className="md:col-span-3">
            <Tabs defaultValue="all" className="mb-6">
              <TabsList>
                <TabsTrigger value="all">Все темы</TabsTrigger>
                <TabsTrigger value="popular">Популярные</TabsTrigger>
                <TabsTrigger value="recent">Недавние</TabsTrigger>
                <TabsTrigger value="unanswered">Без ответов</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <Card className="p-0">
                  <ForumTopicsList />
                </Card>
              </TabsContent>
              <TabsContent value="popular">
                <Card className="p-0">
                  <ForumTopicsList filter="popular" />
                </Card>
              </TabsContent>
              <TabsContent value="recent">
                <Card className="p-0">
                  <ForumTopicsList filter="recent" />
                </Card>
              </TabsContent>
              <TabsContent value="unanswered">
                <Card className="p-0">
                  <ForumTopicsList filter="unanswered" />
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
