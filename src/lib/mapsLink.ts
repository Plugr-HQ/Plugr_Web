// src/lib/mapsLink.ts
// The ONE place a "get directions" URL is built, matching the pattern in whatsappLink.ts.
//
// Uses Google's universal Maps URL scheme: no API key, no SDK, and the OS handles it — on Android
// and iOS the link hands off to the native maps app, on desktop it opens Google Maps in the
// browser.
//
// WHY THE FREE-TEXT ADDRESS AND NOT THE COORDINATES:
// Job rows carry required `latitude`/`longitude` and an optional `address`, so coordinates look
// like the more precise choice. They are not. Client intake captures the address as free text and
// never geocodes it, and the WhatsApp booking path falls back to `user.latitude || 6.5244` /
// `user.longitude || 3.3792` — the centre of Lagos — whenever the client has no stored position.
// Every job in the database today carries exactly those defaults. Navigating by coordinates would
// therefore send every Plug to the same point in central Lagos with total confidence, which is far
// worse than not offering directions at all. The typed address is the only field that actually
// describes where the client is.
//
// If coordinates ever become real (geocode at intake, or capture a pin in the bot flow), prefer
// them here — `destination` accepts "lat,lng" — and keep the address as the fallback.

/**
 * Placeholder the WhatsApp booking flow writes when a client has no address on file
 * (booking-dispatch.service.ts). It is not a location and must never reach a maps query.
 */
const PLACEHOLDER_ADDRESSES = ['standard registered zone'];

/** Anything shorter than this is not a findable destination ("N/A", "-", "home"). */
const MIN_USABLE_LENGTH = 3;

/**
 * Whether this address is something a maps app could actually search for.
 * Deliberately strict: a wrong destination given confidently is worse than a disabled button.
 */
export function isUsableAddress(address?: string | null): boolean {
  const trimmed = (address ?? '').trim();
  if (trimmed.length < MIN_USABLE_LENGTH) return false;
  if (PLACEHOLDER_ADDRESSES.includes(trimmed.toLowerCase())) return false;
  return true;
}

/**
 * Google Maps directions URL for a destination, or null when the address can't be trusted.
 * Returning null rather than a best-guess URL is the point — callers disable the control.
 */
export function directionsUrl(address?: string | null): string | null {
  if (!isUsableAddress(address)) return null;
  const destination = encodeURIComponent((address as string).trim());
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

/**
 * Open directions in a new tab / hand off to the native maps app.
 * `noopener` matters: without it the opened tab can reach back into this one via window.opener.
 */
export function openDirections(address?: string | null): void {
  const url = directionsUrl(address);
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}
