import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Mulish, Ubuntu_Mono } from "next/font/google"
import { AuthProvider } from "@/context/auth-context"
import "./globals.css"
import "@/styles/shake-animation.css"
import "@/styles/code.css"

const mulish = Mulish({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap"
})

const ubuntuMono = Ubuntu_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-ubuntu-mono"
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
      <body className={`${mulish.className} ${ubuntuMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}