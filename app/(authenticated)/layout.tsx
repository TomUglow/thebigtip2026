'use client'

import Navbar from '@/components/Navbar'
import LiveScoresTicker from '@/components/LiveScoresTicker'
import AuthGuard from '@/components/AuthGuard'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />
        <LiveScoresTicker />
        <main>{children}</main>
      </div>
    </AuthGuard>
  )
}
