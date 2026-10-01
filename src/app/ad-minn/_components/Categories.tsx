// src/app/ad-minn/_components/Categories.tsx
// Categories — create a trade and list every Category with how many Plugs sit under it.
// Same fetch/table/filter chrome as JobPipeline and Flags.
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Tags } from 'lucide-react';
import { authHeaders } from '@/src/lib/api';
import { apiFetch } from '@/src/lib/api-client';
import { cn } from '@/src/lib/utils';
import {
  TableCard, Thead, rowClass, cellClass, Chip, FilterBar, RefreshButton,
  FieldLabel, Toast, StateRow, PillButton,
} from './admin-ui';

const LOGIN_PATH = '/ad-minn/login';

type CategoryRow = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  keywords: string[];
  plugCount: number;
  createdAt: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

const inputClass =
  'w-full rounded-2xl border border-pitch-black/10 bg-white px-4 py-2.5 text-sm text-pitch-black placeholder:text-slate/50 focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/10';

export function Categories() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const adminFetch = useCallback(
    async (input: string, init?: RequestInit): Promise<any> => {
      return apiFetch(
        input,
        {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
            ...(init?.headers || {}),
          },
        },
        { redirectTo: LOGIN_PATH },
      );
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch('/api/admin/categories');
      setRows(Array.isArray(data?.categories) ? data.categories : []);
    } catch (e: any) {
      if (e?.message === 'Session expired') return;
      setError(e?.message || 'Could not load categories.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError(null);
    const keywords = keywordsText
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    try {
      await adminFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          description: description.trim() || undefined,
          keywords,
        }),
      });
      setName('');
      setCode('');
      setDescription('');
      setKeywordsText('');
      setToast('Category created. The WhatsApp bot will detect it from the keywords you entered.');
      setTimeout(() => setToast(null), 4000);
      await load();
    } catch (err: any) {
      if (err?.message !== 'Session expired') setFormError(err?.message || 'Could not create category.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast && <Toast>{toast}</Toast>}

      <form onSubmit={onCreate} className="space-y-4 rounded-[22px] border border-pitch-black/[0.06] bg-white p-6 card-shadow">
        <div>
          <h2 className="font-display text-lg text-pitch-black">New category</h2>
          <p className="mt-1 text-sm text-slate">
            Code is what the bot and jobs use (e.g. <span className="font-semibold text-pitch-black">painter</span>).
            Keywords are whole words the WhatsApp client must type for this trade to be detected — no redeploy needed.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="cat-name">Name</FieldLabel>
            <input id="cat-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Painter" required />
          </div>
          <div>
            <FieldLabel htmlFor="cat-code">Code</FieldLabel>
            <input id="cat-code" className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder="painter" required />
          </div>
          <div className="md:col-span-2">
            <FieldLabel htmlFor="cat-desc">Description</FieldLabel>
            <input id="cat-desc" className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Residential painting and finishing" />
          </div>
          <div className="md:col-span-2">
            <FieldLabel htmlFor="cat-keywords" hint="comma-separated">Keywords</FieldLabel>
            <input
              id="cat-keywords"
              className={inputClass}
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="paint, painter, painters, painting"
            />
          </div>
        </div>

        {formError && (
          <div className="rounded-[18px] border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {formError}
          </div>
        )}

        <PillButton type="submit" variant="gold" loading={saving} disabled={!name.trim() || !code.trim()}>
          Create category
        </PillButton>
      </form>

      <FilterBar>
        <div className="text-xs font-semibold text-slate">{rows.length} categor{rows.length === 1 ? 'y' : 'ies'}</div>
        <RefreshButton loading={loading} onClick={() => void load()} />
      </FilterBar>

      {error && (
        <div className="rounded-[18px] border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <TableCard>
        <Thead
          cols={[
            { label: 'Category' },
            { label: 'Code' },
            { label: 'Plugs' },
            { label: 'Keywords' },
            { label: 'Created' },
          ]}
        />
        <tbody>
          {loading && rows.length === 0 ? (
            <StateRow colSpan={5} variant="loading" title="Fetching categories…" />
          ) : rows.length === 0 ? (
            <StateRow
              colSpan={5}
              variant="empty"
              icon={<Tags className="h-5 w-5" />}
              title="No categories yet"
              body="Create the first trade above. The bot will pick it up from its keywords."
            />
          ) : (
            rows.map((cat) => (
              <tr key={cat.id} className={rowClass}>
                <td className={cellClass}>
                  <span className="block text-sm font-bold text-pitch-black">{cat.name}</span>
                  {cat.description && <span className="text-xs text-slate">{cat.description}</span>}
                </td>
                <td className={cellClass}>
                  <Chip tone="neutral">{cat.code}</Chip>
                </td>
                <td className={cn(cellClass, 'text-sm font-bold text-pitch-black')}>{cat.plugCount}</td>
                <td className={cn(cellClass, 'max-w-xs text-xs text-slate')}>
                  {cat.keywords?.length ? cat.keywords.join(', ') : '—'}
                </td>
                <td className={cn(cellClass, 'whitespace-nowrap text-sm text-slate')}>{formatDate(cat.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </TableCard>

      {loading && rows.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-slate">
          <Loader2 className="h-4 w-4 animate-spin text-gold" /> Refreshing…
        </div>
      )}
    </div>
  );
}
