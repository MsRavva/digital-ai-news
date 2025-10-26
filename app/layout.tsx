import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/context/auth-context"
import { Mulish } from "next/font/google"
import { Victor_Mono } from "next/font/google"
import type React from "react"
import "../styles/theme.css"
import "../styles/base.css"
import "../styles/components.css"
import "@/styles/shake-animation.css"
import "@/styles/code-blocks.css"
import "../styles/tokens/colors.css"
import "../styles/tokens/typography.css"
import "../styles/tokens/spacing.css"
import "../styles/tokens/borders.css"
import "../styles/tokens/shadows.css"
import "../styles/utilities/animations.css"
import "../styles/utilities/transitions.css"

const mulish = Mulish({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
})

const victorMono = Victor_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

export const metadata = {
  title: "AI News",
  description:
    "Платформа для публикации новостей и обсуждения веб-разработки с ИИ",
  generator: "v0.dev",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={mulish.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
