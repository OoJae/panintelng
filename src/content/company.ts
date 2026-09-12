/**
 * Single source of truth for all Panintel copy, figures and specifications.
 *
 * EVERY fact in this file is transcribed from "1.0 Panintel Projects Company
 * Profile.pdf" (15 slides). Slide numbers are cited so anything can be checked
 * or corrected against the source. Nothing here is invented — where the profile
 * gives no figure, the site shows no figure.
 */

export const COMPANY = {
  name: 'Panintel Projects Nigeria Limited',
  short: 'Panintel',
  wordmark: 'PANINTEL',
  // slide 15 (cover) — the four disciplines, in the profile's own order
  disciplines: ['Engineering', 'Procurement', 'Construction', 'Project Management'],
  domain: 'panintelng.com',
} as const

/** slide 14 — contact details */
export const CONTACT = {
  offices: [
    {
      city: 'Lagos',
      country: 'Nigeria',
      lines: ['Flat I, Block 2, Danescroft Place', 'Milverton Court Estate, Jakande', 'Lagos, Nigeria'],
    },
  ],
  phones: ['+234 705 662 3505', '+234 803 727 7743'],
  // info@panintelng.com is advertised in the company profile PDF but has no
  // mailbox on the server, so the site shows addresses that actually receive.
  email: 'technical@panintelng.com',
  emailAlt: 'panintelprojects@gmail.com',
} as const

/** slide 1 — the profile's opening statement, verbatim */
export const CREED =
  'We align ourselves with international best practices and are committed to delivering nothing less than Excellent Service.'

/** slide 2 — Who We Are */
export const ABOUT = {
  eyebrow: 'Who we are',
  body: [
    'Panintel Projects is a limited liability company, incorporated under the laws of the Federal Republic of Nigeria.',
    'We are wholly indigenous, with local and international affiliations and partnerships, specializing in Engineering, Procurement, Construction and Project Management services.',
  ],
} as const

/** slide 3 — Vision, Mission & Core Values, verbatim */
export const VISION =
  'To become the point of reference in the Oil and Gas industry, known for superior service delivery with utmost professionalism, all around the World.'

export const MISSION = 'To provide the best value in services for the Oil and Gas Industry all over the World.'

export const CORE_VALUES = [
  { name: 'Integrity', note: 'What we commit to is what we deliver.' },
  { name: 'Excellence', note: 'International best practice as the baseline, not the ambition.' },
  { name: 'Team Work', note: 'Operators, contractors and engineers working to one plan.' },
  { name: 'Corporate Social Responsibility', note: 'Accountable to the communities we operate in.' },
] as const

/**
 * The six capability pillars.
 *
 * `tag` is a P&ID-style instrument tag: discipline letters + the sheet the
 * pillar appears on. Categorical, not a ranking — which is why these are tagged
 * rather than numbered (only LIFECYCLE below is a real sequence).
 * Sources: slides 2, 5, 6, 7, 8, 9, 10.
 */
export type Pillar = {
  tag: string
  slug: string
  title: string
  lede: string
  body: string[]
  services: string[]
  /** pulled figure, only where the profile actually states one */
  figure?: { value: string; label: string }
}

export const PILLARS: Pillar[] = [
  {
    tag: 'PE·02',
    slug: 'project-engineering',
    title: 'Project Engineering & Management',
    lede: 'Feasibility through financing, held to one plan.',
    body: ['Our Project Engineering and Management solutions encompass the following areas:'],
    services: [
      'Technical and Economic Feasibility Studies',
      'Project Planning and Supervision',
      'Project Audit',
      'Quality Assurance and Control',
      'Financial Modelling',
      'Project Financing',
    ],
  },
  {
    tag: 'AD·03',
    slug: 'asset-development',
    title: 'Oil, Gas, Power & Energy Asset Development',
    lede: 'Technical operations support across producing facilities and power plants.',
    body: [
      'We provide Technical Operations Support services across various facilities, ranging from Oil and Gas Production Facilities and Power Plants to list a few.',
    ],
    services: [
      'Oil & Gas Production, Operations and Maintenance Services',
      'Early Production Facilities',
      'Crude Oil Dewatering and Produced Water Treatment Facilities',
      'Crude Oil Haulage and Produced Water Disposal Services',
      'Well Testing Operations',
      'Pipelines & Flow lines Maintenance Services',
      'Oil and Gas Production Facilities',
      'Power plants',
      'CNG and LNG Facilities',
      'Drilling Services',
      'Well Services and Completions',
    ],
  },
  {
    tag: 'EP·04',
    slug: 'epc-management',
    title: 'Engineering, Procurement & Construction Management',
    lede: 'Concept screening to detailed design, with independent review built in.',
    body: [
      'Panintel Projects offers an array of Project Engineering, Procurement and Construction Management solutions. Our specializations include:',
    ],
    services: [
      'Concept Screening, Selection and Definition',
      'Front-end Engineering Design',
      'Detailed Engineering Design',
      'Facility/Plant Valuations',
      'Independent Design and Drawing Reviews/Assessment/Audits',
      'Risk Assessment/Analysis',
    ],
  },
  {
    tag: 'TS·05',
    slug: 'technical-safety',
    title: 'Technical Safety Studies & Risk Management',
    lede: 'Our objective is to prevent disasters through a proactive response.',
    body: [
      'We provide a comprehensive range of Technical Safety Services that support safe performance of a facility over its entire lifecycle.',
      'We also follow a structured hazard and risk management process to demonstrate and document how hazards are identified, evaluated and controlled.',
    ],
    services: [
      'HAZOP Studies',
      'HAZID Studies',
      'FIREPRAN Studies',
      'SAFOP Chairman/Leadership',
      'What-if/Checklist Analysis',
      'Vent Dispersion Analysis',
      'FMEA',
      'Fire and Explosion Studies',
      'Fire Investigation',
      'Qualitative Risk Assessment',
      'Event Tree Analysis — ETA',
      'Fault Tree Analysis — FTA',
      'EER/EESA Analysis',
      'RAMS',
      'Failure/Incident Investigation and root cause Analysis',
      'Hardware Barrier Assessment',
      'Risk Based Inspection Technical Audits',
      'Facility/Equipment Inspection',
    ],
  },
  {
    tag: 'WI·06',
    slug: 'well-integrity',
    title: 'Well Integrity Management',
    lede: 'Watch the barriers. Act before the second one fails.',
    body: [
      'Industry research indicates that a large number of wells are affected by integrity problems. The severity and frequency of well integrity problems strongly depends on the region, the fluids handled and age in the wells.',
      'This may not necessarily affect the integrity of the well, but the operator has to monitor the well’s condition very closely and act quickly if a further fault is detected.',
      'We assist our clients to safely and sustainably find, drill, complete and produce oil and gas fields efficiently and cost effectively.',
    ],
    services: [],
    figure: { value: '38%', label: 'of oil and gas wells are operated in harsher environments, globally' },
  },
  {
    tag: 'FD·07',
    slug: 'field-development',
    title: 'Field Development & Optimization',
    lede: 'Rigorous concept ranking before a single line is drawn.',
    body: [
      'Panintel Projects provides an integrated and wholistic approach to field development planning and optimisation.',
      'Our consultants have extensive experience working in different geographical locations with independent operators and engineering companies / consultancies, and understand the importance of the right concept definition on project economics, time to market and return on investment.',
      'We partner with our clients going through a rigorous concept ranking stage to arrive at the most suitable concept for the development.',
    ],
    services: [],
  },
]

/** slide 11 — Other Services */
export const OTHER_SERVICES = [
  'Surface Well Test / Early Production Facility',
  'Crude Dewatering Facilities',
  'Produced Water Treatment Facilities',
  'Crude Haulage and Produced Water Disposal Services',
  'Sand Management',
  'Haulage Services',
  'Equipment Leasing',
  'Procurement Management',
  'Reservoir Data Acquisition',
] as const

/**
 * The EPC lifecycle — a genuine sequence, which is why these are NUMBERED
 * while the pillars above are tagged.
 *
 * Every stage is evidenced in the profile. "Commissioning" is deliberately
 * absent: the profile never claims it, so the site does not either.
 */
export const LIFECYCLE = [
  { n: '01', title: 'Concept Screening, Selection & Definition', src: 'slide 7' },
  { n: '02', title: 'Front-End Engineering Design', src: 'slide 7' },
  { n: '03', title: 'Detailed Engineering Design', src: 'slide 7' },
  { n: '04', title: 'Procurement', src: 'slides 11, 15' },
  { n: '05', title: 'Construction & Installation', src: 'slide 15' },
  { n: '06', title: 'Operations & Maintenance', src: 'slide 6' },
  { n: '07', title: 'Integrity & Inspection', src: 'slides 8, 9' },
] as const

/**
 * slide 5 — equipment and marine assets. All specifications verbatim.
 * These are the most concrete claims on the site; do not round or embellish.
 */
export type Asset = {
  code: string
  name: string
  abbr: string
  class?: string
  specs: { k: string; v: string }[]
  media: string
}

export const ASSETS: Asset[] = [
  {
    code: 'A-01',
    abbr: 'FPSO',
    name: 'Floating Production, Storage and Offloading System',
    class: 'Mid sized',
    specs: [
      { k: 'Production', v: '15,000 – 30,000 BPD' },
      { k: 'Storage', v: '100,000 – 250,000 BBLS' },
    ],
    media: 'fpso',
  },
  {
    code: 'A-02',
    abbr: 'FSO',
    name: 'Floating, Storage and Offloading System',
    class: 'Mid sized',
    specs: [{ k: 'Storage', v: '80,000 – 350,000 BBLS' }],
    media: 'fso',
  },
  {
    code: 'A-03',
    abbr: 'MOPU',
    name: 'Mobile Offshore Production Unit',
    specs: [
      { k: 'Processing', v: '20,000 – 30,000 BPD' },
      { k: 'Wellhead', v: 'Integrated 10–12 slot facilities' },
      { k: 'Gas compression', v: '10 MMSCFD' },
      { k: 'Power', v: 'Gas fired generators' },
      { k: 'Water depth', v: '250 FT operations' },
      { k: 'Deck', v: '4 cranes, produced water systems' },
    ],
    media: 'mopu',
  },
  {
    code: 'A-04',
    abbr: 'EWT',
    name: 'Integrated Extended Well Test Units',
    class: 'Offshore / swamp / shallow water',
    specs: [
      { k: 'Storage', v: 'Integral 50,000 – 90,000 BBLS' },
      {
        k: 'Train',
        v: 'Test Separator, Choke Manifold, Line Heater, Production Separator, Gas Scrubber, Flare, Flow meters, Tank',
      },
    ],
    media: 'ewt',
  },
  {
    code: 'A-05',
    abbr: 'BARGE',
    name: 'Inland / Shallow Water Spud Barge',
    specs: [
      { k: 'Dimensions', v: '140 FT × 40 FT' },
      { k: 'Spuds', v: '40 FT' },
      { k: 'Fit-out', v: 'Crane, accommodation, maintenance cabin, storage cabin' },
      { k: 'Power', v: 'Gas fired generators, utilities' },
    ],
    media: 'barge',
  },
]

/** slide 12 — Health, Safety and Environment. Verbatim. */
export const HSE = {
  statement: 'Safety and operations integrity are the foundations of Panintel Projects’ business. Nothing is more important.',
  body: [
    'We hold our commitment to excellence in safety, security, and health in the workplace as a core value — one that shapes decision making at every level.',
    'This commitment is documented in our safety, health, and product safety policies and security expectations, which are implemented through our FRAMEWORK. Both contractors and employees are required to follow these expectations as a condition of engagement.',
    'We have deployed enhancements to our policies including expectations related to leadership, process safety, and assessment of our effectiveness.',
  ],
} as const

/**
 * slide 4 — company structure.
 *
 * NOTE: the org chart image in the source PDF is a borrowed graphic, still
 * watermarked "MCKIAN ENERGY SOLUTIONS LIMITED". Only the role structure is
 * reused here; the diagram is redrawn as Panintel's own.
 */
export const ORG = {
  lead: 'Managing Director',
  staff: 'Head QHSE',
  directors: [
    { title: 'Director', unit: 'Subsurface Services', reports: ['Project MGR (SS Services)', 'Project Engineers'] },
    { title: 'Director', unit: 'Well Services', reports: ['Project MGR (Well Services)', 'Project Engineers'] },
    { title: 'Director', unit: 'Engineering Design', reports: ['Project MGR (Engr. Design)', 'Project Engineers'] },
    { title: 'Director', unit: 'Drilling Services', reports: ['Project MGR (Drilling Services)', 'Project Engineers'] },
    { title: 'General Manager', unit: 'Shared Services', reports: ['Head (Finance)', 'Head (Supply Chain)', 'Head Admin/HR'] },
  ],
} as const

/** The seven sheets of the landing page. Drives the live title block. */
export const SHEETS = [
  { n: '01', id: 'cover', name: 'Cover' },
  { n: '02', id: 'position', name: 'Position' },
  { n: '03', id: 'capabilities', name: 'Capabilities' },
  { n: '04', id: 'lifecycle', name: 'Lifecycle' },
  { n: '05', id: 'assets', name: 'Assets' },
  { n: '06', id: 'hse', name: 'Safety' },
  { n: '07', id: 'contact', name: 'Contact' },
] as const

export const NAV = [
  { href: '/capabilities', label: 'Capabilities' },
  { href: '/assets', label: 'Assets' },
  { href: '/about', label: 'About' },
  { href: '/hse', label: 'HSE' },
  { href: '/contact', label: 'Contact' },
] as const
