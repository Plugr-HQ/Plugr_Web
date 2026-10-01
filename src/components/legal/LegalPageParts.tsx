import type { ReactNode } from 'react';

export function Section({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section className="mb-12 border-t border-pitch-black/8 pt-8">
      <div className="flex items-baseline gap-3 mb-5">
        <span className="font-display text-lg text-gold tnum">{number.padStart(2, '0')}</span>
        <h2 className="font-display text-[1.6rem] leading-tight text-pitch-black">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-gold/[0.08] border border-gold/20 p-4 mt-4">
      <p className="text-sm font-medium leading-relaxed text-pitch-black">{children}</p>
    </div>
  );
}

/** Numbered checkbox row for the Consent page — not present on Privacy/Terms/Dispute pages. */
export function ConsentItem({
  id,
  label,
  required,
  checked,
  onChange,
}: {
  id: string;
  label: ReactNode;
  required: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 rounded-2xl border border-pitch-black/10 bg-white p-4 cursor-pointer hover:border-gold/40 transition-colors"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-pitch-black/30 text-gold focus:ring-gold"
      />
      <span className="text-sm leading-relaxed text-slate">
        {label}
        {required ? (
          <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-gold">Required</span>
        ) : (
          <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-slate/60">Optional</span>
        )}
      </span>
    </label>
  );
}

/** Shared legal-page header block (eyebrow + title + version line). */
export function LegalHeader({
  eyebrow,
  title,
  highlight,
  version,
}: {
  eyebrow: string;
  title: string;
  highlight: string;
  version: string;
}) {
  return (
    <header className="pt-28 md:pt-36 pb-14 px-5 border-b border-pitch-black/[0.06]">
      <div className="max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
          <span className="h-px w-6 bg-gold/50" /> {eyebrow}
        </span>
        <h1 className="mt-4 font-display text-[2.75rem] md:text-[3.5rem] leading-[1.02] text-pitch-black">
          {title} <span className="text-gold">{highlight}</span>
        </h1>
        <p className="mt-4 text-sm text-slate">{version}</p>
      </div>
    </header>
  );
}