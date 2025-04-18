'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './ui/code-block'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn(
      'prose dark:prose-invert max-w-none',
      'prose-headings:text-slate-900 dark:prose-headings:text-slate-100',
      'prose-p:text-slate-800 dark:prose-p:text-slate-200',
      'prose-strong:text-slate-900 dark:prose-strong:text-white',
      'prose-em:text-slate-800 dark:prose-em:text-slate-200',
      'prose-li:text-slate-800 dark:prose-li:text-slate-200',
      'prose-blockquote:text-slate-800 dark:prose-blockquote:text-slate-200 prose-blockquote:border-[hsl(var(--saas-purple))]',
      'prose-a:text-[hsl(var(--saas-purple))] dark:prose-a:text-[hsl(var(--saas-purple-light))] prose-a:no-underline hover:prose-a:underline',
      className
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''

            if (inline) {
              return (
                <code className={cn(
                  'px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700',
                  className
                )} {...props}>
                  {children}
                </code>
              )
            }

            return (
              <CodeBlock
                code={String(children).replace(/\n$/, '')}
                language={language}
              />
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
