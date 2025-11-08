'use client'

import React, { useState, useEffect } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { codeToHtml } from 'shiki'
import { useTheme } from 'next-themes'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, theme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let isMounted = true

    const highlightCode = async () => {
      if (!language) {
        setIsLoading(false)
        return
      }

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
        
        const shikiTheme = currentTheme === 'dark' ? 'github-dark' : 'github-light'
        
        // Нормализуем язык
        const normalizedLang = language.toLowerCase().trim()
        const langMap: Record<string, string> = {
          'js': 'javascript',
          'ts': 'typescript',
          'py': 'python',
          'rb': 'ruby',
          'sh': 'bash',
          'shell': 'bash',
          'zsh': 'bash',
          'yml': 'yaml',
          'md': 'markdown',
          'xml': 'html',
          'scss': 'css',
          'sass': 'css',
          'c++': 'cpp',
          'c#': 'csharp',
          'cs': 'csharp',
          'kt': 'kotlin',
          'code': 'plaintext',
        }
        
        const lang = langMap[normalizedLang] || normalizedLang

        if (!isMounted) return

        const html = await codeToHtml(code, {
          lang: lang,
          theme: shikiTheme,
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
  }, [code, language, mounted, resolvedTheme, theme])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('code-block', className)}>
      <pre>
        {language && (
          <div className="language-label">
            {language}
          </div>
        )}
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
