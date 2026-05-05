import Link from 'next/link'
import { Star } from 'lucide-react'
import { cn } from '@/src/lib/utils'

export function FeaturedPlugs() {
  const plugs = [
    { id: '1', name: "Suleiman Yusuf", trade: "Electrician", rating: 4.8, status: "Verified", badge: "Verified" },
    { id: '2', name: "John Okoro", trade: "Plumber", rating: 4.9, status: "Available", badge: "Pro" },
    { id: '3', name: "Tunde Williams", trade: "Electrician", rating: 4.7, status: "Busy", badge: "Verified" }
  ]

  return (
    <section className="bg-bone py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl text-midnight">Featured Plugs in Ikeja</h2>
          <Link href="/find" className="text-gold font-medium hover:underline">Browse all</Link>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {plugs.map((plug) => (
            <Link key={plug.id} href={`/p/${plug.id}`} className="min-w-[280px] bg-white rounded-card shadow-sm p-4 hover:shadow-md transition-shadow border border-transparent hover:border-gold/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate rounded-full overflow-hidden">
                  <div className="w-full h-full bg-midnight/10 flex items-center justify-center text-slate font-bold">
                    {plug.name[0]}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-midnight">{plug.name}</span>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase",
                      plug.badge === "Verified" ? "bg-gold" : "bg-gold text-midnight"
                    )}>
                      {plug.badge}
                    </div>
                  </div>
                  <span className="text-sm text-slate">{plug.trade}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  <span className="text-sm font-bold text-midnight">{plug.rating}</span>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[11px] font-medium",
                  plug.status === "Available" ? "bg-green-100 text-green-700" : 
                  plug.status === "Busy" ? "bg-amber-100 text-amber-700" : "bg-slate/10 text-slate"
                )}>
                  {plug.status}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
