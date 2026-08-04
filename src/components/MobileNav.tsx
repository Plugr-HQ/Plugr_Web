'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, User, Wallet, Bell, Settings } from 'lucide-react'
import { cn } from '@/src/lib/utils'

export function MobileNav({ role = 'plug' }: { role?: 'plug' | 'client' }) {
  const pathname = usePathname()
  
  const plugTabs = [
    { icon: Home, label: "Home", href: "/app/plug" },
    { icon: User, label: "Profile", href: "/app/plug/profile" },
    { icon: Wallet, label: "Wallet", href: "/app/plug/wallet" },
    { icon: Settings, label: "Settings", href: "/app/plug/settings" },
    { icon: Bell, label: "Alerts", href: "/app/plug/notifications" }
  ]

  const clientTabs = [
    { icon: Home, label: "Home", href: "/find" },
    { icon: Home, label: "My Jobs", href: "/app/client/jobs" },
    { icon: Bell, label: "Alerts", href: "/app/client/notifications" },
    { icon: User, label: "Settings", href: "/app/client/settings" }
  ]

  const tabs = role === 'plug' ? plugTabs : clientTabs

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-bone flex items-center justify-around px-2 z-50 md:hidden">
      {tabs.map((tab, i) => {
        const isActive = pathname === tab.href
        return (
          <Link key={i} href={tab.href} className="flex flex-col items-center gap-1 flex-1">
            <tab.icon className={cn("w-6 h-6", isActive ? "text-gold" : "text-slate")} />
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", isActive ? "text-gold" : "text-slate")}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
