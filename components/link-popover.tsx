"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Link as LinkIcon } from "lucide-react"
import { useState } from "react"

interface LinkPopoverProps {
  onLinkAdd: (url: string, name: string) => void
}

export function LinkPopover({ onLinkAdd }: LinkPopoverProps) {
  const [url, setUrl] = useState("")
  const [name, setName] = useState("")
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Предотвращаем всплытие события
    if (url.trim()) {
      // Если имя не указано, используем URL в качестве имени
      const linkName = name.trim() || url.trim()
      onLinkAdd(url.trim(), linkName)
      setUrl("")
      setName("")
      setOpen(false) // Закрываем попап после добавления ссылки
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1 border-[hsl(var(--saas-purple))] text-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple)/0.1)]"
        >
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
            />
            <Input
              placeholder="Название ссылки (необязательно)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button
              type="submit"
              variant="default"
            >
              Добавить
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  )
}
