# panintelng.com

Website for **Panintel Projects Nigeria Limited** — a wholly indigenous Nigerian
engineering, procurement and construction company serving the oil, gas and power
sector.

Live at **https://www.panintelng.com**

Static HTML, CSS and JavaScript built with Vite. No framework, no server-side
code beyond one PHP mail handler. Hosted on Namecheap shared hosting.

---

## Running it

```bash
npm install
npm run dev        # http://127.0.0.1:5178
npm run build      # static output in dist/
npm run preview    # serve the build
npm run typecheck
```

## Deploying

```bash
npm run build
cd dist && zip -rq ../panintel-site.zip . && cd ..
```

Upload the zip via cPanel File Manager and extract it into `public_html`,
overwriting. The contents of `dist/` go at the root — not inside a `dist` folder.
Turn on **Show Hidden Files** and confirm `.htaccess` came across: it carries the
HTTPS redirect, the clean-URL rewrite, compression and caching.

Asset filenames carry a content hash and HTML is served `no-cache`, so returning
visitors pick up changes immediately. There is no cache to purge.

---

## How it is put together

**Design tokens** live in `src/styles/tokens.css` — colours (several lifted
verbatim from the company profile PDF), the type scale, spacing and motion
curves. Every rule elsewhere draws from them.

**Content lives in one place.** `src/content/company.ts` holds every word, figure
and specification on the site, each annotated with the slide of
`1.0 Panintel Projects Company Profile.pdf` it came from. Nothing is invented —
no project counts, no client logos, no metrics the profile does not state.

**Pages are rendered at build time.** `src/content/render.ts` turns that content
into markup, injected by a plugin in `vite.config.ts` via `<!--@data name-->`
markers. Pages ship complete HTML: indexable, readable without JavaScript, no
client-side render pass. The same mechanism inlines the stylesheet and the
JSON-LD structured data.

**Partials avoid drift.** `<!--@include nav-->` pulls in shared chrome;
`<!--@svg logo-stacked-->` inlines brand artwork from `public/brand/` at build
time, so an embedded copy can never fall out of sync with the generated file.

**The client bundle is motion only** — roughly 7 kB gzipped. Reveals run on one
`IntersectionObserver` with CSS transitions; Lenis provides smooth scrolling.

## Generated assets

These are committed, but reproducible:

```bash
npm run brand:logo     # wordmark + lockups, outlined from Archivo (python3 + fontTools)
npm run brand:mark     # standalone P mark and favicon
npm run brand:fonts    # webfont subsets — 140 kB of full latin ranges down to 50 kB
npm run brand:hardhat  # composites the logo onto the HSE photograph
npm run media          # re-download source photography into media-src/
npm run media:encode   # encode to AVIF + WebP at 800/1200/1600
npm run sitemap        # regenerate sitemap.xml (also runs on build)
```

`media-src/` holds the source photographs, including `_pristine/safety.jpg` — the
unbranded hard hat. `npm run media` overwrites the branded version, so re-run
`npm run brand:hardhat` after it.

## Imagery

The photographs in `public/media/` are **placeholders**, openly licensed from
Unsplash; `public/media/manifest.json` records the photographer, source URL and
licence for each. Replacing them with real Panintel photography at the same
filenames is the whole swap — URLs carry a content hash, so a changed image
reaches visitors immediately rather than sitting behind a week of browser cache.

## Contact form

`public/api/enquiry.php` — a same-origin POST that emails
`technical@panintelng.com`, with `Reply-To` set to the enquirer. Works without
JavaScript (renders a thank-you page); with it, the form is replaced in place by
a confirmation. Spam is handled by a honeypot, a minimum-time check and per-IP
rate limiting rather than a CAPTCHA.
