import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from "@/components/cart-provider"
import { VendorProvider } from "@/components/vendor-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sabornuts - App de Pedidos",
  description: "Aplicación para gestionar pedidos de Sabornuts",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <VendorProvider>
            <CartProvider>
              {children}
              <Toaster />
            </CartProvider>
          </VendorProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'