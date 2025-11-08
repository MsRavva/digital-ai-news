"use client"

import { useState } from "react"

interface InlineCodeProps {
  children: string
  className?: string
}

export function InlineCode({ children, className }: InlineCodeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy code:", error)
    }
  }

  return (
    <code
      className={`inline-flex items-center gap-1 rounded-md text-sm px-2 py-1 align-middle font-mono cursor-pointer transition-colors hover:bg-muted/80 ${className || ""}`}
      onClick={handleCopy}
      title={copied ? "Скопировано!" : "Нажмите, чтобы скопировать"}
      style={{
        wordBreak: 'break-word',
        lineHeight: '1.4',
        fontFamily: 'var(--font-mono), "Ubuntu Mono", monospace',
        backgroundColor: 'hsl(var(--muted))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))'
      }}
    >
      <span>{children}</span>
      {copied && (
        <svg
          className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0"
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

