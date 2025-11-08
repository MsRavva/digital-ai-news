'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import '@uiw/react-md-editor/markdown-editor.css'
import { cn } from '@/lib/utils'

// Динамический импорт для избежания проблем с SSR
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface MarkdownEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  placeholder?: string
  className?: string
  height?: number
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Начните писать в формате Markdown...',
  className,
  height = 400,
}: MarkdownEditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn('rounded-lg border bg-background', className)}>
        <div className="min-h-[400px] px-4 py-3 text-muted-foreground flex items-center justify-center">
          Загрузка редактора...
        </div>
      </div>
    )
  }

  return (
    <div className={cn('markdown-editor-wrapper', className)}>
      <style jsx global>{`
        /* Базовые стили редактора */
        .markdown-editor-wrapper .w-md-editor {
          background-color: hsl(var(--background)) !important;
          border-color: hsl(var(--border)) !important;
        }
        .markdown-editor-wrapper .w-md-editor-text {
          background-color: hsl(var(--background)) !important;
          color: oklch(0.35 0.048 279.3250) !important;
        }
        .markdown-editor-wrapper .w-md-editor-text-pre {
          background-color: hsl(var(--background)) !important;
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }
        .markdown-editor-wrapper .w-md-editor-text-textarea {
          color: oklch(0.35 0.048 279.3250) !important;
          background-color: hsl(var(--background)) !important;
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }
        /* Все элементы внутри textarea контейнера */
        .markdown-editor-wrapper .w-md-editor-text-textarea *,
        .markdown-editor-wrapper .w-md-editor-text-textarea pre,
        .markdown-editor-wrapper .w-md-editor-text-textarea pre *,
        .markdown-editor-wrapper .w-md-editor-text-textarea code,
        .markdown-editor-wrapper .w-md-editor-text-textarea span,
        .markdown-editor-wrapper .w-md-editor-text-textarea div {
          color: oklch(0.35 0.048 279.3250) !important;
        }
        /* Textarea с максимальной специфичностью */
        .markdown-editor-wrapper textarea,
        .markdown-editor-wrapper .w-md-editor-text-textarea textarea,
        .markdown-editor-wrapper .w-md-editor-text-textarea > textarea,
        .markdown-editor-wrapper .w-md-editor-text-textarea textarea[class],
        .markdown-editor-wrapper .w-md-editor-text-textarea textarea[data-color-mode] {
          color: oklch(0.35 0.048 279.3250) !important;
          padding-left: 1rem !important;
          padding-right: 1rem !important;
          padding-top: 1rem !important;
          padding-bottom: 1rem !important;
          background-color: hsl(var(--background)) !important;
        }
        /* Placeholder */
        .markdown-editor-wrapper .w-md-editor-text-textarea::placeholder,
        .markdown-editor-wrapper .w-md-editor-text-textarea textarea::placeholder,
        .markdown-editor-wrapper textarea::placeholder {
          color: hsl(var(--muted-foreground)) !important;
        }
        /* CodeMirror и другие вложенные редакторы */
        .markdown-editor-wrapper .CodeMirror,
        .markdown-editor-wrapper .CodeMirror-code,
        .markdown-editor-wrapper .CodeMirror-lines,
        .markdown-editor-wrapper .CodeMirror-line,
        .markdown-editor-wrapper .CodeMirror-line > span,
        .markdown-editor-wrapper .CodeMirror-line > span > span {
          color: oklch(0.35 0.048 279.3250) !important;
          padding-left: 1rem !important;
        }
        /* Все возможные селекторы для data-color-mode и inline styles */
        .markdown-editor-wrapper textarea[data-color-mode],
        .markdown-editor-wrapper textarea[data-color-mode="light"],
        .markdown-editor-wrapper [data-color-mode="light"] textarea,
        .markdown-editor-wrapper [data-color-mode="light"] .w-md-editor-text-textarea,
        .markdown-editor-wrapper .w-md-editor-text-textarea textarea[style] {
          color: oklch(0.35 0.048 279.3250) !important;
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }
        /* Стили для скроллбаров редактора */
        .markdown-editor-wrapper .w-md-editor-text-textarea::-webkit-scrollbar,
        .markdown-editor-wrapper .w-md-editor-preview::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .markdown-editor-wrapper .w-md-editor-text-textarea::-webkit-scrollbar-track,
        .markdown-editor-wrapper .w-md-editor-preview::-webkit-scrollbar-track {
          background: hsl(var(--muted));
        }
        .markdown-editor-wrapper .w-md-editor-text-textarea::-webkit-scrollbar-thumb,
        .markdown-editor-wrapper .w-md-editor-preview::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 4px;
        }
        .markdown-editor-wrapper .w-md-editor-text-textarea::-webkit-scrollbar-thumb:hover,
        .markdown-editor-wrapper .w-md-editor-preview::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
        /* Ссылки в редакторе (input) */
        .markdown-editor-wrapper .w-md-editor-text-textarea a {
          color: hsl(var(--primary)) !important;
        }
        /* Превью редактора - улучшенная контрастность и отступы */
        .markdown-editor-wrapper .w-md-editor-preview {
          background-color: hsl(var(--background)) !important;
          color: oklch(0.35 0.048 279.3250) !important;
          padding-left: 1rem !important;
          padding-right: 1rem !important;
          padding-top: 1rem !important;
          padding-bottom: 1rem !important;
        }
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown {
          background-color: transparent !important;
          color: oklch(0.35 0.048 279.3250) !important;
          padding-left: 0 !important;
        }
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown a {
          color: hsl(var(--primary)) !important;
        }
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown a:hover {
          color: hsl(var(--primary)) !important;
          text-decoration: underline !important;
        }
        /* Все текстовые элементы в превью */
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown p,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown h1,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown h2,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown h3,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown h4,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown h5,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown h6,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown li,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown span,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown div,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown ul,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown ol,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown blockquote,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown table,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown td,
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown th {
          color: oklch(0.35 0.048 279.3250) !important;
        }
        /* Инлайн код в превью */
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown code:not(pre code) {
          color: oklch(0.35 0.048 279.3250) !important;
          background-color: oklch(0.88 0.018 264.5071) !important;
          font-family: "Ubuntu Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          border: 1px solid hsl(var(--border)) !important;
        }
        /* Блоки кода в превью */
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown pre {
          background-color: oklch(0.88 0.018 264.5071) !important;
          color: oklch(0.35 0.048 279.3250) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 0.5rem !important;
          padding: 1rem !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
          font-family: "Ubuntu Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          box-shadow: 0 4px 6px -1px hsl(240 35% 20% / 0.15), 0 2px 4px -2px hsl(240 35% 20% / 0.12) !important;
        }
        .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown pre code {
          color: oklch(0.35 0.048 279.3250) !important;
          background-color: transparent !important;
          padding: 0 !important;
          font-family: "Ubuntu Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }
        /* Шрифт для всего текста в редакторе - используем основной шрифт проекта */
        .markdown-editor-wrapper .w-md-editor-text-textarea textarea {
          font-family: inherit !important;
        }
        /* Тулбар - более выразительный цвет в светлой теме */
        .markdown-editor-wrapper .w-md-editor-toolbar {
          background-color: oklch(0.88 0.020 264.5071) !important;
          border-color: hsl(var(--border)) !important;
          border-bottom: 1px solid hsl(var(--border)) !important;
        }
        .markdown-editor-wrapper .w-md-editor-toolbar button,
        .markdown-editor-wrapper .w-md-editor-toolbar button svg,
        .markdown-editor-wrapper .w-md-editor-toolbar button path {
          color: oklch(0.35 0.048 279.3250) !important;
          fill: oklch(0.35 0.048 279.3250) !important;
        }
        .markdown-editor-wrapper .w-md-editor-toolbar button:hover {
          background-color: oklch(0.85 0.018 264.5071) !important;
        }
        .markdown-editor-wrapper .w-md-editor-toolbar button:active {
          background-color: oklch(0.82 0.020 264.5071) !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor {
          background-color: hsl(var(--background)) !important;
          border-color: hsl(var(--border)) !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-text {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-text-textarea {
          color: hsl(var(--foreground)) !important;
          background-color: hsl(var(--background)) !important;
          padding-left: 1rem !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-text-textarea * {
          color: hsl(var(--foreground)) !important;
        }
        .dark .markdown-editor-wrapper textarea {
          color: hsl(var(--foreground)) !important;
          padding-left: 1rem !important;
          padding-right: 1rem !important;
          padding-top: 1rem !important;
          padding-bottom: 1rem !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-text-textarea textarea {
          color: hsl(var(--foreground)) !important;
          padding-left: 1rem !important;
          padding-right: 1rem !important;
          padding-top: 1rem !important;
          padding-bottom: 1rem !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-text-textarea pre {
          padding-left: 1rem !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-text-textarea textarea::placeholder {
          color: hsl(var(--muted-foreground)) !important;
        }
        /* Дополнительные селекторы для темной темы */
        .dark .markdown-editor-wrapper .w-md-editor-text-textarea textarea,
        .dark .markdown-editor-wrapper .w-md-editor-text-textarea textarea *,
        .dark .markdown-editor-wrapper .w-md-editor-text-textarea {
          color: hsl(var(--foreground)) !important;
        }
        /* Скроллбары для темной темы */
        .dark .markdown-editor-wrapper .w-md-editor-text-textarea::-webkit-scrollbar-track,
        .dark .markdown-editor-wrapper .w-md-editor-preview::-webkit-scrollbar-track {
          background: hsl(var(--muted));
        }
        .dark .markdown-editor-wrapper .w-md-editor-text-textarea::-webkit-scrollbar-thumb,
        .dark .markdown-editor-wrapper .w-md-editor-preview::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
        }
        .dark .markdown-editor-wrapper .w-md-editor-text-textarea::-webkit-scrollbar-thumb:hover,
        .dark .markdown-editor-wrapper .w-md-editor-preview::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
        /* Ссылки в редакторе для темной темы */
        .dark .markdown-editor-wrapper .w-md-editor-text-textarea a {
          color: hsl(var(--primary)) !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-preview {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown {
          background-color: transparent !important;
          color: hsl(var(--foreground)) !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown a {
          color: hsl(var(--primary)) !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown a:hover {
          color: hsl(var(--primary)) !important;
          text-decoration: underline !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown p,
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown h1,
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown h2,
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown h3,
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown h4,
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown h5,
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown h6,
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown li,
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown span,
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown div {
          color: hsl(var(--foreground)) !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown code:not(pre code) {
          color: hsl(var(--foreground)) !important;
          background-color: hsl(var(--muted)) !important;
          font-family: "Ubuntu Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown pre {
          background-color: hsl(var(--muted)) !important;
          color: hsl(var(--foreground)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 0.375rem !important;
          font-family: "Ubuntu Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-preview .wmde-markdown pre code {
          color: hsl(var(--foreground)) !important;
          font-family: "Ubuntu Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-toolbar {
          background-color: hsl(var(--muted)) !important;
          border-color: hsl(var(--border)) !important;
        }
        .dark .markdown-editor-wrapper .w-md-editor-toolbar button {
          color: hsl(var(--foreground)) !important;
        }
      `}</style>
      <MDEditor
        value={value}
        onChange={onChange}
        preview="edit"
        hideToolbar={false}
        height={height}
        data-color-mode="auto"
      />
    </div>
  )
}

