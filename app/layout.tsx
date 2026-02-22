import type { Metadata } from 'next'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'
import ThemeProvider from '@/components/providers/ThemeProvider'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'The Big Tip - Sports Tipping Competition',
  description: 'Predict 50 sporting events. Win big. Prove you\'re the best.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
