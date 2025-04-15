'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Link as LinkIcon } from "lucide-react"

interface LinkPopoverProps {
  onLinkAdd: (url: string) => void
}

export function LinkPopover({ onLinkAdd }: LinkPopoverProps) {
  const [url, setUrl] = useState("")
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Предотвращаем всплытие события
    if (url.trim()) {
      onLinkAdd(url.trim())
      setUrl("")
      setOpen(false) // Закрываем попап после добавления ссылки
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <LinkIcon className="h-4 w-4" />
          <span>Добавить ссылку</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Добавить ссылку</h4>
          <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="border-gray-300 dark:border-gray-600"
            />
            <Button
              type="submit"
              className="bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple))/0.9] text-white"
            >
              Добавить
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  )
}
