import './globals.css'
import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Market Oracle - AI Stock Picking Battle',
  description: '5 AIs compete to pick the best penny stocks',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen text-white">
        <Navigation />
        {children}
      </body>
    </html>
  )
}
