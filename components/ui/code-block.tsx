'use client'

import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'
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
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('relative group my-4 transition-all hover:shadow-md', className)}>
      {/* Language label remains outside pre */}
      {language && (
        <div className="absolute left-2 top-0 z-10 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 ring-1 ring-slate-300 dark:ring-slate-700">
          {language}
        </div>
      )}
      {/* Add relative positioning to pre */}
      <pre className="relative overflow-x-auto rounded-lg bg-slate-50 dark:bg-slate-900 px-3 py-2 pt-12 text-sm text-slate-800 dark:text-slate-200 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 transition-all group-hover:ring-[hsl(var(--saas-purple))]/20 dark:group-hover:ring-[hsl(var(--saas-purple))]/20">
        {/* Apply positioning directly to the button */}
        <button
          onClick={handleCopy}
          className="absolute right-4 top-4 z-10 rounded-md p-1.5 bg-[hsl(var(--saas-purple))] text-white border border-[hsl(var(--saas-purple-dark))] shadow-sm transition-all hover:bg-[hsl(var(--saas-purple-dark))] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--saas-purple))]/50"
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
