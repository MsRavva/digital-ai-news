import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Mulish } from "next/font/google"
import { AuthProvider } from "@/context/auth-context"
import { CodeCopyProvider } from "@/components/code-copy-provider"
import "./globals.css"

const mulish = Mulish({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap"
})

export const metadata = {
  title: "AI News",
  description: "Платформа для публикации новостей и обсуждения веб-разработки с ИИ",
  generator: 'v0.dev',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={mulish.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <CodeCopyProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </CodeCopyProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}