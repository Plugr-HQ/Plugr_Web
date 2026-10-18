// src/app/opengraph-image.tsx
// The link-preview card for getplugr.com (WhatsApp, X, LinkedIn, iMessage, Slack…). Next's file
// convention serves this at /opengraph-image and writes og:image (+ width/height/alt/type) into
// every page's <head> automatically; twitter-image.tsx re-exports it for twitter:image.
//
// It mirrors the homepage hero (src/app/page.tsx): the same headline, with "who's" in gold, the same
// hero photo, the brand mark, and the brand palette — gold on dark, since a preview sits in a busy
// feed and needs more contrast than the light hero page.
//
// Resilience — a preview must ALWAYS render, so every remote dependency degrades instead of failing:
//   - Fonts: the two Inter files in ./og-fonts are bundled and always loaded. next/og (Satori) throws
//     without at least one embedded font, so this baseline can never be empty.
//   - Headline: Clash Display (the site's display face) is fetched from Fontshare on top of that, with
//     a timeout. If it fails for any reason the headline uses Inter Bold.
//   - Photo: fetched with a timeout and inlined as a data URI. If it fails, the card falls back to a
//     flat Petrol → Pitch Black gradient.
//
// SIZE — kept under ~300 KB on purpose. WhatsApp, Plugr's main channel, is widely reported to skip
// preview images above roughly that, and next/og can only emit PNG, where file size tracks how much
// bright photographic detail is visible. A full-bleed photo came out at 602 KB. So the photo is
// anchored to the right of the card (where its subject sits, clear of the headline), the text side
// is solid Pitch Black, and the photo is dimmed and very slightly blurred — invisible at preview
// size, but it removes the fine grain PNG compresses worst. Result: ~284 KB. Brightening the photo
// or widening it pushes it back over; re-measure (curl -w '%{size_download}') if you change it.
//
// CACHING — the card is the same for everyone, so a complete render is cached at the CDN instead of
// redone (two remote fetches + a render) for every scraper. A DEGRADED render (font or photo didn't
// load) is not cached, so a one-off timeout can't stick for a week.

import { ImageResponse } from 'next/og';

// Edge, not Node: the bundled fonts are read with fetch(new URL('./…', import.meta.url)), which only
// the Edge bundler resolves — Node's fetch() can't read file:// URLs.
export const runtime = 'edge';

export const alt = 'Plugr — Know exactly who’s fixing your home.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const GOLD = '#E8A020';
const PITCH_BLACK = '#0F0A0A';
const PETROL = '#081F20';
const BONE = '#F5F1EC';
const SLATE = '#8E8986';

/** IMG.hero in src/app/page.tsx (Pexels 9242289). 640 px is plenty for the 560 px slot it fills. */
const HERO_PHOTO = 'https://images.pexels.com/photos/9242289/pexels-photo-9242289.jpeg?auto=compress&cs=tinysrgb&w=640';
const CLASH_CSS = 'https://api.fontshare.com/v2/css?f[]=clash-display@700&display=swap';
const REMOTE_TIMEOUT_MS = 4000;

/** The photo covers the right 560 px of the card; see SIZE above. */
const PHOTO_WIDTH = 560;

const CACHE_COMPLETE = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400';
const CACHE_DEGRADED = 'public, max-age=0, must-revalidate';

type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' };

/** PlugrMark from src/components/Brand.tsx — the circle with two prongs. */
const PLUGR_MARK_PATH =
  'M113.333 199.117C108.971 199.699 104.52 200 100 200C95.4795 200 91.029 199.699 86.6666 199.117V166.667C86.6666 155.628 77.7049 146.667 66.6666 146.667C55.6283 146.667 46.6665 155.628 46.6665 166.667V184.586C18.6323 166.862 0 135.59 0 100C0 44.8085 44.8085 0 100 0C155.191 0 200 44.8085 200 100C200 135.59 181.367 166.862 153.333 184.586V166.667C153.333 155.628 144.372 146.667 133.333 146.667C122.295 146.667 113.333 155.628 113.333 166.667V199.117Z';

/** fetch() that gives up after `ms`. Throws on timeout or a non-2xx response. */
async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** ArrayBuffer → base64, in chunks. Not Buffer: it isn't reliably available on the Edge runtime. And
 *  chunked because String.fromCharCode over a whole photo at once overflows the argument limit. */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Satori reads TTF, OTF and WOFF — NOT WOFF2. A WOFF2 font isn't rejected while loading; it makes
 * ImageResponse throw at render time, which would take the whole preview down. So check the file's
 * signature before handing it over: 'wOFF', TrueType (0x00010000 or 'true'), or OpenType ('OTTO').
 */
function isSatoriReadableFont(data: ArrayBuffer): boolean {
  if (data.byteLength < 4) return false;
  const sig = new DataView(data).getUint32(0);
  return sig === 0x774f4646 /* wOFF */ || sig === 0x00010000 || sig === 0x74727565 /* true */ || sig === 0x4f54544f /* OTTO */;
}

/**
 * Clash Display 700 from Fontshare, or null. Fontshare's CSS lists the face as woff2, woff and ttf;
 * take the WOFF (then TTF) URL — never the woff2, see isSatoriReadableFont. Its URLs are
 * protocol-relative ("//cdn.fontshare.com/…"). One timeout covers both requests.
 */
async function loadClashDisplay(): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetchWithTimeout(CLASH_CSS, REMOTE_TIMEOUT_MS)).text();
    const urlFor = (format: string) => css.match(new RegExp(`url\\(['"]?([^'")]+)['"]?\\)\\s*format\\(['"]${format}['"]\\)`))?.[1];
    const src = urlFor('woff') ?? urlFor('truetype');
    if (!src) return null;
    const font = await (await fetchWithTimeout(src.startsWith('//') ? `https:${src}` : src, REMOTE_TIMEOUT_MS)).arrayBuffer();
    return isSatoriReadableFont(font) ? font : null;
  } catch {
    return null;
  }
}

/** The hero photo as a data URI, or null. */
async function loadHeroPhoto(): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(HERO_PHOTO, REMOTE_TIMEOUT_MS);
    const type = res.headers.get('content-type') ?? 'image/jpeg';
    if (!/^image\/(jpeg|png)/.test(type)) return null; // Satori renders JPEG and PNG
    return `data:${type.split(';')[0]};base64,${arrayBufferToBase64(await res.arrayBuffer())}`;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const [interRegular, interBold, clash, photo] = await Promise.all([
    fetch(new URL('./og-fonts/Inter-Regular.woff', import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL('./og-fonts/Inter-Bold.woff', import.meta.url)).then((r) => r.arrayBuffer()),
    loadClashDisplay(),
    loadHeroPhoto(),
  ]);

  const headlineFont = clash ? 'Clash Display' : 'Inter';
  const bodyFont = 'Inter';

  const fonts: OgFont[] = [
    { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
    { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
  ];
  if (clash) fonts.push({ name: 'Clash Display', data: clash, weight: 700, style: 'normal' });

  // Words as separate items so "who's" can be gold and the line still wraps naturally.
  const headline: Array<{ text: string; gold?: boolean }> = [
    { text: 'Know' },
    { text: 'exactly' },
    { text: 'who’s', gold: true },
    { text: 'fixing' },
    { text: 'your' },
    { text: 'home.' },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: PITCH_BLACK,
          // Only when there's no photo — never an undefined value (Satori throws on those).
          ...(photo ? {} : { backgroundImage: `linear-gradient(135deg, ${PETROL} 0%, ${PITCH_BLACK} 100%)` }),
        }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>, not next/image
          <img
            src={photo}
            alt=""
            width={PHOTO_WIDTH}
            height={size.height}
            style={{ position: 'absolute', top: 0, right: 0, width: PHOTO_WIDTH, height: size.height, objectFit: 'cover', filter: 'blur(3px)' }}
          />
        ) : null}
        {photo ? (
          // Solid Pitch Black up to where the photo starts, then easing off across it, so the edge of
          // the photo never shows and the headline always sits on flat dark ground.
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: size.width,
              height: size.height,
              display: 'flex',
              backgroundImage:
                `linear-gradient(90deg, ${PITCH_BLACK} 0%, ${PITCH_BLACK} 53%, rgba(15,10,10,0.74) 71%, rgba(15,10,10,0.52) 100%)`,
            }}
          />
        ) : null}

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: '64px 72px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="56" height="56" viewBox="0 0 200 200" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d={PLUGR_MARK_PATH} fill={GOLD} />
            </svg>
            <div style={{ display: 'flex', marginLeft: 18, fontFamily: bodyFont, fontWeight: 700, fontSize: 34, color: BONE, letterSpacing: '-0.02em' }}>
              Plugr
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', maxWidth: 760 }}>
            {headline.map((w) => (
              <span
                key={w.text}
                style={{
                  fontFamily: headlineFont,
                  fontWeight: 700,
                  fontSize: 84,
                  lineHeight: 1.02,
                  letterSpacing: '-0.03em',
                  color: w.gold ? GOLD : BONE,
                  marginRight: 22,
                }}
              >
                {w.text}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', fontFamily: bodyFont, fontWeight: 400, fontSize: 24, color: SLATE, letterSpacing: '0.01em' }}>
            getplugr.com
          </div>
        </div>
      </div>
    ),
    { ...size, fonts, headers: { 'Cache-Control': clash && photo ? CACHE_COMPLETE : CACHE_DEGRADED } },
  );
}
