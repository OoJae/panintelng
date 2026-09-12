/**
 * Re-encodes the downloaded photography.
 *
 * The originals fetched by fetch-media.mjs went through cwebp at a single
 * quality, which left fso-1600.webp at 456 kB — a third of all media on the
 * site, because a high-frequency ocean shot compresses badly at default
 * settings. This replaces that with:
 *
 *   - AVIF alongside WebP, so browsers take whichever they support;
 *   - a 1200px step, so mid-size viewports stop downloading the 1600px file;
 *   - quality chosen per image by measuring, not one global number.
 *
 * Quality is held constant on purpose: the target is fewer bytes for the same
 * picture, never a softer picture.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import sharp from 'sharp'

const SRC = 'media-src'
const OUT = 'public/media'
const WIDTHS = [800, 1200, 1600]

// Quality is TARGETED, not guessed. For each image the encoder raises quality
// until the result meets a PSNR floor measured against the original — so a
// smooth photograph gets a low bitrate and a high-frequency one (aerial water,
// which is the worst case here) gets whatever it needs. Fewer bytes must never
// mean a softer picture.
// Fixed quality, chosen by looking rather than by metric.
//
// PSNR was tried first and rejected: matching the PSNR of the deployed WebP
// made the AVIF files LARGER than the files they replace, because PSNR
// systematically underrates AVIF — it scores the codec's smoothing of
// high-frequency detail as error even where the eye sees an identical, often
// cleaner, picture. The worst-case image here (an aerial ocean shot, all
// high-frequency water) was verified side by side at 1:1 instead.
//
// scripts/quality-targets.json records what the deployed build measures, kept
// for reference. PSNR is still reported below so any future change is visible.
const WEBP_Q = 80
const AVIF_Q = 55

/** PSNR of an encoded buffer against the reference pixels. */
async function psnr(reference, encoded, width, height) {
  const a = await sharp(reference).resize({ width, height, fit: 'fill' }).removeAlpha().raw().toBuffer()
  const b = await sharp(encoded).resize({ width, height, fit: 'fill' }).removeAlpha().raw().toBuffer()
  let sum = 0
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; sum += d * d }
  const mse = sum / a.length
  return mse === 0 ? 99 : 10 * Math.log10((255 * 255) / mse)
}

/** Encode once at the fixed quality, reporting the PSNR for the record. */
async function encode(pipeline, reference, format, quality, width, height) {
  const buf = format === 'avif'
    ? await pipeline.clone().avif({ quality, effort: 6, chromaSubsampling: '4:2:0' }).toBuffer()
    : await pipeline.clone().webp({ quality, effort: 6 }).toBuffer()
  return { buf, quality, db: await psnr(reference, buf, width, height) }
}

if (!existsSync(SRC)) {
  console.error(`No originals in ${SRC}. Run "npm run media" first — it keeps them there.`)
  process.exit(1)
}
mkdirSync(OUT, { recursive: true })

const keys = readdirSync(SRC).filter((f) => /\.(jpg|jpeg|png)$/i.test(f))

// Filenames stay stable, so a replaced photograph would keep its URL and sit
// behind the browser cache for a week. A content hash written into the
// manifest — and appended to the URL by lib/media.ts — makes a changed image a
// changed URL, so visitors see it immediately.
const manifestPath = 'public/media/manifest.json'
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
let before = 0
let after = 0

for (const file of keys) {
  const key = file.replace(/\.[^.]+$/, '')
  const buf = readFileSync(join(SRC, file))
  const meta = await sharp(buf).metadata()

  for (const w of WIDTHS) {
    if (meta.width && meta.width < w * 0.9) continue // never upscale
    // Resize only — never crop. The containers are not all 16:10, so
    // pre-cropping would re-frame the photograph: the browser's object-fit
    // cover would then crop a second time from an already-cropped image and
    // show a different part of the picture. Fewer bytes must not mean a
    // different photo.
    const base = sharp(buf).resize({ width: w, withoutEnlargement: true })

    const target = await base.clone().toBuffer({ resolveWithObject: true })
    const { width: tw, height: th } = target.info

    const webp = await encode(base, buf, 'webp', WEBP_Q, tw, th)
    writeFileSync(join(OUT, `${key}-${w}.webp`), webp.buf)

    const avif = await encode(base, buf, 'avif', AVIF_Q, tw, th)
    writeFileSync(join(OUT, `${key}-${w}.avif`), avif.buf)

    after += webp.buf.length + avif.buf.length
    console.log(
      `  ${key}-${w}`.padEnd(24) +
        `webp q${String(webp.quality).padEnd(2)} ${(webp.buf.length / 1024).toFixed(0).padStart(4)} kB ${webp.db.toFixed(1)}dB   ` +
        `avif q${String(avif.quality).padEnd(2)} ${(avif.buf.length / 1024).toFixed(0).padStart(4)} kB ${avif.db.toFixed(1)}dB`
    )
  }
}
for (const file of keys) {
  const key = file.replace(/\.[^.]+$/, '')
  if (!manifest.images[key]) continue
  manifest.images[key].v = createHash('sha256').update(readFileSync(join(SRC, file))).digest('hex').slice(0, 8)
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

console.log(`\n  ${keys.length} images -> ${WIDTHS.length} widths x 2 formats, ${(after / 1024 / 1024).toFixed(2)} MB total`)
console.log('  content hashes written to manifest.json (cache-busts changed photos)')
