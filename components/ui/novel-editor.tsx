'use client'

import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Undo, Redo, ImageIcon, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface NovelEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function NovelEditor({ value, onChange, placeholder = 'Начните писать...', className }: NovelEditorProps) {
  const [mounted, setMounted] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 hover:underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-zinc dark:prose-invert max-w-none',
          'focus:outline-none min-h-[300px] px-4 py-3',
          'prose-headings:font-bold prose-headings:tracking-tight',
          'prose-p:leading-7',
          'prose-a:text-blue-600 dark:prose-a:text-blue-400',
          'prose-code:text-pink-600 dark:prose-code:text-pink-400',
          'prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800',
          'prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
          'prose-pre:bg-zinc-950 dark:prose-pre:bg-zinc-900',
          'prose-img:rounded-lg prose-img:shadow-md'
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.getText()
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  const addImage = () => {
    const url = window.prompt('URL изображения:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = window.prompt('URL ссылки:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  if (!mounted || !editor) {
    return (
      <div className={cn('rounded-lg border bg-background', className)}>
        <div className="min-h-[300px] px-4 py-3 text-muted-foreground">
          Загрузка редактора...
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border bg-background overflow-hidden', className)}>
      <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-muted' : ''}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'bg-muted' : ''}
        >
          <Code className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-muted' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addLink}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      
      <EditorContent editor={editor} />
    </div>
  )
}
