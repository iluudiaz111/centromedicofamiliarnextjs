import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { ChatbotWidget } from "@/components/chatbot-widget"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Centro Médico Familiar",
  description: "Centro Médico Familiar en San Juan Sacatepéquez",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster />
            <ChatbotWidget />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
