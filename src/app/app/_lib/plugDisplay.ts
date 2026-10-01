// src/app/app/_lib/plugDisplay.ts
// How a Plug is described on screen, using ONLY what is actually known about them.
//
// This replaces _lib/profile.ts (buildProfile), which manufactured a whole persona from nothing
// but the trade code: a "Licensed Electrician" headline for someone whose licence was never
// checked, a written-out career history, a skills list, three testimonials from invented clients,
// and constants for "avg response 12m" and "98% on time" that no job data anywhere supports.
// Every Plug of a given trade got the identical fabricated set, presented as fact about them.
//
// The rule here: if it can't be computed from real data, it does not get displayed. A new Plug
// looks new — which is honest, and is the same treatment already used for ratings.

export type PlugLike = {
  name?: string | null;
  trade?: string | null;
  trade_label?: string | null;
  verified?: boolean;
  rating?: number | string | null;
  jobs_completed?: number | string | null;
};

/** "Electrician" — the trade, plainly. Never a credential claim. */
export function tradeLabel(plug: PlugLike): string {
  if (plug.trade_label) return plug.trade_label;
  const t = plug.trade;
  if (!t) return 'Artisan';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * The one verification sentence used across every surface. Matches the public Digital ID
 * (/p/[id]) word for word, so a client sees the same claim wherever they meet this Plug.
 * Returns null when the Plug is NOT verified — the caller renders nothing, never a hedge.
 */
export function verificationLabel(plug: PlugLike): string | null {
  return plug.verified ? 'Identity Verified via NIN' : null;
}

/** True once there is enough real history for a rating to mean anything. */
export function hasRating(plug: PlugLike): boolean {
  return Number(plug.jobs_completed ?? 0) > 0 && Number(plug.rating ?? 0) > 0;
}

/**
 * What to show where a rating would go.
 *
 * "New to Plugr" rather than "0.0": a zero reads as a bad score earned, when in fact nothing has
 * been scored yet. Same reasoning that kept the ratings panel off the public profile entirely.
 */
export function ratingDisplay(plug: PlugLike): { kind: 'rating'; value: string } | { kind: 'new'; value: string } {
  return hasRating(plug)
    ? { kind: 'rating', value: Number(plug.rating).toFixed(1) }
    : { kind: 'new', value: 'New to Plugr' };
}
