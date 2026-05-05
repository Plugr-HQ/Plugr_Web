import { Shield, Lock, Star, MapPin } from 'lucide-react'

export function TrustBar() {
  const stats = [
    { icon: Shield, label: "NIN Verified" },
    { icon: Lock, label: "Escrow Protected" },
    { icon: Star, label: "Rated & Reviewed" },
    { icon: MapPin, label: "Ikeja, Lagos" }
  ]

  return (
    <div className="bg-bone py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between md:justify-center gap-8 md:gap-16 whitespace-nowrap overflow-x-auto no-scrollbar">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-2 text-slate font-medium">
              <stat.icon className="w-5 h-5 text-gold" />
              <span className="text-sm">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
