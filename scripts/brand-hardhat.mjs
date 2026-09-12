/**
 * Puts the Panintel logo on the hard hat in the HSE photograph.
 *
 * The stock shot is a bare red helmet; branding it makes the safety page read
 * as Panintel's own site rather than a stock library. The logo goes on the
 * upper side face — where a real printed hat carries it — rotated to sit with
 * the shell's tilt, and composited at slightly less than full opacity so the
 * plastic's sheen still reads through it rather than looking pasted on.
 *
 * Writes media-src/safety.jpg, so the normal encode pipeline picks it up:
 *   node scripts/brand-hardhat.mjs && npm run media:encode
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import sharp from 'sharp'

const PHOTO = 'media-src/safety.jpg'
// The unbranded original lives in a subdirectory, so encode-media.mjs — which
// globs media-src/*.jpg — does not treat it as another photograph and emit six
// files nothing references.
const PRISTINE = 'media-src/_pristine/safety.jpg'
const LOGO = 'public/brand/logo-stacked.svg'

// Placement on the 1600x900 source, measured off the shell.
// Lower and slightly forward of first attempt: clear of the vent holes, sitting
// on the flatter side panel where a real hat carries its branding rather than
// riding high on the dome.
const PLACE = { width: 232, left: 878, top: 452, rotate: -7, opacity: 0.9 }

// Never brand an already-branded photo — always start from the pristine copy.
mkdirSync(dirname(PRISTINE), { recursive: true })
if (!existsSync(PRISTINE)) copyFileSync(PHOTO, PRISTINE)

// The SVG uses CSS custom properties for colour; a rasteriser sees no CSS, so
// bake in the ink explicitly. White, as a printed hat logo would be.
const svg = readFileSync(LOGO, 'utf8')
  .replace(/var\(--logo-ink,\s*currentColor\)/g, '#FFFFFF')
  .replace(/var\(--logo-accent,\s*#FFC000\)/g, '#FFC000')

const logo = await sharp(Buffer.from(svg), { density: 600 })
  .resize({ width: PLACE.width })
  .rotate(PLACE.rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .composite([{
    // Knock the whole mark back so the shell's highlight still shows through.
    input: Buffer.from([255, 255, 255, Math.round(255 * PLACE.opacity)]),
    raw: { width: 1, height: 1, channels: 4 },
    tile: true,
    blend: 'dest-in',
  }])
  .png()
  .toBuffer()

const out = await sharp(PRISTINE)
  .composite([{ input: logo, left: PLACE.left, top: PLACE.top, blend: 'over' }])
  .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
  .toBuffer()

writeFileSync(PHOTO, out)
const { width, height } = await sharp(out).metadata()
console.log(`  branded ${PHOTO} (${width}x${height}) — logo ${PLACE.width}px at ${PLACE.left},${PLACE.top} rotated ${PLACE.rotate}°`)
