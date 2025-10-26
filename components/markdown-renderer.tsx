"use client"

import type React from "react"
import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { codeToHtml } from "shiki"
import { useTheme } from "next-themes"

interface CodeBlockProps {
  code: string
  language: string
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<boolean>(false)
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const highlightCode = async () => {
      try {
        // Явно указываем доступную тему и язык для избежания использования css-variables
        const codeLang = language && language !== 'text' ? language : 'plaintext';
        const highlightedHtml = await codeToHtml(code, {
          lang: codeLang,
          theme: 'github-light',
        })
        setHtml(highlightedHtml)
      } catch (err) {
        console.error("Error highlighting code with github-light theme:", err)
        // Если github-light недоступна, используем другую тему
        try {
          const codeLang = language && language !== 'text' ? language : 'plaintext';
          const highlightedHtml = await codeToHtml(code, {
            lang: codeLang,
            theme: 'min-light',
          })
          setHtml(highlightedHtml)
        } catch (fallbackErr) {
          console.error("Fallback error highlighting code:", fallbackErr)
          setError(true)
        }
      }
    }

    // Если language === 'text' или undefined, отображаем как обычный код без подсветки
    if (!language || language === 'text') {
      setHtml(null); // Просто отображаем как обычный код
    } else if (code && language) {
      highlightCode()
    }
  }, [code, language])

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="h-5 w-5 text-red-500"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="font-medium">Ошибка подсветки кода</span>
        </div>
        <pre className="mt-2 overflow-x-auto rounded bg-red-100 p-3 text-sm">
          <code>{code}</code>
        </pre>
      </div>
    )
  }

  // Если language === 'text' или undefined, отображаем как обычный код с карточкой и кнопкой копирования
  if (!language || language === 'text') {
    return (
      <div className="relative group my-4 rounded-lg border border-gray-200 bg-white dark:bg-gray-800 shadow-sm overflow-hidden w-1/2">
        <pre className="overflow-x-auto p-2 bg-gray-50 dark:bg-gray-700">
          <code className="text-gray-800 dark:text-gray-200 whitespace-pre">{code}</code>
        </pre>
        <button
          className={`absolute top-2 right-2 p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 ${
            copied ? "bg-green-500 text-white" : ""
          }`}
          onClick={handleCopy}
          title={copied ? "Скопировано!" : "Скопировать код"}
        >
          {copied ? (
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          )}
        </button>
      </div>
    )
  }

  if (!html) {
    return (
      <div className="my-4 rounded-lg border border-gray-200 bg-gray-50 p-2 w-1/2">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <pre className="mt-2 overflow-x-auto rounded bg-gray-100 dark:bg-gray-700 p-3">
          <code className="text-gray-400 dark:text-gray-200">{code}</code>
        </pre>
      </div>
    )
  }

  return (
    <div className="relative group my-4 rounded-lg border border-gray-200 bg-white dark:bg-gray-800 shadow-sm overflow-hidden w-1/2">
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className="overflow-x-auto p-2"
      />
      <button
        className={`absolute top-2 right-2 p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 ${
          copied ? "bg-green-500 text-white" : ""
        }`}
        onClick={handleCopy}
        title={copied ? "Скопировано!" : "Скопировать код"}
      >
        {copied ? (
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        )}
      </button>
    </div>
  )
}

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
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
    <div className={`markdown-content max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            const language = match ? match[1] : "text"
            const codeContent = String(children).replace(/\n$/, "")

            // Проверяем, является ли это инлайновым кодом (если нет языка или язык 'text', и нет переносов строк)
            const isInline = !match && !codeContent.includes('\n')

            if (isInline) {
              const [copied, setCopied] = useState(false)
              const handleCopy = async () => {
                await navigator.clipboard.writeText(String(children))
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }
              return (
                <code
                  className="inline-flex items-center gap-1 rounded-md text-sm font-sans transition-all duration-200 whitespace-normal break-words bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 markdown-inline-code"
                  onClick={handleCopy}
                  title={copied ? "Скопировано!" : "Нажмите, чтобы скопировать"}
                  style={{ 
                    wordBreak: 'break-word'
                  }}
                >
                  <span>{children}</span>
                  {copied && (
                    <svg
                      className="h-3 w-3 text-green-600"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </code>
              )
            }

            // Для многострочного кода без определенного языка используем тот же компонент CodeBlock, но без подсветки синтаксиса
            return <CodeBlock code={codeContent} language={language === "text" ? "" : language} />
          },
          img({ node, ...props }) {
            if (!props.src) {
              return null
            }

            const src = String(props.src) // Преобразуем src в строку
            const isBase64 = src.startsWith("data:image/")

            if (isBase64) {
              try {
                if (src.length < 1000000) {
                  return (
                    <img
                      {...props}
                      src={src}
                      className="base64-image max-w-full h-auto my-4 rounded-lg shadow-md"
                      loading="lazy"
                      alt={props.alt || "Изображение"}
                      onError={(e) => {
                        console.error("Error loading base64 image")
                        e.currentTarget.src =
                          "https://via.placeholder.com/400x300?text=Изображение+недоступно"
                        e.currentTarget.alt = "Изображение недоступно"
                      }}
                    />
                  )
                } else {
                  console.warn("Base64 image too large, not rendering")
                  return (
                    <div className="max-w-full p-4 my-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md">
                      Изображение слишком большое для отображения
                    </div>
                  )
                }
              } catch (error) {
                console.error("Error processing base64 image:", error)
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
                className="rounded-lg shadow-md"
                loading="lazy"
                alt={props.alt || "Изображение"}
                onError={(e) => {
                  console.error("Error loading image:", src)
                  // Устанавливаем замещающее изображение
                  e.currentTarget.src =
                    "https://via.placeholder.com/400x300?text=Изображение+недоступно"
                  e.currentTarget.alt = "Изображение недоступно"
                }}
              />
            )
          },
          // Стилизация таблиц
          table({ node, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table
                  className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg"
                  {...props}
                />
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
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}