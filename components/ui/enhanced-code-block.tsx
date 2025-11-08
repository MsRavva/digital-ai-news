"use client"

import { Check, Copy } from "lucide-react"
import { useTheme } from "next-themes"
import React, { useState } from "react"
import { Light as SyntaxHighlighter, Dark as SyntaxHighlighterDark } from "react-syntax-highlighter"
import bash from "react-syntax-highlighter/dist/cjs/languages/hljs/bash"
import css from "react-syntax-highlighter/dist/cjs/languages/hljs/css"
import js from "react-syntax-highlighter/dist/cjs/languages/hljs/javascript"
import json from "react-syntax-highlighter/dist/cjs/languages/hljs/json"
import markdown from "react-syntax-highlighter/dist/cjs/languages/hljs/markdown"
import python from "react-syntax-highlighter/dist/cjs/languages/hljs/python"
import html from "react-syntax-highlighter/dist/cjs/languages/hljs/xml"
import { githubGist } from "react-syntax-highlighter/dist/cjs/styles/hljs"
import { githubDark } from "react-syntax-highlighter/dist/cjs/styles/hljs"
import { toast } from "sonner"

// Регистрируем языки для обоих компонентов
const registerLanguages = (Highlighter: typeof SyntaxHighlighter) => {
  Highlighter.registerLanguage("javascript", js)
  Highlighter.registerLanguage("python", python)
  Highlighter.registerLanguage("html", html)
  Highlighter.registerLanguage("css", css)
  Highlighter.registerLanguage("json", json)
  Highlighter.registerLanguage("bash", bash)
  Highlighter.registerLanguage("markdown", markdown)
}

registerLanguages(SyntaxHighlighter)
registerLanguages(SyntaxHighlighterDark)

interface EnhancedCodeBlockProps {
  code: string
  language?: string
  className?: string
}

export function EnhancedCodeBlock({
  code,
  language = "text",
  className,
}: EnhancedCodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const { resolvedTheme } = useTheme()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success("Код скопирован в буфер обмена")
    setTimeout(() => setCopied(false), 2000)
  }

  // Определяем язык для подсветки
  const highlightLanguage = language === "text" ? undefined : language
  const isDark = resolvedTheme === 'dark'
  const Highlighter = isDark ? SyntaxHighlighterDark : SyntaxHighlighter
  const style = isDark ? githubDark : githubGist

  return (
    <div className={`relative my-4 ${className}`}>
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopy}
          className="p-1.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded transition-colors"
          aria-label="Копировать код"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <Highlighter
        language={highlightLanguage}
        style={style}
        customStyle={{
          margin: 0,
          borderRadius: "0.75rem",
          fontSize: "0.875rem",
          padding: "1.25rem",
          width: "100%",
        }}
        codeTagProps={{
          className: "font-sans",
        }}
        showLineNumbers={false}
      >
        {code}
      </Highlighter>
    </div>
  )
}
