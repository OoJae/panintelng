/**
 * Builds sitemap.xml with a real lastmod, so a crawler can tell what has
 * changed instead of re-fetching everything or nothing.
 */
import { writeFileSync } from 'node:fs'

const SITE = 'https://www.panintelng.com'
const today = new Date().toISOString().slice(0, 10)

const PAGES = [
  { path: '/', priority: '1.0', changefreq: 'monthly' },
  { path: '/capabilities', priority: '0.9', changefreq: 'monthly' },
  { path: '/assets', priority: '0.9', changefreq: 'monthly' },
  { path: '/about', priority: '0.7', changefreq: 'yearly' },
  { path: '/hse', priority: '0.7', changefreq: 'yearly' },
  { path: '/contact', priority: '0.8', changefreq: 'yearly' },
]

const body = PAGES.map(
  (p) => `  <url>
    <loc>${SITE}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
).join('\n')

writeFileSync(
  'public/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
)
console.log(`  sitemap.xml — ${PAGES.length} URLs, lastmod ${today}`)
