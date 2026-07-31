'use client'

import Image from 'next/image'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  Search,
  Check,
  X,
  MoreVertical,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeft,
  Flag,
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { DispatchQueue } from './_components/DispatchQueue'
import { JobPipeline } from './_components/JobPipeline'
import { Flags } from './_components/Flags'

const SIDEBAR_PIN_KEY = 'plugr-admin-sidebar-pinned'

export default function AdminDashboard() {
  // Dispatch is the primary/default admin view; the other tabs are Ramon's existing screens.
  const [activeTab, setActiveTab] = useState<'dispatch' | 'plugs' | 'jobs' | 'verifications' | 'flags'>('dispatch')
  const [isPinned, setIsPinned] = useState(false);

  // Hydrate pin state from localStorage on mount (client-only, avoids SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_PIN_KEY)
    if (stored !== null) {
      setIsPinned(stored === 'true')
    }
  }, [])

  const togglePinned = () => {
    setIsPinned((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_PIN_KEY, String(next))
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-bone">
      {/* Sidebar */}
      <aside
      className={cn(
        "group fixed left-0 top-0 bottom-0 z-50 bg-midnight text-white transition-all duration-300 ease-in-out flex flex-col shadow-xl",
        isPinned ? "w-64" : "w-16 hover:w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between min-h-18.25">
        <div className={cn("flex items-center shrink-0 overflow-hidden", isPinned ? "gap-3" : "gap-0 group-hover:gap-3")}>
          <div className="shrink-0">
            <Image src="/plugr.svg" alt="Plugr Logo" width={32} height={32} />
          </div>
          <span
            className={cn(
              "text-2xl font-black tracking-tighter text-white whitespace-nowrap overflow-hidden transition-all duration-200",
              isPinned ? "opacity-100 w-auto" : "opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto"
            )}
          >
            plugr
          </span>
        </div>

        <button
          onClick={togglePinned}
          className={cn(
            "rounded-lg text-steel-blue hover:text-white hover:bg-white/10 transition-all duration-200 overflow-hidden shrink-0",
            isPinned ? "opacity-100 w-auto p-1.5" : "opacity-0 w-0 p-0 group-hover:opacity-100 group-hover:w-auto group-hover:p-1.5"
          )}
          title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
        >
          {isPinned ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="grow p-3 space-y-2 overflow-x-hidden">
        <button
          onClick={() => setActiveTab('dispatch')}
          className={cn(
            "w-full flex items-center px-3.5 py-3 rounded-card text-sm font-bold transition-colors whitespace-nowrap",
            isPinned ? "gap-3 justify-start" : "gap-0 justify-center group-hover:gap-3 group-hover:justify-start",
            activeTab === 'dispatch' ? "bg-gold text-midnight" : "text-steel-blue hover:bg-white/5"
          )}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span
            className={cn(
              "overflow-hidden transition-all duration-200",
              isPinned ? "opacity-100 w-auto" : "opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto"
            )}
          >
            Dispatch
          </span>
        </button>

        <button
          onClick={() => setActiveTab('plugs')}
          className={cn(
            "w-full flex items-center px-3.5 py-3 rounded-card text-sm font-bold transition-colors whitespace-nowrap",
            isPinned ? "gap-3 justify-start" : "gap-0 justify-center group-hover:gap-3 group-hover:justify-start",
            activeTab === 'plugs' ? "bg-gold text-midnight" : "text-steel-blue hover:bg-white/5"
          )}
        >
          <Users className="w-5 h-5 shrink-0" />
          <span
            className={cn(
              "overflow-hidden transition-all duration-200",
              isPinned ? "opacity-100 w-auto" : "opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto"
            )}
          >
            Manage Plugs
          </span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={cn(
            "w-full flex items-center px-3.5 py-3 rounded-card text-sm font-bold transition-colors whitespace-nowrap",
            isPinned ? "gap-3 justify-start" : "gap-0 justify-center group-hover:gap-3 group-hover:justify-start",
            activeTab === 'jobs' ? "bg-gold text-midnight" : "text-steel-blue hover:bg-white/5"
          )}
        >
          <Briefcase className="w-5 h-5 shrink-0" />
          <span
            className={cn(
              "overflow-hidden transition-all duration-200",
              isPinned ? "opacity-100 w-auto" : "opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto"
            )}
          >
            Job Pipeline
          </span>
        </button>

        <button
          onClick={() => setActiveTab('flags')}
          className={cn(
            "w-full flex items-center px-3.5 py-3 rounded-card text-sm font-bold transition-colors whitespace-nowrap",
            isPinned ? "gap-3 justify-start" : "gap-0 justify-center group-hover:gap-3 group-hover:justify-start",
            activeTab === 'flags' ? "bg-gold text-midnight" : "text-steel-blue hover:bg-white/5"
          )}
        >
          <Flag className="w-5 h-5 shrink-0" />
          <span
            className={cn(
              "overflow-hidden transition-all duration-200",
              isPinned ? "opacity-100 w-auto" : "opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto"
            )}
          >
            Flags
          </span>
        </button>

        <button
          onClick={() => setActiveTab('verifications')}
          className={cn(
            "w-full flex items-center px-3.5 py-3 rounded-card text-sm font-bold transition-colors whitespace-nowrap",
            isPinned ? "gap-3 justify-start" : "gap-0 justify-center group-hover:gap-3 group-hover:justify-start",
            activeTab === 'verifications' ? "bg-gold text-midnight" : "text-steel-blue hover:bg-white/5"
          )}
        >
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span
            className={cn(
              "overflow-hidden transition-all duration-200",
              isPinned ? "opacity-100 w-auto" : "opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto"
            )}
          >
            Verifications
          </span>
        </button>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 text-xs text-steel-blue whitespace-nowrap overflow-hidden">
        <span
          className={cn(
            "transition-opacity duration-200",
            isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          Plugr Admin v1.0.0
        </span>
      </div>
    </aside>

      {/* Main Content */}
      <main
        className={cn(
          "grow flex flex-col transition-all duration-300 ease-in-out",
          isPinned ? "ml-64" : "ml-16"
        )}
      >
        <header className="bg-white h-16 border-b border-bone flex items-center justify-between px-8">
          <h1 className="font-display text-xl text-midnight capitalize">{activeTab} Management</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-bone rounded-pill py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-gold w-64"
              />
            </div>
            <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center font-bold text-midnight text-xs">
              AD
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dispatch' && <DispatchQueue />}
          {activeTab === 'plugs' && <PlugsTable />}
          {activeTab === 'verifications' && <PendingVerifications />}
          {activeTab === 'jobs' && <JobPipeline />}
          {activeTab === 'flags' && <Flags />}
        </div>
      </main>
    </div>
  )
}

function PlugsTable() {
  const plugs = [
    { id: '1', name: "Suleiman Yusuf", trade: "Electrician", status: "Verified", jobs: 24, joined: "Oct 12, 2023" },
    { id: '2', name: "John Okoro", trade: "Plumber", status: "Available", jobs: 18, joined: "Oct 15, 2023" },
    { id: '3', name: "Tunde Williams", trade: "Electrician", status: "Busy", jobs: 42, joined: "Sep 28, 2023" },
  ]

  return (
    <div className="bg-white rounded-card shadow-sm border border-bone overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-bone/50 text-slate text-xs font-bold uppercase tracking-wider">
          <tr>
            <th className="px-6 py-4">Artisan</th>
            <th className="px-6 py-4">Trade</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Jobs</th>
            <th className="px-6 py-4">Joined</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-bone">
          {plugs.map((plug) => (
            <tr key={plug.id} className="hover:bg-bone/20 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-bone rounded-full flex items-center justify-center font-bold text-midnight text-xs">
                    {plug.name[0]}
                  </div>
                  <span className="font-bold text-midnight text-sm">{plug.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate">{plug.trade}</td>
              <td className="px-6 py-4">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  plug.status === 'Verified' ? "bg-green-100 text-green-700" : "bg-gold/10 text-gold"
                )}>
                  {plug.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-midnight font-bold">{plug.jobs}</td>
              <td className="px-6 py-4 text-sm text-slate">{plug.joined}</td>
              <td className="px-6 py-4 text-right">
                <button className="text-slate hover:text-midnight">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PendingVerifications() {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-card p-4 flex gap-4 text-amber-800">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <div>
          <h4 className="font-bold">4 Pending Reviews</h4>
          <p className="text-sm">These artisans have completed their NIN and Liveness check and require manual approval.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-card p-6 border border-bone shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-bone rounded-full flex items-center justify-center font-bold text-midnight">DA</div>
                <div>
                  <h4 className="font-bold text-midnight">David Adeosun</h4>
                  <p className="text-xs text-slate">Submitted today at 2:34 PM</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-bone px-2 py-1 rounded-full text-slate">PLUMBER</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-xs py-2 border-b border-bone">
                <span className="text-slate">NIN Status</span>
                <span className="text-green-600 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> MATCHED</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-bone">
                <span className="text-slate">Liveness Score</span>
                <span className="text-green-600 font-bold">98.4%</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-midnight text-white py-2 rounded-pill text-xs font-bold hover:bg-midnight/90">Approve</button>
              <button className="flex-1 border border-red-200 text-red-600 py-2 rounded-pill text-xs font-bold hover:bg-red-50">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
