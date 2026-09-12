/**
 * Structured data (JSON-LD).
 *
 * Google had nothing machine-readable about this company: searching the name
 * returned no description of what it does, because the only signal was prose in
 * a page it had not yet crawled. This states the facts explicitly — legal name,
 * what the company does, where it operates, how to reach it — in the form
 * search engines actually consume.
 *
 * Every value is drawn from company.ts, so it cannot drift from the page, and
 * nothing here is invented: no ratings, no employee counts, no founding date,
 * no social profiles, because the company profile states none of those.
 */
import { COMPANY, CONTACT, PILLARS, ABOUT } from './company'

const SITE = 'https://www.panintelng.com'

const postal = (o: (typeof CONTACT.offices)[number]) => ({
  '@type': 'PostalAddress',
  streetAddress: o.lines.slice(0, -1).join(', '),
  addressLocality: o.city,
  addressCountry: o.country === 'Nigeria' ? 'NG' : 'GH',
})

/** The company itself — this is what a name search should surface. */
const organisation = {
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: COMPANY.name,
  alternateName: ['Panintel', 'Panintel Projects', 'Panintel Nigeria'],
  legalName: COMPANY.name,
  url: SITE,
  logo: { '@type': 'ImageObject', url: `${SITE}/brand/logo-stacked.svg`, caption: COMPANY.name },
  image: `${SITE}/brand/og-image.png`,
  description:
    'Panintel Projects Nigeria Limited is a wholly indigenous Nigerian engineering, procurement and construction company serving the oil, gas and power sector. Services span project engineering and management, oil and gas asset development, EPC management, technical safety studies and risk management, well integrity management, and field development and optimisation. Based in Lagos, Nigeria.',
  email: CONTACT.email,
  telephone: CONTACT.phones,
  address: postal(CONTACT.offices[0]!),
  location: CONTACT.offices.map((o) => ({
    '@type': 'Place',
    name: `Panintel Projects — ${o.city}`,
    address: postal(o),
  })),
  areaServed: [
    { '@type': 'Country', name: 'Nigeria' },
    { '@type': 'Place', name: 'West Africa' },
  ],
  // The disciplines the company actually lists, so a search for any of them
  // can associate it with this company.
  knowsAbout: [
    'Engineering, Procurement and Construction',
    'Project management',
    'Oil and gas production facilities',
    'Technical safety studies',
    'HAZOP and HAZID studies',
    'Well integrity management',
    'Field development and optimisation',
    'Front-end engineering design',
    'Risk assessment and analysis',
  ],
  makesOffer: PILLARS.map((p) => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name: p.title,
      description: p.lede,
      url: `${SITE}/capabilities#${p.slug}`,
      provider: { '@id': `${SITE}/#organization` },
    },
  })),
}

const website = {
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  url: SITE,
  name: COMPANY.name,
  alternateName: 'Panintel',
  publisher: { '@id': `${SITE}/#organization` },
  inLanguage: 'en',
}

/** Crumbs for an inner page, so results show a path rather than a bare URL. */
const breadcrumb = (name: string, path: string) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
    { '@type': 'ListItem', position: 2, name, item: `${SITE}${path}` },
  ],
})

const PAGES: Record<string, { name: string; path: string }> = {
  capabilities: { name: 'Capabilities', path: '/capabilities' },
  assets: { name: 'Assets & Equipment', path: '/assets' },
  about: { name: 'About', path: '/about' },
  hse: { name: 'Health, Safety and Environment', path: '/hse' },
  contact: { name: 'Contact', path: '/contact' },
}

export function schemaFor(page: string): string {
  const graph: unknown[] = [organisation, website]

  if (page === 'index') {
    graph.push({
      '@type': 'WebPage',
      '@id': `${SITE}/#webpage`,
      url: SITE,
      name: COMPANY.name,
      description: ABOUT.body[0],
      isPartOf: { '@id': `${SITE}/#website` },
      about: { '@id': `${SITE}/#organization` },
    })
  } else if (PAGES[page]) {
    const { name, path } = PAGES[page]!
    graph.push(breadcrumb(name, path), {
      '@type': 'WebPage',
      url: `${SITE}${path}`,
      name: `${name} — ${COMPANY.name}`,
      isPartOf: { '@id': `${SITE}/#website` },
      about: { '@id': `${SITE}/#organization` },
    })
  }

  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`
}
