import { Star, Zap } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import Link from 'next/link'
import { FaWhatsapp } from "react-icons/fa"

export interface Plug {
  id: string
  name: string
  trade: string
  rating: number
  reviewCount: number
  status: 'Available Now' | 'Busy' | string
  badge: 'Basic' | 'Verified' | 'Pro'
}

interface PlugCardProps {
  plug: Plug
  className?: string
}

export function PlugCard({ plug, className }: PlugCardProps) {
  return (
    <div className={cn("bg-white rounded-3xl shadow-sm p-5 border border-gray-100 max-w-[420px] items-center justify-center", className)}>
      {/* Top Profile Content Block */}
      <div className="flex gap-4 items-start relative mb-4">
        {/* Profile Avatar Frame */}
        <div className="w-[72px] h-[72px] bg-midnight/10 rounded-full overflow-hidden flex-shrink-0">
          <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white font-bold text-xl">
            {plug.name[0]}
          </div>
        </div>

        {/* Details Alignment Column */}
        <div className="flex flex-col items-start gap-1.5 min-w-0 pr-24">
          <h3 className="text-xl font-bold text-[#0A1529] leading-tight tracking-tight">
            {plug.name}
          </h3>

          <Badge badge={plug.badge} />

          <div className="flex items-center gap-1.5 text-base text-[#0A1529]/80 font-medium mt-1">
            <Zap className="w-4 h-4 fill-current text-[#0A1529]" />
            <span>{plug.trade}</span>
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-4 h-4 fill-[#E8A020] text-[#E8A020]" />
            <span className="text-sm font-bold text-[#0A1529]">{plug.rating.toFixed(1)}</span>
            <span className="text-sm text-slate-400">({plug.reviewCount} reviews)</span>
          </div>
        </div>

        {/* Status Chip positioned explicitly inside container layout */}
        <div className="absolute top-0 right-0">
          <StatusChip status={plug.status} />
        </div>
      </div>

      {/* Decorative Divider Rule line matching design */}
      <hr className="border-t border-gray-200/80 my-4" />

      {/* Footer Bottom Actions Row */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <Link
          href={`/p/${plug.id}`}
          className="text-base font-bold text-[#DBA134] hover:text-[#DBA134]/90 transition-colors"
        >
          View Profile
        </Link>

        <button
          onClick={(e) => {
            e.preventDefault();
            // Handle request matching flow logic or WhatsApp triggers here
          }}
          className="bg-[#DBA134] hover:bg-[#DBA134]/90 text-[#0A1529] font-bold px-5 py-3 rounded-full flex items-center gap-2 transition-colors text-sm shadow-sm"
        >
          {/* Custom WhatsApp Icon Path */}
          <FaWhatsapp className='w-7 h-7' />
          <span>Request this Plug</span>
        </button>
      </div>
    </div>
  )
}

function Badge({ badge }: { badge: Plug['badge'] }) {
  // Styles match the soft yellow label look in the design specs
  return (
    <div className="bg-[#FBF4E4] text-[#8C6008] px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase flex items-center justify-center gap-1 border border-[#DBA134]/10">
      <span className="w-1.5 h-1.5 rounded-full bg-[#E8A020]" />
      {badge}
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const isAvailable = status.toLowerCase().includes('available')

  return (
    <div className={cn(
      "px-3 py-1 rounded-full text-xs font-semibold tracking-tight",
      isAvailable ? "bg-[#EAF9F1] text-[#22C55E]" : "bg-gray-100 text-gray-500"
    )}>
      {status}
    </div>
  )
}