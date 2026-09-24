/**
 * Pure HTML builders.
 *
 * These run at BUILD time (see the `data` plugin in vite.config.ts), not in the
 * browser: the pages ship complete markup. That matters for a marketing site —
 * the copy is indexable, readable without JavaScript, and there is no
 * client-side render pass before the content appears.
 */
import { PILLARS, LIFECYCLE, ASSETS, OTHER_SERVICES, CORE_VALUES, CONTACT } from './company'
import { image } from '../lib/media'
import { bowTie } from '../lib/schematic'
import { orgChart } from '../lib/orgchart'

const CARD_SIZES = '(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 24vw'
const HALF_SIZES = '(max-width: 860px) 100vw, 50vw'

/** Photography paired with each capability, so the tiles carry a face. */
const PILLAR_MEDIA: Record<string, string> = {
  'project-engineering': 'engineering',
  'asset-development': 'operations',
  'epc-management': 'engineering',
  'technical-safety': 'safety',
  'well-integrity': 'offshore',
  'field-development': 'team',
}

const assetRow = (a: (typeof ASSETS)[number], heading: 'h2' | 'h3') => `
      <article class="assetrow" data-reveal>
        <div class="assetrow__media">
          ${image(a.media, { sizes: HALF_SIZES })}
          <span class="assetrow__code">${a.code}</span>
        </div>
        <div class="assetrow__body">
          <p class="eyebrow">${a.abbr}</p>
          <${heading} class="display display--sub assetrow__name">${a.name}</${heading}>
          ${a.class ? `<p class="assetrow__class">${a.class}</p>` : ''}
          <dl class="specs">
            ${a.specs.map((s) => `<div class="spec"><dt>${s.k}</dt><dd>${s.v}</dd></div>`).join('')}
          </dl>
        </div>
      </article>`

export const BLOCKS: Record<string, () => string> = {
  /** Home — the six capabilities as a tile grid. */
  tiles: () =>
    `<div class="tiles">${PILLARS.map(
      (p) => `
      <article class="tile" data-reveal data-reveal-group="tiles">
        <p class="eyebrow">${p.tag}</p>
        <h3 class="display display--card tile__title">
          <a href="/capabilities#${p.slug}">${p.title}</a>
        </h3>
        <p class="tile__note">${p.lede}</p>
        <span class="tile__more">Read more</span>
      </article>`
    ).join('')}</div>`,

  /** Home — capabilities as picture cards. */
  cards: () =>
    `<div class="cards">${PILLARS.slice(0, 4)
      .map(
        (p) => `
      <article class="card" data-reveal data-reveal-group="cards">
        <div class="card__media">${image(PILLAR_MEDIA[p.slug] ?? 'operations', { sizes: CARD_SIZES })}</div>
        <div class="card__body">
          <p class="eyebrow">${p.tag}</p>
          <h3 class="display display--card card__title">
            <a href="/capabilities#${p.slug}">${p.title}</a>
          </h3>
          <p class="card__note">${p.lede}</p>
          <p class="card__foot">Capability</p>
        </div>
      </article>`
      )
      .join('')}</div>`,

  steps: () =>
    `<ol class="steps">${LIFECYCLE.map(
      (s) => `
      <li class="step" data-reveal data-reveal-group="steps">
        <span class="step__n">${s.n}</span>
        <p class="step__t">${s.title}</p>
      </li>`
    ).join('')}</ol>`,

  /** Home shows the three largest assets; the assets page shows all five. */
  'asset-preview': () => ASSETS.slice(0, 3).map((a) => assetRow(a, 'h3')).join(''),
  'asset-rows': () => ASSETS.map((a) => assetRow(a, 'h2')).join(''),

  'capability-entries': () =>
    PILLARS.map(
      (p) => `
      <article class="entry" id="${p.slug}" data-reveal>
        <header class="entry__head">
          <p class="eyebrow">${p.tag}</p>
          <h2 class="display display--sub entry__title">${p.title}</h2>
          <p class="entry__lede">${p.lede}</p>
        </header>
        <div class="entry__body">
          ${p.body.map((b) => `<p class="prose">${b}</p>`).join('')}
          ${p.figure ? `<p class="entry__figure"><strong>${p.figure.value}</strong><span>${p.figure.label}</span></p>` : ''}
          ${p.services.length ? `<ul class="services">${p.services.map((sv) => `<li>${sv}</li>`).join('')}</ul>` : ''}
        </div>
      </article>`
    ).join(''),

  'other-services': () => `<ul class="services">${OTHER_SERVICES.map((s) => `<li>${s}</li>`).join('')}</ul>`,

  values: () =>
    `<ul class="values">${CORE_VALUES.map(
      (v, i) => `
      <li class="value" data-reveal data-reveal-group="values">
        <span class="value__n">${String(i + 1).padStart(2, '0')}</span>
        <h3 class="display display--card value__name">${v.name}</h3>
        <p class="value__note">${v.note}</p>
      </li>`
    ).join('')}</ul>`,

  contact: () => {
    const offices = CONTACT.offices
      .map((o) => `<div class="contact-card"><h3>${o.city}</h3>${o.lines.map((l) => `<p>${l}</p>`).join('')}</div>`)
      .join('')
    return `<div class="contact-grid">
      ${offices}
      <div class="contact-card">
        <h3>Telephone</h3>
        ${CONTACT.phones.map((p) => `<a href="tel:${p.replace(/\s/g, '')}">${p}</a>`).join('')}
      </div>
      <div class="contact-card">
        <h3>Email</h3>
        <a href="mailto:${CONTACT.email}">${CONTACT.email}</a>
      </div>
    </div>`
  },

  bowtie: () => bowTie(),
  orgchart: () => orgChart(),

  // --- image slots ------------------------------------------------------
  'img-hero': () => image('hero', { sizes: '100vw', eager: true }),
  'img-team': () => image('team', { sizes: HALF_SIZES }),
  'img-safety': () => image('safety', { sizes: HALF_SIZES }),
  'img-safety-plain': () => image('safety-plain', { sizes: '100vw' }),
  'img-offshore': () => image('offshore', { sizes: HALF_SIZES }),
  'img-operations': () => image('operations', { sizes: HALF_SIZES }),
  'img-engineering': () => image('engineering', { sizes: HALF_SIZES }),
}
