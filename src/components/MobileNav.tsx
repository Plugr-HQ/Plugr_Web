'use client'

import { usePathname } from 'next/navigation'
import { Home, User, Wallet, Bell } from 'lucide-react'
import { cn } from '@/src/lib/utils'

export function MobileNav({ role = 'plug' }: { role?: 'plug' | 'client' }) {
  const pathname = usePathname()
  
  const plugTabs = [
    { icon: Home, label: "Home", href: "/plug/dashboard" },
    { icon: User, label: "Profile", href: "/plug/profile" },
    { icon: Wallet, label: "Wallet", href: "/plug/wallet" },
    { icon: Bell, label: "Alerts", href: "/plug/notifications" }
  ]

  const clientTabs = [
    { icon: Home, label: "Home", href: "/client/home" },
    { icon: Home, label: "My Jobs", href: "/client/jobs" }, // Use appropriate icons for others
    { icon: Bell, label: "Alerts", href: "/client/notifications" },
    { icon: User, label: "Settings", href: "/client/settings" }
  ]

  const tabs = role === 'plug' ? plugTabs : clientTabs

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-bone flex items-center justify-around px-2 z-50 md:hidden">
      {tabs.map((tab, i) => {
        const isActive = pathname === tab.href
        return (
          <a key={i} href={tab.href} className="flex flex-col items-center gap-1 flex-1">
            <tab.icon className={cn("w-6 h-6", isActive ? "text-gold" : "text-slate")} />
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", isActive ? "text-gold" : "text-slate")}>
              {tab.label}
            </span>
          </a>
        )
      })}
    </div>
  )
}
