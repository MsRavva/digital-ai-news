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
    <div className={cn('prose dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            
            if (inline) {
              return (
                <code className={className} {...props}>
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
