'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
// @ts-ignore
import { EditorContent, EditorRoot } from 'novel'

interface NovelEditorProps {
  value: string
  onChange: (value: string) => void
 className?: string
}

export default function NovelEditor({ value, onChange, className }: NovelEditorProps) {
  const { theme } = useTheme()
 const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`w-full border rounded-md overflow-hidden bg-background ${className}`}>
        <div className="h-[50vh] flex items-center justify-center">
          <div className="text-muted-foreground">Загрузка редактора...</div>
        </div>
      </div>
    )
  }

  // Гарантируем, что всегда есть базовая структура документа
  const initialContent = value ? 
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: value }] }] } : 
    { type: 'doc', content: [] }

  return (
    <motion.div
      className={`w-full border rounded-md overflow-hidden bg-background ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <EditorRoot>
        <EditorContent
          initialContent={initialContent}
          onUpdate={({ editor }: any) => {
            if (editor) {
              const markdownContent = editor.storage.markdown.getMarkdown();
              onChange(markdownContent);
            }
          }}
          className="w-full"
          editorProps={{
            attributes: {
              class: 'prose prose-stone dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full p-4 min-h-[400px] prose-code:bg-transparent prose-pre:text-foreground prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-transparent prose-table:border prose-table:border-gray-300 dark:prose-table:border-gray-600 prose-th:bg-muted dark:prose-th:bg-gray-800 prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-img:rounded-md prose-img:border-0 prose-hr:border-t prose-hr:border-gray-200 dark:prose-hr:border-gray-700',
            },
          }}
        />
      </EditorRoot>
    </motion.div>
  )
}
