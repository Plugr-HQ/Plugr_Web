// src/lib/whatsappLink.ts
// The ONE place a "request this Plug" WhatsApp hand-off URL is built.
//
// This was previously inline in RequestPlugButton, which was fine while that button was the only
// hand-off. There are now two entry paths into the same conversation (a browse/listing card, and
// a shared Digital ID link at /p/[id]) plus the return trip after the client intake form, and a
// second copy of this would eventually drift — a different bot number, a different message shape,
// or a Plug ref that doesn't match what ops sees. Both paths call this.
//
// Client-safe: the bot number must be a NEXT_PUBLIC_ var to be readable in the browser.

const WA_BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || '2349119253019';

export type PlugContext = {
  plugId: string;
  plugName?: string | null;
  plugTrade?: string | null;
};

/**
 * The pre-filled opening message. Carries who the client found so the bot conversation starts
 * with context instead of a cold hello, and a short Plug ref ops can match to a real profile.
 *
 * `clientName` is included once the client has been through intake — the bot then opens knowing
 * both sides, which is the whole point of capturing it.
 */
export function requestPlugMessage(plug: PlugContext, clientName?: string | null): string {
  const who = plug.plugName
    ? `${plug.plugName}${plug.plugTrade ? ` (${plug.plugTrade})` : ''}`
    : 'a Plug';

  const opener = clientName?.trim()
    ? `Hi Plugr 👋 It's ${clientName.trim()}. I'd like to request ${who} for a job.`
    : `Hi Plugr 👋 I'd like to request ${who} for a job.`;

  return `${opener}\nPlug ref: ${plug.plugId.slice(-6)}`;
}

/** The full wa.me URL for the hand-off. */
export function requestPlugWhatsAppUrl(plug: PlugContext, clientName?: string | null): string {
  return `https://wa.me/${WA_BOT_NUMBER}?text=${encodeURIComponent(requestPlugMessage(plug, clientName))}`;
}

/**
 * Open the hand-off (WhatsApp app on mobile, web.whatsapp on desktop).
 *
 * Kept here rather than at each call site so every path opens it the same way — including
 * `noopener`, without which the opened tab can reach back into this one via window.opener.
 */
export function openRequestPlugWhatsApp(plug: PlugContext, clientName?: string | null): void {
  window.open(requestPlugWhatsAppUrl(plug, clientName), '_blank', 'noopener,noreferrer');
}
