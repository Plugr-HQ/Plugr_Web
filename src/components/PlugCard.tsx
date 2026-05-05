import { Star } from 'lucide-react'
import { cn } from '@/src/lib/utils'

export interface Plug {
  name: string
  trade: string
  rating: number
  status: string
  badge: 'Basic' | 'Verified' | 'Pro'
}

interface PlugCardProps {
  plug: Plug
  className?: string
}

export function PlugCard({ plug, className }: PlugCardProps) {
  return (
    <div className={cn("bg-white rounded-card shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-gold/20", className)}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-bone rounded-full overflow-hidden flex-shrink-0">
          <div className="w-full h-full bg-midnight/10 flex items-center justify-center text-midnight font-display font-bold">
            {plug.name[0]}
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-midnight truncate">{plug.name}</span>
            <Badge badge={plug.badge} />
          </div>
          <span className="text-sm text-slate">{plug.trade}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-gold text-gold" />
          <span className="text-sm font-bold text-midnight">{plug.rating}</span>
        </div>
        <StatusChip status={plug.status} />
      </div>
    </div>
  )
}

function Badge({ badge }: { badge: Plug['badge'] }) {
  const variants = {
    Basic: "bg-slate/10 text-slate",
    Verified: "bg-gold text-midnight",
    Pro: "bg-midnight text-gold"
  }
  
  return (
    <div className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
      variants[badge]
    )}>
      {badge}
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const isAvailable = status.toLowerCase() === 'available' || status.toLowerCase() === 'verified'
  const isBusy = status.toLowerCase() === 'busy' || status.toLowerCase() === 'pending'
  
  return (
    <div className={cn(
      "px-3 py-1 rounded-full text-[11px] font-medium",
      isAvailable ? "bg-green-100 text-green-700" : 
      isBusy ? "bg-amber-100 text-amber-700" : "bg-slate/10 text-slate"
    )}>
      {status}
    </div>
  )
}
