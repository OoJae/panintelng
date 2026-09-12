/**
 * Panintel mark — a bold geometric P.
 *
 * Used for avatars, app icons and favicons: anywhere the full wordmark would
 * be illegible. Never set adjacent to the wordmark.
 */
import { writeFileSync, mkdirSync } from 'node:fs'

const AMBER = '#FFC000'
const BONE = '#F1EFEA'
const VOID = '#050505'

// --- P geometry — bowl:tail ≈ 2:1, the proportion of a bold display P ------
const CAP = { top: 8, bottom: 112 }         // cap height 104
const STEM = { x: 14, w: 17 }
const BOWL = { cx: 55, cy: 43, ro: 35, weight: 17 }
const R_MID = BOWL.ro - BOWL.weight / 2     // stroked-circle radius: 26.5
const CORE = 8
const VB = '0 0 96 120'

const f = (n) => Math.round(n * 100) / 100

const stem = (c) => `<rect x="${STEM.x}" y="${CAP.top}" width="${STEM.w}" height="${CAP.bottom - CAP.top}" fill="${c}"/>`
const bowl = (c) => `<circle cx="${BOWL.cx}" cy="${BOWL.cy}" r="${f(R_MID)}" fill="none" stroke="${c}" stroke-width="${BOWL.weight}"/>`

mkdirSync('public/brand', { recursive: true })

// --- Primary: two colour. Letterform inherits currentColor; core is amber --
writeFileSync(
  'public/brand/mark.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}" fill="none" role="img" aria-label="Panintel">
  <title>Panintel</title>
  <g color="${BONE}">
    ${stem('currentColor')}
    ${bowl('currentColor')}
  </g>
</svg>
`
)

// --- Favicon: squared, own ground, optically enlarged for small sizes ------
writeFileSync(
  'public/brand/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="12" fill="${VOID}"/>
  <g transform="translate(12.5 4.5) scale(0.44)">
    ${stem(BONE)}
    ${bowl(BONE)}
  </g>
</svg>
`
)

console.log('wrote mark.svg, favicon.svg')

