'use client'

import { useCallback, useEffect, useState } from 'react'
import { MoreVertical, ShieldCheck, AlertCircle, Loader2, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { apiFetch } from '@/src/lib/api-client'
import { AdminShell, type AdminTab } from './_components/AdminShell'
import { DispatchQueue } from './_components/DispatchQueue'
import { JobPipeline } from './_components/JobPipeline'
import { Flags } from './_components/Flags'
import { TableCard, Thead, rowClass, cellClass, Chip, Avatar, PillButton } from './_components/admin-ui'

type PendingPlug = {
  id: string
  name: string
  trade: string | null
  photo_url: string | null
  created_at: string
}

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

// ── PlugsTable is still a static placeholder (a full "all plugs" admin list is a follow-up);
// Verifications below is wired to real pending plugs.

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
  const [plugs, setPlugs] = useState<PendingPlug[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await apiFetch('/api/admin/verifications', {}, { redirectTo: '/ad-minn/login' })
      setPlugs(Array.isArray(data?.plugs) ? data.plugs : [])
    } catch (e: any) {
      if (e?.message === 'Session expired') return
      setError(e?.message ?? 'Could not load the verification queue.')
      setPlugs([])
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function decide(id: string, verified: boolean) {
    if (acting) return
    setActing(id)
    setError(null)
    try {
      await apiFetch(`/api/admin/plugs/${id}/verification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified }),
      }, { redirectTo: '/ad-minn/login' })
      // Approve flips the plug to verified + ACTIVE (bookable); either way it leaves the queue.
      setPlugs((cur) => (cur ?? []).filter((p) => p.id !== id))
    } catch (e: any) {
      if (e?.message !== 'Session expired') setError(e?.message ?? 'Action failed. Try again.')
    } finally {
      setActing(null)
    }
  }

  if (plugs === null) {
    return (
      <div className="flex items-center gap-2 py-16 justify-center text-sm text-slate">
        <Loader2 className="h-5 w-5 animate-spin text-gold" /> Loading verification queue…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-[22px] border border-amber-500/20 bg-amber-50 p-4 text-amber-800 rise">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500/15">
          <AlertCircle className="h-5 w-5 text-amber-600" />
        </span>
        <div>
          <h4 className="font-bold">{plugs.length} Pending Review{plugs.length === 1 ? '' : 's'}</h4>
          <p className="text-sm text-amber-800/80">
            Artisans awaiting manual approval. Approving makes a plug verified and bookable. (Automated
            NIN/liveness checks aren’t wired yet — review identity out-of-band before approving.)
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-[18px] border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {plugs.length === 0 ? (
        <div className="rounded-[22px] border border-midnight/6 bg-white p-10 text-center card-shadow">
          <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
          <h4 className="font-bold text-midnight">Queue clear</h4>
          <p className="mt-1 text-sm text-slate">No plugs are waiting for verification right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {plugs.map((plug, i) => (
            <div key={plug.id} className={cn('rounded-[22px] border border-midnight/6 bg-white p-6 card-shadow rise', i === 1 && 'rise-1')}>
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={plug.name} tone="midnight" />
                  <div>
                    <h4 className="font-bold text-midnight">{plug.name || 'Unnamed plug'}</h4>
                    <p className="text-xs text-slate">Joined {new Date(plug.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <Chip tone="neutral">{plug.trade ? plug.trade[0].toUpperCase() + plug.trade.slice(1) : '—'}</Chip>
              </div>

              <div className="flex gap-3">
                <PillButton
                  variant="primary"
                  className="flex-1 py-2.5 text-xs"
                  disabled={acting === plug.id}
                  onClick={() => decide(plug.id, true)}
                >
                  {acting === plug.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Approve
                </PillButton>
                <button
                  disabled={acting === plug.id}
                  onClick={() => decide(plug.id, false)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-red-500/30 py-2.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
