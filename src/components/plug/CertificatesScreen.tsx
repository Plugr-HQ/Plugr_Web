// src/components/plug/CertificatesScreen.tsx
// Verification Hub item: Certificates. OPTIONAL — it never counts toward the five required items,
// and a Plug who has no certificates is finished with this item by doing nothing. The copy says so
// outright, so "not started" doesn't read as a chore left undone.
//
// Files go to the backend, which holds the storage credentials; the browser only ever sees a
// short-lived signed URL when opening one.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileBadge, Loader2, Plus, Trash2 } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { apiFetch } from '@/src/lib/api-client';
import { getPlugId } from '@/src/app/app/_lib/plugAuth';
import { loadVerificationSnapshot, type CertificateFile } from '@/src/app/app/_lib/verificationItems';

const HUB = '/app/plug/verification';
const UPLOAD_URL = '/api/plug/verification/certificates';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ['application/pdf', 'image/jpeg'];

function sizeLabel(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

export function CertificatesScreen() {
  const [files, setFiles] = useState<CertificateFile[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const snap = await loadVerificationSnapshot(getPlugId() ?? '');
    setFiles(snap.items?.certificates.files ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(file: File) {
    setError(null);

    // Checked here as well as on the server: rejecting a 40MB file before uploading it over mobile
    // data is the difference between an instant "no" and a minute of wasted bandwidth.
    if (!ACCEPTED.includes(file.type)) {
      setError('Certificates have to be a PDF or a JPG. That file is neither.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`That file is ${sizeLabel(file.size)}. The limit is 10MB — try a smaller scan.`);
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      await apiFetch(UPLOAD_URL, { method: 'POST', body }, { redirectTo: '/app/auth/login' });
      await load();
    } catch (e: any) {
      setError(e?.message || 'We couldn’t upload that file. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`${UPLOAD_URL}/${id}`, { method: 'DELETE' }, { redirectTo: '/app/auth/login' });
      await load();
    } catch (e: any) {
      setError(e?.message || 'We couldn’t remove that file.');
    } finally {
      setBusy(false);
    }
  }

  async function open(id: string) {
    try {
      const res: any = await apiFetch(`${UPLOAD_URL}/${id}/url`, {}, { redirectTo: '/app/auth/login' });
      if (res?.url) window.open(res.url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('We couldn’t open that file.');
    }
  }

  return (
    <Shell
      eyebrow="Verification"
      title="Certificates"
      subtitle="Optional — only if you have them."
      back={HUB}
    >
      <div className="rise rounded-[18px] border border-pitch-black/[0.08] bg-white p-4">
        <p className="text-[13px] leading-relaxed text-slate">
          Trade certificates, training certificates, anything that shows what you’ve been taught. This item is{' '}
          <span className="font-bold text-pitch-black">optional</span>: skipping it doesn’t hold up your verification,
          and it never counts against your five required items.
        </p>
      </div>

      {files === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gold" aria-label="Loading" />
        </div>
      ) : (
        <>
          {files.length > 0 && (
            <ul className="rise rise-1 mt-4 space-y-2.5">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-3 rounded-[18px] border border-pitch-black/[0.08] bg-white p-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-700">
                    <FileBadge className="h-5 w-5" />
                  </span>
                  <button onClick={() => open(f.id)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-[14px] font-bold text-pitch-black">{f.fileName}</p>
                    <p className="mt-0.5 text-[12px] text-slate">{sizeLabel(f.sizeBytes)} · tap to open</p>
                  </button>
                  <button
                    onClick={() => remove(f.id)}
                    disabled={busy}
                    aria-label={`Remove ${f.fileName}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate hover:bg-pitch-black/[0.04] hover:text-pitch-black disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="mt-4 text-[13px] font-bold text-red-600" role="alert">
              {error}
            </p>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = ''; // so picking the same file twice still fires
              if (file) upload(file);
            }}
          />

          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rise rise-2 mt-4 flex w-full items-center justify-center gap-2 rounded-pill border border-dashed border-pitch-black/25 bg-white px-5 py-3.5 text-[15px] font-bold text-pitch-black transition-colors hover:border-gold disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {files.length > 0 ? 'Add another certificate' : 'Add a certificate'}
          </button>
          <p className="mt-2 text-center text-[12px] text-slate">PDF or JPG, up to 10MB each.</p>
        </>
      )}
    </Shell>
  );
}
