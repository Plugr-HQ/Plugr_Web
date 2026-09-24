'use client';

// components/pwa/install-debug-panel.tsx
//
// TEMPORARY diagnostic panel — mount it, read it on the phone screen directly
// (no USB/remote debugging needed), then DELETE this file and its mount
// point in layout.tsx once the install bug is found. Not meant to ship.
//
// Shows, live, on-device:
//  - whether the SW registered, and any registration error
//  - manifest.json: fetched OK, parsed OK, and whether it round-trips the
//    fields Chrome's WebAPK minting actually needs (start_url vs scope,
//    icons present)
//  - every icon URL in the manifest, fetched with a cache-buster and
//    checked for a real image content-type (not just a 200 on an HTML
//    error/login page, which is the classic false-positive here)
//  - whether beforeinstallprompt fired this session
//  - whether the browser's own 'appinstalled' event ever fires after you
//    accept the install dialog — if this NEVER appears, the browser itself
//    is telling us the install failed after acceptance, independent of
//    anything else
//  - any window-level error or unhandled promise rejection, with a
//    timestamp, so an error thrown mid-install shows up here instead of
//    vanishing into a console you can't see

import { useEffect, useState } from 'react';

type LogLine = { t: string; msg: string };

type IconCheck = {
  src: string;
  status: 'pending' | 'ok' | 'bad-status' | 'bad-type' | 'error';
  detail: string;
};

export function InstallDebugPanel() {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [swState, setSwState] = useState('checking…');
  const [manifestState, setManifestState] = useState('checking…');
  const [scopeOk, setScopeOk] = useState<string>('checking…');
  const [icons, setIcons] = useState<IconCheck[]>([]);
  const [bip, setBip] = useState('not fired yet');
  const [installed, setInstalled] = useState('not fired yet');

  const log = (msg: string) =>
    setLogs((prev) => [...prev.slice(-19), { t: new Date().toLocaleTimeString(), msg }]);

  useEffect(() => {
    // --- Service worker state ---
    if (!('serviceWorker' in navigator)) {
      setSwState('unsupported in this browser');
    } else {
      navigator.serviceWorker
        .getRegistration('/app/')
        .then((reg) => {
          if (!reg) {
            setSwState('no registration found for scope /app/');
            return;
          }
          const active = reg.active ? 'active' : reg.installing ? 'installing' : reg.waiting ? 'waiting' : 'unknown';
          setSwState(`registered, scope=${reg.scope}, worker=${active}`);
        })
        .catch((err) => setSwState(`getRegistration threw: ${String(err)}`));
    }

    // --- Manifest fetch + parse ---
    fetch('/manifest.json', { cache: 'no-store' })
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok) {
          setManifestState(`fetch failed: HTTP ${res.status}`);
          return;
        }
        if (!contentType.includes('json')) {
          // Classic gotcha: a catch-all route or middleware serving HTML
          // (e.g. a login redirect) on this path with a 200 status.
          setManifestState(`200 OK but content-type is "${contentType}", not JSON — likely not your real manifest`);
          return;
        }
        const json = await res.json().catch(() => null);
        if (!json) {
          setManifestState('200 OK, JSON content-type, but body failed to parse as JSON');
          return;
        }
        setManifestState(`parsed OK — start_url="${json.start_url}", scope="${json.scope}", display="${json.display}"`);

        // start_url must be scope-prefixed per spec.
        const su = String(json.start_url ?? '');
        const sc = String(json.scope ?? '');
        setScopeOk(su.startsWith(sc) ? `OK — "${su}" starts with "${sc}"` : `MISMATCH — "${su}" does not start with "${sc}"`);

        const iconList = Array.isArray(json.icons) ? json.icons : [];
        if (iconList.length === 0) {
          log('manifest has no icons array — installability will fail this check alone');
        }
        setIcons(iconList.map((i: any) => ({ src: i.src, status: 'pending', detail: '' })));

        iconList.forEach((icon: any) => {
          const url = `${icon.src}${icon.src.includes('?') ? '&' : '?'}_dbg=${Date.now()}`;
          fetch(url, { cache: 'no-store' })
            .then((res) => {
              const ct = res.headers.get('content-type') || '';
              if (!res.ok) {
                setIcons((prev) =>
                  prev.map((p) => (p.src === icon.src ? { ...p, status: 'bad-status', detail: `HTTP ${res.status}` } : p))
                );
                return;
              }
              if (!ct.startsWith('image/')) {
                setIcons((prev) =>
                  prev.map((p) => (p.src === icon.src ? { ...p, status: 'bad-type', detail: `content-type="${ct}"` } : p))
                );
                return;
              }
              setIcons((prev) =>
                prev.map((p) => (p.src === icon.src ? { ...p, status: 'ok', detail: `${ct}` } : p))
              );
            })
            .catch((err) => {
              setIcons((prev) =>
                prev.map((p) => (p.src === icon.src ? { ...p, status: 'error', detail: String(err) } : p))
              );
            });
        });
      })
      .catch((err) => setManifestState(`fetch threw: ${String(err)}`));

    // --- Install lifecycle events ---
    const onBip = (e: Event) => {
      log('beforeinstallprompt fired');
      setBip(`fired at ${new Date().toLocaleTimeString()}`);
    };
    const onInstalled = () => {
      log('appinstalled fired — browser confirms install succeeded');
      setInstalled(`fired at ${new Date().toLocaleTimeString()}`);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);

    // --- Catch anything that would otherwise vanish into a console you can't see ---
    const onError = (e: ErrorEvent) => log(`window error: ${e.message}`);
    const onRejection = (e: PromiseRejectionEvent) => log(`unhandled rejection: ${String(e.reason)}`);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    log('debug panel mounted');

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        maxHeight: '60vh',
        overflowY: 'auto',
        background: 'rgba(0,0,0,0.92)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 1.4,
        padding: 8,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      <div style={{ color: '#fff', fontWeight: 'bold' }}>PWA DEBUG PANEL — delete before shipping</div>
      <div>SW: {swState}</div>
      <div>manifest: {manifestState}</div>
      <div>scope/start_url: {scopeOk}</div>
      {icons.map((icon) => (
        <div key={icon.src} style={{ color: icon.status === 'ok' ? '#0f0' : icon.status === 'pending' ? '#999' : '#f55' }}>
          icon [{icon.status}] {icon.src} {icon.detail}
        </div>
      ))}
      <div>beforeinstallprompt: {bip}</div>
      <div>appinstalled: {installed}</div>
      <div style={{ color: '#fff', marginTop: 4 }}>-- log --</div>
      {logs.map((l, i) => (
        <div key={i}>
          [{l.t}] {l.msg}
        </div>
      ))}
    </div>
  );
}