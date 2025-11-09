"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { codeToHtml } from "shiki"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

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
        // Определяем тему
        let currentTheme = resolvedTheme
        if (!currentTheme) {
          if (theme === "system") {
            currentTheme = window.matchMedia("(prefers-color-scheme: dark)")
              .matches
              ? "dark"
              : "light"
          } else {
            currentTheme = theme || "light"
          }
        }

        const shikiTheme =
          currentTheme === "dark" ? "github-dark" : "github-light"

        // Нормализуем язык
        const normalizedLang = language.toLowerCase().trim()
        const langMap: Record<string, string> = {
          js: "javascript",
          ts: "typescript",
          py: "python",
          rb: "ruby",
          sh: "bash",
          shell: "bash",
          zsh: "bash",
          yml: "yaml",
          md: "markdown",
          xml: "html",
          scss: "css",
          sass: "css",
          "c++": "cpp",
          "c#": "csharp",
          cs: "csharp",
          kt: "kotlin",
          code: "plaintext",
        }

        const lang = langMap[normalizedLang] || normalizedLang

        if (!isMounted) return

        const html = await codeToHtml(code, {
          lang: lang,
          theme: shikiTheme,
        })

        // Заменяем встроенные стили фона от shiki на наш серый фон
        const modifiedHtml = html
          .replace(
            /style="([^"]*background[^"]*)"/gi,
            (match, styles) => {
              const cleanStyles = styles
                .replace(/background[^:;]*:[^;]+/gi, "")
                .replace(/;\s*;/g, ";")
                .trim()
              return cleanStyles ? `style="${cleanStyles}"` : ""
            },
          )
          .replace(
            /<pre([^>]*?)(?<!style)([^>]*?)>/gi,
            (match, before, after) => {
              if (!match.includes("style=")) {
                return `<pre${before} style="background-color: hsl(var(--muted));"${after}>`
              }
              return match
            },
          )

        if (isMounted) {
          setHighlightedCode(modifiedHtml)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error highlighting code:", error)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    highlightCode()

    return () => {
      isMounted = false
    }
  }, [code, language, resolvedTheme, theme, mounted])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  if (!mounted) {
    return (
      <div className="relative group my-4">
        <pre
          className={cn(
            "relative rounded-lg bg-muted p-4 overflow-x-auto",
            "font-['Ubuntu_Mono',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation_Mono','Courier_New',monospace]",
            className,
          )}
        >
          <code className="text-sm">{code}</code>
        </pre>
        <button
          className={cn(
            "absolute top-2 right-2 z-10",
            "p-2 rounded bg-background dark:bg-muted border border-border shadow-sm",
            "hover:bg-accent dark:hover:bg-muted/80",
            "hover:scale-105 transition-all duration-200",
            "active:scale-95",
            "flex items-center justify-center",
            "text-primary",
          )}
          onClick={handleCopy}
          aria-label="Скопировать код"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <Copy className="h-4 w-4 text-primary" />
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="relative group my-4">
      <pre
        className={cn(
          "relative rounded-lg bg-muted p-4 overflow-x-auto",
          "font-['Ubuntu_Mono',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation_Mono','Courier_New',monospace]",
          className,
        )}
      >
        {highlightedCode && !isLoading ? (
          <div
            className="text-sm [&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:m-0 [&_pre]:overflow-visible"
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        ) : (
          <code className="text-sm">{code}</code>
        )}
      </pre>
      <button
        className={cn(
          "absolute top-2 right-2 z-10",
          "p-2 rounded bg-background dark:bg-muted border border-border shadow-sm",
          "hover:bg-accent dark:hover:bg-muted/80",
          "hover:scale-105 transition-all duration-200",
          "active:scale-95",
          "flex items-center justify-center",
          "text-primary",
        )}
        onClick={handleCopy}
        aria-label="Скопировать код"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-primary" />
        )}
      </button>
    </div>
  )
}

