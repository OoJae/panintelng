/**
 * Sources, downsizes and encodes the site's placeholder imagery.
 *
 * Only images served from images.unsplash.com are used: those carry the free
 * Unsplash License (commercial use, no permission needed). plus.unsplash.com
 * results are Unsplash+ — paid — and are filtered out.
 *
 * Images are NOT colour-graded here. The duotone is applied in CSS so the whole
 * set stays one system and real Panintel photography can be dropped in without
 * reprocessing. See public/media/manifest.json for what to replace.
 */
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const OUT = 'public/media'
const ORIGINALS = 'media-src'
const WIDTHS = [1600, 800]

const SHOTS = [
  // Equipment — paired with the rated specifications on the assets sheet
  { key: 'fpso',  q: 'oil tanker ship ocean industrial',      note: 'Stands in for an FPSO hull' },
  { key: 'fso',   q: 'crude oil tanker sea aerial',           note: 'Stands in for an FSO' },
  { key: 'mopu',  q: 'offshore oil platform rig sea',         note: 'Stands in for a MOPU' },
  { key: 'ewt',   q: 'industrial pipes valves refinery',      note: 'Stands in for well test process train' },
  { key: 'barge', q: 'industrial crane barge river port',     note: 'Stands in for an inland spud barge' },
  // Hero and section photography
  { key: 'hero',       q: ['oil refinery plant panorama dusk', 'industrial gas plant pipelines wide', 'petrochemical plant night'], note: 'Home hero' },
  { key: 'engineering', q: ['engineering blueprints drawings desk', 'technical drawing plans', 'architect blueprint'],       note: 'Engineering and design' },
  { key: 'safety',     q: 'worker safety helmet industrial inspection',    note: 'HSE' },
  { key: 'operations', q: 'gas processing plant pipework dusk',            note: 'Operations and maintenance' },
  { key: 'team',       q: 'african engineers meeting construction site',   note: 'About / who we are' },
  { key: 'offshore',   q: 'offshore platform helicopter deck sea',         note: 'Capabilities' },
]

const sh = (cmd, args) => execFileSync(cmd, args, { stdio: 'pipe' })

/**
 * `q` may be a single query or a list of fallbacks. A page of results can be
 * entirely Unsplash+ (paid), so we try each query until one yields a photo
 * under the free Unsplash License.
 */
const used = new Set()

async function search(q) {
  const queries = Array.isArray(q) ? q : [q]
  for (const query of queries) {
    const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=24&orientation=landscape`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) continue
    const { results = [] } = await res.json()
    const free = results.filter(
      (r) => r.urls?.raw?.startsWith('https://images.unsplash.com/') && !used.has(r.id)
    )
    if (free.length) {
      used.add(free[0].id) // never let two slots resolve to the same photo
      return free[0]
    }
  }
  throw new Error(`no free-licensed results for ${JSON.stringify(queries)}`)
}

async function download(photo, key) {
  const records = []
  for (const w of WIDTHS) {
    const src = `${photo.urls.raw}&fm=jpg&q=82&w=${w}&fit=max`
    const res = await fetch(src)
    if (!res.ok) throw new Error(`download failed (${res.status}) ${key}@${w}`)
    // Keep the original alongside the encode: re-encoding later (see
    // encode-media.mjs) should never mean re-downloading.
    mkdirSync(ORIGINALS, { recursive: true })
    const original = join(ORIGINALS, `${key}.jpg`)
    const bytes = Buffer.from(await res.arrayBuffer())
    if (w === Math.max(...WIDTHS)) writeFileSync(original, bytes)
    const tmp = join(OUT, `${key}-${w}.jpg`)
    writeFileSync(tmp, bytes)
    const webp = join(OUT, `${key}-${w}.webp`)
    sh('cwebp', ['-quiet', '-q', '76', '-m', '5', tmp, '-o', webp])
    rmSync(tmp)
    records.push({ w, file: `/media/${key}-${w}.webp` })
  }
  return records
}

const manifest = { note: 'Placeholder imagery. Replace with real Panintel project photography.', images: {} }
mkdirSync(OUT, { recursive: true })

for (const shot of SHOTS) {
  try {
    const photo = await search(shot.q)
    const files = await download(photo, shot.key)
    manifest.images[shot.key] = {
      alt: photo.alt_description || shot.note,
      note: shot.note,
      credit: photo.user?.name ?? 'Unknown',
      source: `https://unsplash.com/photos/${photo.id}`,
      license: 'Unsplash License — free for commercial use, no permission needed',
      files,
    }
    console.log(`${shot.key.padEnd(6)} ${photo.id}  ${photo.user?.name}`)
  } catch (err) {
    console.error(`${shot.key.padEnd(6)} FAILED: ${err.message}`)
  }
}

writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(`\nmanifest: ${Object.keys(manifest.images).length}/${SHOTS.length} images`)
if (!existsSync(join(OUT, 'manifest.json'))) process.exit(1)
