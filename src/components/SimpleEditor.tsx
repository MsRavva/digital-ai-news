'use client'

import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface SimpleEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function SimpleEditor({ value, onChange, className }: SimpleEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Обновляем содержимое редактора при изменении value извне
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return (
      <div className={`w-full border rounded-md overflow-hidden bg-background ${className}`}>
        <div className="h-[50vh] flex items-center justify-center">
          <div className="text-muted-foreground">Загрузка редактора...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full border rounded-md overflow-hidden bg-background ${className}`}>
      <EditorContent 
        editor={editor} 
        className="prose prose-stone dark:prose-invert max-w-none p-4 min-h-[50vh]"
      />
    </div>
  )
}