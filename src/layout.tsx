import type React from "react"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "./components/auth-provider"
import { Suspense } from "react"
import "./styles.css"

export function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
      <Suspense fallback={<div>Loading...</div>}>
        <AuthProvider>{children}</AuthProvider>
      </Suspense>
    </div>
  )
}

export default RootLayout
