'use client'

import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { codeToHtml } from 'shiki'

interface CodeBlockProps {
  code: string
  language: string
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    const highlightCode = async () => {
      try {
        const highlightedHtml = await codeToHtml(code, {
          lang: language,
          theme: 'github-dark'
        })
        setHtml(highlightedHtml)
      } catch (err) {
        console.error('Error highlighting code:', err)
        setError(true)
      }
    }

    if (code && language) {
      highlightCode()
    }
  }, [code, language])

  if (error) {
    return (
      <pre className="p-4 my-4 bg-gray-800 rounded-md overflow-x-auto">
        <code className="text-sm text-gray-200">
          {code}
        </code>
      </pre>
    )
  }

  if (!html) {
    return (
      <pre className="p-4 my-4 bg-gray-800 rounded-md overflow-x-auto">
        <code className="text-sm text-gray-200 animate-pulse">
          {code}
        </code>
      </pre>
    )
  }

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: html }} 
      className="rounded-md overflow-hidden my-4"
    />
  )
}

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`markdown-content prose prose-stone dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            // Для инлайнового кода используем стандартное оформление
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-mono">
                  {children}
                </code>
              )
            }

            // Для блоков кода используем подсветку Shiki
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : 'text'
            
            // Преобразуем содержимое в строку
            const codeContent = String(children).replace(/\n$/, '')
            
            return <CodeBlock code={codeContent} language={language} />
          },
          img({ node, ...props }) {
            // Проверяем, что src не пустой
            if (!props.src) {
              return null
            }

            // Проверяем, что src является действительным URL или base64-строкой
            const src = props.src
            const isBase64 = src.startsWith('data:image/')
            
            // Если это base64-изображение, добавляем специальную обработку
            if (isBase64) {
              try {
                // Проверяем, что base64-строка корректна
                if (src.length < 1000000) { // Ограничиваем размер для предотвращения проблем с производительностью
                  return (
                    <img
                      {...props}
                      src={src}
                      className="base64-image max-w-full h-auto my-4 rounded-lg shadow-md"
                      loading="lazy"
                      alt={props.alt || 'Изображение'}
                      onError={(e) => {
                        console.error('Error loading base64 image')
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Изображение+недоступно'
                        e.currentTarget.alt = 'Изображение недоступно'
                      }}
                    />
                  )
                } else {
                  console.warn('Base64 image too large, not rendering')
                  return (
                    <div className="max-w-full p-4 my-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md">
                      Изображение слишком большое для отображения
                    </div>
                  )
                }
              } catch (error) {
                console.error('Error processing base64 image:', error)
                return (
                  <div className="max-w-full p-4 my-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md">
                    Ошибка при обработке изображения
                  </div>
                )
              }
            }

            // Для обычных URL-изображений
            return (
              <img
                {...props}
                src={src}
                className="markdown-image max-w-full h-auto my-4 rounded-lg shadow-md"
                loading="lazy"
                alt={props.alt || 'Изображение'}
                onError={(e) => {
                  console.error('Error loading image:', src)
                  // Устанавливаем замещающее изображение
                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Изображение+недоступно'
                  e.currentTarget.alt = 'Изображение недоступно'
                }}
              />
            )
          },
          // Стилизация таблиц
          table({ node, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg" {...props} />
              </div>
            )
          },
          th({ node, ...props }) {
            return (
              <th 
                className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-left text-sm font-semibold text-gray-700 dark:text-gray-300"
                {...props}
              />
            )
          },
          td({ node, ...props }) {
            return (
              <td 
                className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
                {...props}
              />
            )
          },
          // Стилизация блоков цитат
          blockquote({ node, ...props }) {
            return (
              <blockquote 
                className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-4 italic text-gray-600 dark:text-gray-400"
                {...props}
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