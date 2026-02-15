import { ReactNode } from 'react'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="glass-card rounded-xl p-6 space-y-4 text-center hover-elevate transition-all">
      <div className="flex justify-center w-12 h-12 mx-auto">
        {icon}
      </div>
      <h3 className="text-lg font-bold tracking-tight font-display">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
