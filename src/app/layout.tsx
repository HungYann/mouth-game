import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mouth Game',
  description: 'Multiplayer mouth rhythm game'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
