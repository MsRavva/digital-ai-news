'use client'

import React, { useState, useEffect } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

// Кэш для highlighter
let highlighterCache: any = null
let highlighterPromise: Promise<any> | null = null

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const highlightCode = async () => {
      if (!language) {
        setIsLoading(false)
        return
      }

      try {
        // Динамический импорт shiki для избежания проблем с SSR
        const shiki = await import('shiki')
        
        // Используем кэшированный highlighter или создаем новый
        if (!highlighterCache && !highlighterPromise) {
          highlighterPromise = shiki.getHighlighter({
            themes: ['github-dark', 'github-light'],
            langs: ['javascript', 'typescript', 'jsx', 'tsx', 'python', 'java', 'c', 'cpp', 'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'html', 'css', 'scss', 'sass', 'less', 'json', 'yaml', 'yml', 'toml', 'xml', 'markdown', 'md', 'bash', 'sh', 'shell', 'sql', 'graphql', 'dockerfile', 'diff', 'text', 'plaintext'],
          })
        }

        const highlighter = highlighterCache || await highlighterPromise
        if (!highlighterCache) {
          highlighterCache = highlighter
        }

        if (!isMounted) return

        // Проверяем, поддерживается ли язык
        const loadedLangs = highlighter.getLoadedLanguages()
        const lang = loadedLangs.includes(language as any) 
          ? language 
          : 'text'

        const html = highlighter.codeToHtml(code, {
          lang: lang,
          themes: {
            dark: 'github-dark',
            light: 'github-light',
          },
        })

        if (isMounted) {
          setHighlightedCode(html)
        }
      } catch (error) {
        console.error('Error highlighting code:', error)
        // Если подсветка не удалась, просто показываем код как есть
        if (isMounted) {
          setHighlightedCode(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    highlightCode()

    return () => {
      isMounted = false
    }
  }, [code, language])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('code-block', className)}>
      {language && (
        <div className="language-label">
          {language}
        </div>
      )}
      <pre>
        <button
          onClick={handleCopy}
          className="copy-button"
          aria-label="Копировать код"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
        {isLoading ? (
          <code className={language ? `language-${language}` : ''}>
            {code}
          </code>
        ) : highlightedCode ? (
          <code
            className={language ? `language-${language}` : ''}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        ) : (
          <code className={language ? `language-${language}` : ''}>
            {code}
          </code>
        )}
      </pre>
    </div>
  )
}
