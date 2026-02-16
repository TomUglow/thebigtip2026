import Link from 'next/link'
import { Trophy, TrendingUp, Users, ArrowRight  } from 'lucide-react'
import LandingHeader from '@/components/LandingHeader'
import FeatureCard from '@/components/FeatureCard'
import MockEventTable from '@/components/MockEventTable'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero Section */}
      <div className="brand-gradient border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <div>
                <span
                  className="text-[11px] uppercase tracking-wider font-black px-3 py-1 rounded-full inline-block mb-4"
                  style={{ backgroundColor: '#FFD700', opacity: 0.2, color: '#000' }}
                >
                  Free To Play
                </span>
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight font-display leading-tight mb-4">
                  Prove You're The Ultimate
                </h1>
                <h1 className="gold-accent text-4xl lg:text-5xl font-black tracking-tight font-display leading-tight mb-4">
                  Sports Expert
                </h1>
                <p className="text-primary-foreground text-lg text-muted-foreground max-w-md">
                  Create private leagues, challenge your mates, and track your tipping
                  performance across the season. 50+ events.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="bg-primary-foreground text-primary text-center text-sm font-bold px-6 py-3 rounded-lg hover-elevate transition-all"
                >
                  Start Tipping
                  <ArrowRight className="w-4 h-4 ml-2 inline-block" />
                </Link>
                <Link
                  href="/login"
                  className="bg-white/10 text-center text-sm font-bold px-6 py-3 rounded-lg hover-elevate transition-all border border-white/10"
                >
                  Login
                </Link>
              </div>
            </div>

            {/* Right Column - Mock Event Table */}
            <div className="hidden lg:block">
              <MockEventTable />
            </div>
          </div>

          {/* Mobile Mock Table */}
          <div className="lg:hidden mt-12">
            <MockEventTable />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="border-b border-white/10 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight font-display">
              Why Tipsters Love The Big Tip
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run your own tipping competition.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Trophy className="w-12 h-12 gold-accent" />}
              title="Create Leagues"
              description="Private competitions with invite codes. Challenge friends and family."
            />
            <FeatureCard
              icon={<TrendingUp className="w-12 h-12" style={{ color: '#D32F2F' }} />}
              title="Track Performance"
              description="Live leaderboards, win rates, and detailed stats every round."
            />
            <FeatureCard
              icon={<Users className="w-12 h-12" style={{ color: '#D32F2F' }} />}
              title="Global Community"
              description="Compete worldwide in public leagues or keep it local."
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight font-display">
              Ready to back yourself?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join The Big Tip today and start proving you've got what it takes.
            </p>
          </div>
          <Link
            href="/register"
            className="brand-gradient text-white text-center text-sm font-bold px-8 py-3 rounded-lg hover-elevate transition-all inline-block"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  )
}
