'use client'

import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Код скопирован в буфер обмена')
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
        <code className={language ? `language-${language}` : ''}>
          {code}
        </code>
      </pre>
    </div>
  )
}
