"use client"

import { useEffect } from "react"
import { addCodeCopyHandlers } from "@/lib/code-copy-handler"

export function CodeCopyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cleanup = addCodeCopyHandlers()
    return cleanup
  }, [])

  return <>{children}</>
}

