import { Badge } from "@/components/ui/badge"
import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { Eye, MessageSquare } from "lucide-react"
import Link from "next/link"

type ForumTopic = {
  id: string
  title: string
  author: {
    name: string
    avatar?: string
    role: "student" | "teacher"
  }
  date: string
  tags: string[]
  repliesCount: number
  viewsCount: number
  lastReply?: {
    author: {
      name: string
      avatar?: string
    }
    date: string
  }
}

const mockTopics: ForumTopic[] = [
  {
    id: "1",
    title: "Как интегрировать модели машинного обучения в веб-приложения?",
    author: {
      name: "Михаил Иванов",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "teacher",
    },
    date: "2023-11-10",
    tags: ["ИИ", "Веб-разработка", "ML"],
    repliesCount: 15,
    viewsCount: 230,
    lastReply: {
      author: {
        name: "Елена Петрова",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      date: "2023-11-15",
    },
  },
  {
    id: "2",
    title: "Этические вопросы использования ИИ в образовании",
    author: {
      name: "Анна Смирнова",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "teacher",
    },
    date: "2023-11-12",
    tags: ["Этика", "ИИ", "Образование"],
    repliesCount: 24,
    viewsCount: 312,
    lastReply: {
      author: {
        name: "Михаил Иванов",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      date: "2023-11-16",
    },
  },
  {
    id: "3",
    title: "Помогите с настройкой React + TypeScript для проекта с ИИ",
    author: {
      name: "Дмитрий Соколов",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "student",
    },
    date: "2023-11-14",
    tags: ["React", "TypeScript", "Помощь"],
    repliesCount: 8,
    viewsCount: 145,
    lastReply: {
      author: {
        name: "Анна Смирнова",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      date: "2023-11-15",
    },
  },
]

interface ForumTopicsListProps {
  filter?: "popular" | "recent" | "unanswered"
}

export function ForumTopicsList({ filter }: ForumTopicsListProps) {
  // In a real app, you would filter topics based on the filter parameter
  const topics = mockTopics

  return (
    <div className="divide-y">
      {topics.map((topic) => (
        <Link href={`/forum/topics/${topic.id}`} key={topic.id}>
          <div className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-4">
              <SimpleAvatar username={topic.author.name} size="lg" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{topic.author.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {topic.author.role === "teacher" ? "Учитель" : "Ученик"}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(topic.date).toLocaleDateString("ru-RU")}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mt-2">{topic.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {topic.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{topic.repliesCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{topic.viewsCount}</span>
                    </div>
                  </div>
                  {topic.lastReply && (
                    <div className="flex items-center gap-2">
                      <SimpleAvatar
                        username={topic.lastReply.author.name}
                        size="sm"
                      />
                      <div className="text-xs">
                        <span className="text-muted-foreground">
                          Последний ответ от{" "}
                        </span>
                        <span className="font-medium">
                          {topic.lastReply.author.name}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          ·{" "}
                          {new Date(topic.lastReply.date).toLocaleDateString(
                            "ru-RU",
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
