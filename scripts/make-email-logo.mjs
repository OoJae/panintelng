/**
 * Renders the logo as a PNG for email signatures.
 *
 * Outlook does not render SVG, so it has to be a raster image.
 *
 * Drawn in the supplied artwork's own treatment — grey wordmark, amber
 * descriptor — on a TRANSPARENT background, so it sits directly on whatever
 * ground the mail client provides. That holds up in both modes: the grey is
 * 2.4:1 on white and 7.1:1 on dark, the amber 1.6:1 and 10.5:1. The amber is
 * weak on white, but that is how the artwork is drawn and a logotype carries no
 * contrast minimum.
 *
 * Emitted at 2x and displayed at half size, so it stays sharp on retina.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const SCALE = 2
const LOGO_W = 200          // displayed width in the signature
const PAD_X = 0
const PAD_Y = 0

const svg = readFileSync('public/brand/logo-stacked.svg', 'utf8')
  .replace(/var\(--logo-ink,\s*currentColor\)/g, '#A6A6A6')   // grey, per the artwork
  .replace(/var\(--logo-accent,\s*#FFC000\)/g, '#FFC000')

const mark = await sharp(Buffer.from(svg), { density: 600 })
  .resize({ width: LOGO_W * SCALE })
  .png()
  .toBuffer()

const { width, height } = await sharp(mark).metadata()
const out = await sharp({
  create: {
    width: width + PAD_X * 2 * SCALE,
    height: height + PAD_Y * 2 * SCALE,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },   // transparent — takes the client's own ground
  },
})
  .composite([{ input: mark, left: PAD_X * SCALE, top: PAD_Y * SCALE }])
  .png({ compressionLevel: 9 })
  .toBuffer()

// Both dimensions must be EVEN. The signature declares the image at half size,
// and an odd dimension halves to a fraction — rounding that to an integer
// stretches the logo by a percent or two, which is visible on a wordmark.
const pre = await sharp(out).metadata()
const evened = (pre.width % 2 === 0 && pre.height % 2 === 0)
  ? out
  : await sharp(out)
      .extend({
        right: pre.width % 2,
        bottom: pre.height % 2,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toBuffer()

writeFileSync('public/brand/logo-email.png', evened)
const m = await sharp(evened).metadata()
console.log(`  logo-email.png  ${m.width}x${m.height} (display at ${m.width / SCALE}x${m.height / SCALE} — exact halves) ${(evened.length / 1024).toFixed(1)} kB`)
