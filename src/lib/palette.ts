// src/lib/palette.ts
// The dark brand anchors for the places CSS custom properties can't reach — canvas
// fills, QR foregrounds, anything drawn imperatively. Mirrors the @theme tokens in
// src/app/globals.css; change a value there and here together, nowhere else.

/** Primary dark anchor. Mirrors --color-pitch-black. */
export const PITCH_BLACK = '#0F0A0A';

/** Secondary dark anchor (elevated surfaces on the dark canvas). Mirrors --color-petrol. */
export const PETROL = '#081F20';
