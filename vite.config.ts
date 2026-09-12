import { defineConfig, type Plugin } from 'vite'
import { schemaFor } from './src/content/schema'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

/**
 * Minimal HTML partials: `<!--@include name-->` inlines src/partials/name.html.
 * Six pages share one nav and one title block; duplicating them by hand is how
 * they drift apart. Resolves recursively so partials can nest.
 */
function includes(): Plugin {
  const read = (name: string, depth = 0): string => {
    if (depth > 5) throw new Error(`@include recursion too deep at "${name}"`)
    const file = resolve(root, 'src/partials', `${name}.html`)
    if (!existsSync(file)) throw new Error(`@include: no such partial "${name}" (${file})`)
    return expand(readFileSync(file, 'utf8'), depth + 1)
  }
  /** `<!--@svg name-->` inlines public/brand/name.svg. Inlining (rather than
   *  <img>) is what lets the lockup take its colours from CSS custom
   *  properties — and reading the file at build time means an embedded copy
   *  can never drift out of sync with the generated artwork. */
  const svg = (name: string) => {
    const file = resolve(root, 'public/brand', `${name}.svg`)
    if (!existsSync(file)) throw new Error(`@svg: no such brand file "${name}" (${file})`)
    return readFileSync(file, 'utf8').trim()
  }

  const expand = (html: string, depth = 0) =>
    html
      .replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_m, name) => read(name, depth))
      .replace(/<!--\s*@svg\s+([\w-]+)\s*-->/g, (_m, name) => svg(name))

  return {
    name: 'panintel-html-includes',
    transformIndexHtml: { order: 'pre', handler: (html) => expand(html) },
  }
}

/**
 * `<!--@data name-->` is replaced with markup rendered from src/content at build
 * time, so every page ships complete HTML: indexable, readable without
 * JavaScript, and with no client-side render pass before the copy appears.
 */
function data(): Plugin {
  return {
    name: 'panintel-content-blocks',
    // after includes, so a partial can carry a data marker too
    // default order runs after the 'pre' includes plugin, so a partial can
    // carry a data marker too
    transformIndexHtml: {
      async handler(html) {
        if (!html.includes('<!--@data')) return html
        const { BLOCKS } = await import('./src/content/render')
        return html.replace(/<!--\s*@data\s+([\w-]+)\s*-->/g, (_m, name: string) => {
          const build = BLOCKS[name]
          if (!build) throw new Error(`@data: no such block "${name}"`)
          return build()
        })
      },
    },
  }
}

/**
 * Dev-server equivalent of the .htaccess clean-URL rule, so `/contact` resolves
 * locally exactly as it does in production and links can be tested here.
 */
function cleanUrls(): Plugin {
  return {
    name: 'panintel-clean-urls',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? '/'
        const [path, query = ''] = url.split('?')
        if (path && !path.startsWith('/api/') && !/\.[a-z0-9]+$/i.test(path) && path !== '/') {
          const candidate = resolve(root, `${path.replace(/^\/|\/$/g, '')}.html`)
          if (existsSync(candidate)) req.url = `${path.replace(/\/$/, '')}.html${query ? '?' + query : ''}`
        }
        next()
      })
    },
  }
}

/**
 * Inlines the built stylesheet and preloads what the first paint needs.
 *
 * The CSS is ~5 kB gzipped — well under the size where a separate request costs
 * more than the bytes save, and it was the last render-blocking round trip.
 * Fonts are preloaded because they are discovered late (inside CSS), and the
 * hero image because it is the LCP element on every page.
 */
function critical(): Plugin {
  return {
    name: 'panintel-critical',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml(html, ctx) {
      const bundle = ctx.bundle ?? {}

      // Inline the stylesheet, then drop its <link>.
      for (const [file, asset] of Object.entries(bundle)) {
        if (!file.endsWith('.css') || asset.type !== 'asset') continue
        const css = String(asset.source)
        html = html
          .replace(new RegExp(`<link[^>]+href="/${file}"[^>]*>`), '')
          .replace('</head>', `<style>${css}</style>\n</head>`)
        delete bundle[file] // nothing references it any more
      }

      // Structured data, so a search for the company name returns what the
      // company does rather than a bare link.
      const pageName = (ctx.path || '/index.html').replace(/^\//, '').replace(/\.html$/, '') || 'index'
      html = html.replace('</head>', `${schemaFor(pageName)}\n</head>`)

      const preloads = [
        // Display and body faces are needed for the headline and first copy.
        '<link rel="preload" href="/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>',
        '<link rel="preload" href="/fonts/instrument-sans.woff2" as="font" type="font/woff2" crossorigin>',
      ]

      // The hero is the LCP element. Preload the AVIF specifically — it is what
      // the <picture> will resolve to in any browser that supports it, and
      // preloading the WebP instead would fetch a file that then goes unused.
      const hero = html.match(/<picture>\s*<source type="image\/avif" srcset="([^"]+)" sizes="([^"]+)">\s*<img[^>]*fetchpriority="high"/)
      if (hero) {
        preloads.push(
          `<link rel="preload" as="image" type="image/avif" imagesrcset="${hero[1]}" imagesizes="${hero[2]}">`
        )
      }

      return html.replace('</head>', preloads.join('\n  ') + '\n</head>')
    },
  }
}

const pages = ['index', 'capabilities', 'assets', 'about', 'hse', 'contact', '404']

export default defineConfig({
  plugins: [includes(), data(), cleanUrls(), critical()],
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    // NOT "assets": that collides with the /assets page — Apache sees a real
    // directory of the same name and 301s /assets to /assets/, so the page
    // becomes unreachable.
    assetsDir: 'static',
    cssTarget: 'chrome111',
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(root, `${p}.html`)])),
    },
  },
  server: { port: 5178, host: '127.0.0.1' },
})
