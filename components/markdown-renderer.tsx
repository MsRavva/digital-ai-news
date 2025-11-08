"use client"

import type React from "react"
import { useEffect, useState, useRef, useLayoutEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { codeToHtml } from "shiki"
import { useTheme } from "next-themes"
import { InlineCode } from "@/components/ui/inline-code"
import { Check, Copy } from "lucide-react"

interface CodeBlockProps {
  code: string
  language: string
}

// Маппинг для нормализации языков (исправление опечаток и альтернативных названий)
const normalizeLanguage = (lang: string | undefined | null): string => {
  if (!lang || lang === 'text') return 'plaintext'
  
  const normalized = lang.toLowerCase().trim()
  
  // Маппинг опечаток и альтернативных названий
  const languageMap: Record<string, string> = {
    'javas': 'javascript',
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'sh': 'bash',
    'shell': 'bash',
    'zsh': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'html': 'html',
    'xml': 'html',
    'css': 'css',
    'scss': 'css',
    'sass': 'css',
    'json': 'json',
    'sql': 'sql',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'java': 'java',
    'cpp': 'cpp',
    'c++': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'c#': 'csharp',
    'swift': 'swift',
    'kt': 'kotlin',
    'dart': 'dart',
    'vue': 'vue',
    'svelte': 'svelte',
    'code': 'plaintext', // 'code' не является валидным языком, используем plaintext
  }
  
  return languageMap[normalized] || normalized
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<boolean>(false)
  const [copied, setCopied] = useState(false)
  const { resolvedTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ждем монтирования для правильного определения темы
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (!mounted) return // Не выполняем подсветку до монтирования

    const highlightCode = async () => {
      // Нормализуем язык и обрабатываем опечатки (выносим за пределы try для использования в catch)
      const normalizedLang = normalizeLanguage(language)
      
      try {
        // Определяем тему: используем resolvedTheme, если доступен, иначе проверяем theme или системную тему
        let currentTheme = resolvedTheme
        if (!currentTheme) {
          if (theme === 'system') {
            currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          } else {
            currentTheme = theme || 'light'
          }
        }
        
        const shikiTheme = currentTheme === 'dark' ? 'github-dark' : 'github-light';
        
        const highlightedHtml = await codeToHtml(code, {
          lang: normalizedLang,
          theme: shikiTheme,
        })
        
        // Модифицируем HTML для переопределения фона только на pre элементе
        // Важно: не трогаем стили внутри span элементов, чтобы сохранить подсветку синтаксиса
        const bgColor = currentTheme === 'dark' ? 'hsl(var(--muted))' : 'oklch(0.88 0.018 264.5071)';
        
        // Обрабатываем только pre элемент, сохраняя все стили внутри (span элементы с подсветкой)
        let modifiedHtml = highlightedHtml
          // Находим pre элемент и модифицируем только его style атрибут
          .replace(
            /<pre([^>]*?)style="([^"]*)"/gi,
            (match, attrs, styles) => {
              // Удаляем только background-color из pre, сохраняя остальные стили
              const cleanStyles = styles
                .replace(/background-color:\s*[^;]+(!important)?/gi, '')
                .replace(/;\s*;/g, ';')
                .replace(/^\s*;\s*|\s*;\s*$/g, '')
                .trim()
              const newStyles = cleanStyles 
                ? `background-color: ${bgColor} !important; ${cleanStyles}`.replace(/\s+/g, ' ').trim()
                : `background-color: ${bgColor} !important`
              return `<pre${attrs}style="${newStyles}"`
            }
          )
          // Если pre не имеет style атрибута, добавляем его
          .replace(
            /<pre([^>]*?)(?<!style)([^>]*?)>/gi,
            (match, before, after) => {
              if (!match.includes('style=')) {
                return `<pre${before} style="background-color: ${bgColor} !important"${after}>`
              }
              return match
            }
          )
        
        setHtml(modifiedHtml)
      } catch (err: any) {
        console.error(`Error highlighting code with language "${normalizedLang}":`, err)
        
        // Если ошибка связана с неизвестным языком, пробуем plaintext
        if (err?.message?.includes('not included') || err?.message?.includes('Language')) {
          try {
            const currentTheme = resolvedTheme || (theme === 'system' 
              ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
              : theme) || 'light'
            const shikiTheme = currentTheme === 'dark' ? 'github-dark' : 'github-light'
            
            // Пробуем с plaintext
            const highlightedHtml = await codeToHtml(code, {
              lang: 'plaintext',
              theme: shikiTheme,
            })
            
            const bgColor = currentTheme === 'dark' ? '#0d1117' : '#f6f8fa'
            // Обрабатываем только pre элемент для plaintext
            const modifiedHtml = highlightedHtml
              .replace(
                /<pre([^>]*?)style="([^"]*)"/gi,
                (match, attrs, styles) => {
                  const cleanStyles = styles
                    .replace(/background-color:\s*[^;]+(!important)?/gi, '')
                    .replace(/;\s*;/g, ';')
                    .replace(/^\s*;\s*|\s*;\s*$/g, '')
                    .trim()
                  const newStyles = cleanStyles 
                    ? `background-color: ${bgColor} !important; ${cleanStyles}`.replace(/\s+/g, ' ').trim()
                    : `background-color: ${bgColor} !important`
                  return `<pre${attrs}style="${newStyles}"`
                }
              )
              .replace(
                /<pre([^>]*?)(?<!style)([^>]*?)>/gi,
                (match, before, after) => {
                  if (!match.includes('style=')) {
                    return `<pre${before} style="background-color: ${bgColor} !important"${after}>`
                  }
                  return match
                }
              )
            
            setHtml(modifiedHtml)
            return
          } catch (plaintextErr) {
            console.error("Error with plaintext fallback:", plaintextErr)
            setError(true)
            return
          }
        }
        
        // Если основная тема недоступна, используем fallback
        try {
          let currentTheme = resolvedTheme || theme || 'light'
          if (currentTheme === 'system') {
            currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          }
          const fallbackTheme = currentTheme === 'dark' ? 'min-dark' : 'min-light';
          const highlightedHtml = await codeToHtml(code, {
            lang: normalizedLang,
            theme: fallbackTheme,
          })
          
          // Модифицируем HTML для переопределения фона только на pre
          const bgColor = currentTheme === 'dark' ? 'hsl(var(--muted))' : 'oklch(0.88 0.018 264.5071)';
          const modifiedHtml = highlightedHtml
            .replace(
              /<pre([^>]*?)style="([^"]*)"/gi,
              (match, attrs, styles) => {
                const cleanStyles = styles
                  .replace(/background-color:\s*[^;]+(!important)?/gi, '')
                  .replace(/;\s*;/g, ';')
                  .replace(/^\s*;\s*|\s*;\s*$/g, '')
                  .trim()
                const newStyles = cleanStyles 
                  ? `background-color: ${bgColor} !important; ${cleanStyles}`.replace(/\s+/g, ' ').trim()
                  : `background-color: ${bgColor} !important`
                return `<pre${attrs}style="${newStyles}"`
              }
            )
            .replace(
              /<pre([^>]*?)(?<!style)([^>]*?)>/gi,
              (match, before, after) => {
                if (!match.includes('style=')) {
                  return `<pre${before} style="background-color: ${bgColor} !important"${after}>`
                }
                return match
              }
            )
          
          setHtml(modifiedHtml)
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
  }, [code, language, resolvedTheme, theme, mounted])

  // Дополнительная обработка после рендеринга для гарантии переопределения фона
  // ВСЕГДА вызываем этот хук безусловно
  useEffect(() => {
    if (!mounted || !html) return
    
    const timer = setTimeout(() => {
      const currentTheme = resolvedTheme || (theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme) || 'light'
      const bgColor = currentTheme === 'dark' ? '#0d1117' : '#f6f8fa'
      
      // Находим все элементы Shiki (pre) и переопределяем фон - это единственная карточка
      const shikiElements = document.querySelectorAll('.shiki-wrapper pre, .shiki-wrapper [style*="background"]')
      const borderColor = currentTheme === 'dark' ? '#334155' : '#e2e8f0'
      
      shikiElements.forEach((el) => {
        const htmlEl = el as HTMLElement
        // Переопределяем фон и границу только для pre элемента
        if (htmlEl.tagName === 'PRE') {
          htmlEl.style.setProperty('background-color', bgColor, 'important')
          htmlEl.style.setProperty('border-color', borderColor, 'important')
          // Также переопределяем через setAttribute для надежности
          const currentStyle = htmlEl.getAttribute('style') || ''
          const newStyle = currentStyle
            .replace(/background-color:\s*[^;]+/gi, '')
            .replace(/border-color:\s*[^;]+/gi, '')
            .replace(/;\s*;/g, ';')
            .replace(/^\s*;\s*|\s*;\s*$/g, '')
          const finalStyle = `background-color: ${bgColor} !important; border-color: ${borderColor} !important; ${newStyle}`.trim()
          htmlEl.setAttribute('style', finalStyle)
        }
      })
    }, 50)
    
    return () => clearTimeout(timer)
  }, [html, resolvedTheme, theme, mounted])

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

  // Если language === 'text' или undefined, отображаем как обычный код с кнопкой копирования
  if (!language || language === 'text') {
    return (
      <div className="shiki-wrapper">
        <pre
          className="overflow-x-auto"
          style={{
            fontFamily: 'var(--font-mono), "Ubuntu Mono", monospace',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            padding: '1.25rem',
            borderRadius: '0.5rem',
            backgroundColor: 'hsl(var(--muted))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
            margin: 0,
            width: '100%'
          }}
        >
          <code style={{
            fontFamily: 'var(--font-mono), "Ubuntu Mono", monospace',
            backgroundColor: 'transparent',
            padding: 0
          }}>{code}</code>
        </pre>
        <button
          className={`absolute top-2 right-2 p-1.5 rounded-md transition-all duration-200 ${
            copied ? "bg-green-500 text-white" : "bg-muted hover:bg-muted/80 text-muted-foreground"
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
      <div className="my-4 rounded-lg border border-border bg-muted p-2 w-1/2">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-5 bg-muted-foreground/20 rounded-full animate-pulse"></div>
          <div className="h-4 bg-muted-foreground/20 rounded w-24 animate-pulse"></div>
        </div>
        <pre className="mt-2 overflow-x-auto rounded bg-muted dark:bg-muted p-3">
          <code className="text-muted-foreground dark:text-foreground">{code}</code>
        </pre>
      </div>
    )
  }

  return (
    <div className="shiki-wrapper">
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className="overflow-x-auto"
      />
      <button
        onClick={handleCopy}
        title={copied ? "Скопировано!" : "Скопировать код"}
        aria-label="Копировать код"
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
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
  // Все хуки должны быть вызваны до любого условного возврата
  const [isClient, setIsClient] = useState(false)
  const [isInsideLink, setIsInsideLink] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Callback ref для проверки при монтировании
  const containerRef = useRef<HTMLDivElement | null>(null)
  const setContainerRef = (element: HTMLDivElement | null) => {
    containerRef.current = element
    if (element) {
      // Проверяем сразу при монтировании
      const parentLink = element.closest('a')
      setIsInsideLink(parentLink !== null)
    }
  }

  if (!isClient) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div ref={setContainerRef} className={`markdown-content max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Кастомный компонент для ссылок, чтобы избежать вложенных <a>
          a({ node, href, children, ...props }) {
            // Всегда рендерим как span с обработчиком клика
            // Проверяем наличие родительского <a> через callback ref при монтировании
            return (
              <span
                ref={(el) => {
                  if (el && typeof document !== 'undefined') {
                    // Проверяем наличие родительского <a> при монтировании
                    const parentLink = el.closest('a')
                    if (parentLink && parentLink !== el) {
                      // Если нашли родительский <a>, элемент уже span, ничего не делаем
                      // Но если это <a>, заменяем на span
                      if (el.tagName === 'A') {
                        const span = document.createElement('span')
                        span.className = el.className
                        span.style.cssText = el.style.cssText
                        span.setAttribute('title', el.getAttribute('title') || href || '')
                        span.textContent = el.textContent || ''
                        span.onclick = (e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          if (href) {
                            window.open(href, '_blank', 'noopener,noreferrer')
                          }
                        }
                        el.parentNode?.replaceChild(span, el)
                      }
                    }
                  }
                }}
                {...props}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  if (href) {
                    window.open(href, '_blank', 'noopener,noreferrer')
                  }
                }}
                className="text-primary underline cursor-pointer hover:text-primary/80"
                title={href}
              >
                {children}
              </span>
            )
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            const language = match ? match[1] : "text"
            const codeContent = String(children).replace(/\n$/, "")

            // Проверяем, является ли это инлайновым кодом (если нет языка или язык 'text', и нет переносов строк)
            const isInline = !match && !codeContent.includes('\n')

            if (isInline) {
              // Используем отдельный компонент для инлайн кода с копированием
              return <InlineCode>{String(children)}</InlineCode>
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
                  className="min-w-full border border-border dark:border-border rounded-lg"
                  {...props}
                />
              </div>
            )
          },
          th({ node, ...props }) {
            return (
              <th
                className="px-4 py-2 bg-muted dark:bg-muted border-b border-border dark:border-border text-left text-sm font-semibold text-foreground dark:text-foreground"
                {...props}
              />
            )
          },
          td({ node, ...props }) {
            return (
              <td
                className="px-4 py-2 border-b border-border dark:border-border text-sm text-foreground dark:text-foreground"
                {...props}
              />
            )
          },
          // Стилизация блоков цитат
          blockquote({ node, ...props }) {
            return (
              <blockquote
                className="border-l-4 border-border dark:border-border pl-4 py-1 my-4 italic text-muted-foreground dark:text-muted-foreground"
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