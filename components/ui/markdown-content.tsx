'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { CodeBlock } from './code-block'
import { cn } from '@/lib/utils'

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn(
      'prose prose-zinc dark:prose-invert max-w-none',
      'prose-headings:font-bold prose-headings:tracking-tight',
      'prose-h1:text-4xl prose-h1:mb-4',
      'prose-h2:text-3xl prose-h2:mb-3 prose-h2:mt-8',
      'prose-h3:text-2xl prose-h3:mb-2 prose-h3:mt-6',
      'prose-p:leading-7 prose-p:mb-4',
      'prose-a:text-[hsl(var(--saas-purple))] dark:prose-a:text-[hsl(var(--saas-purple-light))] prose-a:no-underline hover:prose-a:underline',
      'prose-code:text-foreground dark:prose-code:text-foreground',
      'prose-code:bg-muted dark:prose-code:bg-muted',
      'prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
      'prose-code:before:content-none prose-code:after:content-none',
      'prose-code:font-mono',
      'prose-pre:bg-transparent prose-pre:p-0',
      'prose-img:rounded-lg prose-img:shadow-md',
      'prose-blockquote:border-l-4 prose-blockquote:border-zinc-300 dark:prose-blockquote:border-zinc-700',
      'prose-blockquote:pl-4 prose-blockquote:italic',
      'prose-ul:list-disc prose-ul:ml-6',
      'prose-ol:list-decimal prose-ol:ml-6',
      'prose-li:mb-1',
      'prose-table:border-collapse',
      'prose-th:border prose-th:border-zinc-300 dark:prose-th:border-zinc-700 prose-th:p-2 prose-th:bg-zinc-100 dark:prose-th:bg-zinc-800',
      'prose-td:border prose-td:border-zinc-300 dark:prose-td:border-zinc-700 prose-td:p-2',
      className
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ inline, className, children, ...props }) {
            // Для inline кода просто возвращаем обычный code
            if (inline) {
              return (
                <code 
                  className={className} 
                  style={{ fontFamily: '"Ubuntu Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                  {...props}
                >
                  {children}
                </code>
              )
            }
            // Для блочного кода возвращаем обычный code, он будет обработан в pre
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          pre({ children, ...props }) {
            // Извлекаем информацию о языке из дочернего code элемента
            const codeElement = React.Children.toArray(children).find(
              (child: any) => {
                if (typeof child === 'object' && child !== null) {
                  return child.type === 'code' || child.props?.className?.includes('language-')
                }
                return false
              }
            ) as any

            if (!codeElement || !codeElement.props) {
              return <pre {...props}>{children}</pre>
            }

            const className = codeElement.props.className || ''
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const codeContent = String(codeElement.props.children || '').replace(/\n$/, '')

            // Возвращаем CodeBlock вместо pre, чтобы избежать вложенности
            return (
              <CodeBlock
                code={codeContent}
                language={language}
              />
            )
          },
          img({ src, alt, ...props }) {
            if (!src) return null

            const isBase64 = src.startsWith('data:image/')
            const isUrl = src.startsWith('http://') || src.startsWith('https://')

            if (isBase64 && src.length > 1000000) {
              return (
                <div className="max-w-full p-4 my-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md">
                  Изображение слишком большое для отображения
                </div>
              )
            }

            return (
              <img
                {...props}
                src={src}
                alt={alt || 'Изображение'}
                className="max-w-full h-auto my-4 rounded-lg shadow-md"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Изображение+недоступно'
                  e.currentTarget.alt = 'Изображение недоступно'
                }}
              />
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
