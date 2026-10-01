/**
 * The public-facing handle for a Plug, derived from their uuid: PLG-XXXX-XXXX.
 *
 * Single source of truth on purpose — this string is printed on the downloadable ID card, encoded
 * in the QR, and shown on the public profile. Two implementations that drifted would mean the card
 * in someone's pocket and the page it links to claim different identifiers.
 */
export function plugHandle(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `PLG-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}
