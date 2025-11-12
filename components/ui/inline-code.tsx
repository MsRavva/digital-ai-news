"use client"

import { Check } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface InlineCodeProps {
  children: React.ReactNode
  className?: string
}

export function InlineCode({ children, className }: InlineCodeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = String(children).replace(/\n$/, "")
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <code
      className={cn(
        "inline-flex items-center gap-1",
        "bg-muted text-foreground",
        "px-1.5 py-0.5 rounded",
        "text-sm font-mono",
        "font-['Ubuntu_Mono',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation_Mono','Courier_New',monospace]",
        "cursor-pointer hover:bg-muted/80 transition-colors",
        className,
      )}
      onClick={(e) => {
        e.stopPropagation()
        handleCopy()
      }}
      onMouseDown={(e) => e.stopPropagation()}
      title={copied ? "Скопировано!" : "Нажмите, чтобы скопировать"}
    >
      <span>{children}</span>
      {copied && (
        <Check className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
      )}
    </code>
  )
}

