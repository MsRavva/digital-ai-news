'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './ui/code-block-new'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''

            if (inline) {
              return (
                <code {...props}>
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
          },
          img({ node, ...props }) {
            // Проверяем, что src не пустой
            if (!props.src) {
              return null;
            }

            // Проверяем, является ли это base64-изображение
            const isBase64 = props.src.startsWith('data:image/');

            return (
              <img
                {...props}
                className={isBase64 ? 'base64-image' : ''}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Изображение+недоступно';
                  e.currentTarget.alt = 'Изображение недоступно';
                }}
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
