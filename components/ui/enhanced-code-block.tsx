"use client"

import { Check, Copy } from "lucide-react"
import React, { useState } from "react"
import { Light as SyntaxHighlighter } from "react-syntax-highlighter"
import bash from "react-syntax-highlighter/dist/cjs/languages/hljs/bash"
import css from "react-syntax-highlighter/dist/cjs/languages/hljs/css"
import js from "react-syntax-highlighter/dist/cjs/languages/hljs/javascript"
import json from "react-syntax-highlighter/dist/cjs/languages/hljs/json"
import markdown from "react-syntax-highlighter/dist/cjs/languages/hljs/markdown"
import python from "react-syntax-highlighter/dist/cjs/languages/hljs/python"
import html from "react-syntax-highlighter/dist/cjs/languages/hljs/xml"
import { githubGist } from "react-syntax-highlighter/dist/cjs/styles/hljs"
import { toast } from "sonner"

// Регистрируем языки
SyntaxHighlighter.registerLanguage("javascript", js)
SyntaxHighlighter.registerLanguage("python", python)
SyntaxHighlighter.registerLanguage("html", html)
SyntaxHighlighter.registerLanguage("css", css)
SyntaxHighlighter.registerLanguage("json", json)
SyntaxHighlighter.registerLanguage("bash", bash)
SyntaxHighlighter.registerLanguage("markdown", markdown)

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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success("Код скопирован в буфер обмена")
    setTimeout(() => setCopied(false), 2000)
  }

  // Определяем язык для подсветки
  const highlightLanguage = language === "text" ? undefined : language

  return (
    <div className={`relative rounded-md overflow-hidden my-4 ${className}`}>
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopy}
          className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded transition-colors"
          aria-label="Копировать код"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={highlightLanguage}
        style={githubGist}
        customStyle={{
          margin: 0,
          borderRadius: "0.375rem",
          fontSize: "0.875rem",
        }}
        codeTagProps={{
          className: "font-sans",
        }}
        showLineNumbers={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
