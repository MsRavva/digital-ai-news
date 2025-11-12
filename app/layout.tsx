import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { GlobalBackground } from "@/components/global-background";

export const metadata: Metadata = {
  title: "Digital AI News",
  description: "Digital AI News Platform",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <GlobalBackground />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

