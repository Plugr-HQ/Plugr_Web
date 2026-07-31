'use client'

import { useState } from 'react'
import { Check, MoreVertical, ShieldCheck, AlertCircle } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { AdminShell, type AdminTab } from './_components/AdminShell'
import { DispatchQueue } from './_components/DispatchQueue'
import { JobPipeline } from './_components/JobPipeline'
import { Flags } from './_components/Flags'
import { TableCard, Thead, rowClass, cellClass, Chip, Avatar, PillButton } from './_components/admin-ui'

export default function AdminDashboard() {
  // Dispatch is the primary/default admin view.
  const [activeTab, setActiveTab] = useState<AdminTab>('dispatch')

  return (
    <AdminShell active={activeTab} onNavigate={setActiveTab}>
      {activeTab === 'dispatch' && <DispatchQueue />}
      {activeTab === 'jobs' && <JobPipeline />}
      {activeTab === 'flags' && <Flags />}
      {activeTab === 'plugs' && <PlugsTable />}
      {activeTab === 'verifications' && <PendingVerifications />}
    </AdminShell>
  )
}

// ── Static placeholders (Plugs / Verifications) — restyled to the /app design system.
// Real data wiring for these comes later; the markup already matches the live tables.

function PlugsTable() {
  const plugs = [
    { id: '1', name: 'Suleiman Yusuf', trade: 'Electrician', status: 'Verified', jobs: 24, joined: 'Oct 12, 2023' },
    { id: '2', name: 'John Okoro', trade: 'Plumber', status: 'Available', jobs: 18, joined: 'Oct 15, 2023' },
    { id: '3', name: 'Tunde Williams', trade: 'Electrician', status: 'Busy', jobs: 42, joined: 'Sep 28, 2023' },
  ]

  return (
    <TableCard>
      <Thead cols={[{ label: 'Artisan' }, { label: 'Trade' }, { label: 'Status' }, { label: 'Jobs' }, { label: 'Joined' }, { label: 'Actions', right: true }]} />
      <tbody>
        {plugs.map((plug) => (
          <tr key={plug.id} className={rowClass}>
            <td className={cellClass}>
              <div className="flex items-center gap-3">
                <Avatar name={plug.name} />
                <span className="text-sm font-bold text-midnight">{plug.name}</span>
              </div>
            </td>
            <td className={cn(cellClass, 'text-sm text-slate')}>{plug.trade}</td>
            <td className={cellClass}>
              <Chip tone={plug.status === 'Verified' ? 'green' : plug.status === 'Busy' ? 'amber' : 'gold'}>{plug.status}</Chip>
            </td>
            <td className={cn(cellClass, 'text-sm font-bold text-midnight')}>{plug.jobs}</td>
            <td className={cn(cellClass, 'whitespace-nowrap text-sm text-slate')}>{plug.joined}</td>
            <td className={cn(cellClass, 'text-right')}>
              <button className="rounded-full p-1.5 text-slate transition-colors hover:bg-bone hover:text-midnight">
                <MoreVertical className="h-5 w-5" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </TableCard>
  )
}

function PendingVerifications() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-[22px] border border-amber-500/20 bg-amber-50 p-4 text-amber-800 demo-rise">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500/15">
          <AlertCircle className="h-5 w-5 text-amber-600" />
        </span>
        <div>
          <h4 className="font-bold">4 Pending Reviews</h4>
          <p className="text-sm text-amber-800/80">These artisans have completed their NIN and Liveness check and require manual approval.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className={cn('rounded-[22px] border border-midnight/[0.06] bg-white p-6 demo-card-shadow demo-rise', i === 2 && 'demo-rise-1')}>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name="David Adeosun" tone="midnight" />
                <div>
                  <h4 className="font-bold text-midnight">David Adeosun</h4>
                  <p className="text-xs text-slate">Submitted today at 2:34 PM</p>
                </div>
              </div>
              <Chip tone="neutral">Plumber</Chip>
            </div>

            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between border-b border-midnight/[0.06] py-2 text-xs">
                <span className="text-slate">NIN Status</span>
                <span className="flex items-center gap-1 font-bold text-emerald-600"><Check className="h-3 w-3" /> MATCHED</span>
              </div>
              <div className="flex items-center justify-between border-b border-midnight/[0.06] py-2 text-xs">
                <span className="text-slate">Liveness Score</span>
                <span className="font-bold text-emerald-600">98.4%</span>
              </div>
            </div>

            <div className="flex gap-3">
              <PillButton variant="primary" className="flex-1 py-2.5 text-xs">
                <ShieldCheck className="h-4 w-4" /> Approve
              </PillButton>
              <button className="flex-1 rounded-pill border border-red-500/30 py-2.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
