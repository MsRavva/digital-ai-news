"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export function CommentForm() {
  const [comment, setComment] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would submit the comment to your backend
    console.log("Submitting comment:", comment)
    setComment("")
  }

  return (
    <form onSubmit={handleSubmit}>
      <Textarea
        placeholder="Напишите комментарий..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-h-[100px] mb-2"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={!comment.trim()}>
          Отправить
        </Button>
      </div>
    </form>
  )
}
