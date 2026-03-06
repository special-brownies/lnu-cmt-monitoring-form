import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { QueryProvider } from '@/providers/query-provider'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: 'LNU CMT Monitoring System',
  description: 'LNU CMT Monitoring System frontend',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/assets/lnu-logo.png', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} font-sans antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
