import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThumbsUp, Reply } from "lucide-react"

type Comment = {
  id: string
  content: string
  author: {
    name: string
    avatar?: string
    role: "student" | "teacher"
  }
  date: string
  likesCount: number
  replies?: Comment[]
}

const mockComments: Comment[] = [
  {
    id: "1",
    content:
      "Очень интересная статья! Особенно понравился раздел о генерации пользовательских интерфейсов. Хотелось бы увидеть больше примеров кода.",
    author: {
      name: "Михаил Иванов",
      avatar: "/placeholder.svg?height=32&width=32",
      role: "teacher",
    },
    date: "2023-11-16",
    likesCount: 8,
    replies: [
      {
        id: "1-1",
        content:
          "Спасибо за отзыв! Я планирую написать отдельную статью с примерами кода для генерации UI с помощью GPT-4.",
        author: {
          name: "Анна Смирнова",
          avatar: "/placeholder.svg?height=32&width=32",
          role: "teacher",
        },
        date: "2023-11-16",
        likesCount: 3,
      },
    ],
  },
  {
    id: "2",
    content:
      "А есть ли какие-то ограничения у новой версии GPT-4 при работе с большими проектами? Насколько хорошо она справляется с анализом сложной кодовой базы?",
    author: {
      name: "Елена Петрова",
      avatar: "/placeholder.svg?height=32&width=32",
      role: "student",
    },
    date: "2023-11-17",
    likesCount: 5,
  },
]

interface CommentsListProps {
  postId: string
}

export function CommentsList({ postId }: CommentsListProps) {
  // In a real app, you would fetch comments based on the postId
  const comments = mockComments

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? "ml-12 mt-4" : "mb-6"}`}>
      <div className="flex items-start gap-4">
        <Avatar className="h-8 w-8 avatar">
          <AvatarImage src={comment.author.avatar || "/placeholder.svg"} alt={comment.author.name} />
          <AvatarFallback className="avatar-fallback">{comment.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center">
            <span className="font-medium">{comment.author.name}</span>
            <Badge variant="outline" className="ml-2 text-xs">
              {comment.author.role === "teacher" ? "Учитель" : "Ученик"}
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">
              {new Date(comment.date).toLocaleDateString("ru-RU")}
            </span>
          </div>
          <p className="mt-1">{comment.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ThumbsUp className="h-3 w-3 mr-1" />
              <span className="text-xs">{comment.likesCount}</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Reply className="h-3 w-3 mr-1" />
              <span className="text-xs">Ответить</span>
            </Button>
          </div>
        </div>
      </div>

      {comment.replies?.map((reply) => renderComment(reply, true))}
    </div>
  )

  return <div>{comments.map((comment) => renderComment(comment))}</div>
}
