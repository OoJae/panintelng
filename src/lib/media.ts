import manifest from '../../public/media/manifest.json'

type Entry = { alt: string; note: string; credit: string; source: string; license: string; v?: string }
const IMAGES = manifest.images as Record<string, Entry | undefined>

/** Widths emitted by scripts/encode-media.mjs. */
const WIDTHS = [800, 1200, 1600] as const

type Opts = {
  /** Describe the picture when it carries meaning; omit for decorative use. */
  alt?: string
  sizes?: string
  /** Above-the-fold images must not be lazy — it delays the LCP. */
  eager?: boolean
}

/**
 * Media filenames are stable, so a replaced photograph would otherwise keep its
 * URL and stay hidden behind a week of browser cache. The content hash from the
 * manifest makes a changed image a changed URL.
 */
const ver = (key: string) => (IMAGES[key]?.v ? `?v=${IMAGES[key]!.v}` : '')

const srcset = (key: string, ext: string) =>
  WIDTHS.map((w) => `/media/${key}-${w}.${ext}${ver(key)} ${w}w`).join(', ')

/**
 * Placeholder photography, art-directed to a fixed frame.
 *
 * Emitted as <picture> so browsers take AVIF where they can — consistently
 * 35-50% smaller than the WebP at matched quality — and fall back to WebP
 * otherwise. Replacing the files in public/media with real Panintel
 * photography at the same names is the whole swap; see manifest.json for the
 * source and licence of every current image.
 */
export function image(key: string, { alt = '', sizes = '100vw', eager = false }: Opts = {}): string {
  if (!IMAGES[key]) return ''
  const loading = eager ? 'eager" fetchpriority="high' : 'lazy'
  return (
    '<picture>' +
    `<source type="image/avif" srcset="${srcset(key, 'avif')}" sizes="${sizes}">` +
    `<img src="/media/${key}-1600.webp${ver(key)}" srcset="${srcset(key, 'webp')}" sizes="${sizes}" ` +
    `width="1600" height="1000" loading="${loading}" decoding="async" alt="${alt}">` +
    '</picture>'
  )
}

export const mediaCredits = () =>
  Object.entries(IMAGES)
    .filter((e): e is [string, Entry] => Boolean(e[1]))
    .map(([key, e]) => ({ key, credit: e.credit, source: e.source }))
