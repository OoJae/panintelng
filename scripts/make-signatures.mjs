/**
 * Builds the email signature blocks.
 *
 * Written for email clients, not browsers: tables for layout, inline styles
 * only, absolute image URLs, no flexbox, no grid, no <style> block — Outlook
 * strips or ignores all of those. Widths are set in both the attribute and the
 * style so Outlook and everything else agree.
 *
 * The logo is a transparent PNG in the brand's grey-and-amber treatment, so it
 * sits on whatever ground the client provides and reads in both light and dark
 * mode. Text colour is left near-black and unbackgrounded, which is what
 * dark-mode clients invert cleanly.
 *
 * Image dimensions are read from the PNG rather than hardcoded — they changed
 * once already when the logo treatment changed, and a stale width silently
 * distorts the logo in every signature.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { CONTACT, COMPANY } from '../src/content/company.ts'

const SITE = 'https://www.panintelng.com'

// The logo is served with a six-month cache, so changing it while keeping the
// same URL leaves every browser and mail client showing the old file — and if
// the dimensions changed too, squeezing the stale image into the new box
// visibly distorts it. A content hash makes a changed logo a changed URL.
const LOGO_PATH = 'public/brand/logo-email.png'
const LOGO_HASH = createHash('sha256').update(readFileSync(LOGO_PATH)).digest('hex').slice(0, 8)
const LOGO = `${SITE}/brand/logo-email.png?v=${LOGO_HASH}`

/** Width and height from the PNG's IHDR chunk, halved for the 2x source. */
function logoSize(path, scale = 2) {
  const b = readFileSync(path)
  return { w: Math.round(b.readUInt32BE(16) / scale), h: Math.round(b.readUInt32BE(20) / scale) }
}
const LOGO_SIZE = logoSize(LOGO_PATH)
const INK = '#14120F'
const MUTED = '#57524B'
const AMBER = '#845A00'          // the darker amber: 6.1:1 on white
const RULE = '#DDD8D0'

const office = CONTACT.offices[0]
const ADDRESS = office.lines.join(', ')

const row = (label, value, href) => `
              <tr>
                <td style="padding:0 10px 3px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${AMBER};white-space:nowrap;vertical-align:top;">${label}</td>
                <td style="padding:0 0 3px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:${INK};vertical-align:top;">${
                  href ? `<a href="${href}" style="color:${INK};text-decoration:none;">${value}</a>` : value
                }</td>
              </tr>`

function signature({ name, title, email, phones }) {
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
  <tr>
    <td style="padding:0 20px 0 0;vertical-align:top;">
      <a href="${SITE}" style="text-decoration:none;">
        <img src="${LOGO}" alt="${COMPANY.name}" width="${LOGO_SIZE.w}" height="${LOGO_SIZE.h}"
             style="display:block;width:${LOGO_SIZE.w}px;height:${LOGO_SIZE.h}px;border:0;outline:none;" />
      </a>
    </td>
    <td style="padding:0;vertical-align:top;border-left:3px solid #FFC000;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
        <tr>
          <td style="padding:0 0 0 20px;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;font-weight:bold;color:${INK};">${name}</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:${MUTED};padding-top:2px;">${title}</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:${INK};padding-top:6px;font-weight:bold;">${COMPANY.name}</div>
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;padding-top:10px;margin-top:10px;">
              ${phones.map((p, i) => row(i === 0 ? 'Tel' : '&nbsp;', p, `tel:${p.replace(/\s/g, '')}`)).join('')}
              ${row('Email', email, `mailto:${email}`)}
              ${row('Web', 'www.panintelng.com', SITE)}
              ${row('Address', ADDRESS, null)}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding:14px 0 0 0;">
      <div style="border-top:1px solid ${RULE};padding-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;color:${MUTED};">
        Engineering, procurement, construction and project management for oil, gas and power.
      </div>
    </td>
  </tr>
</table>`
}

const plain = ({ name, title, email, phones }) =>
  `${name}
${title}
${COMPANY.name}

Tel      ${phones.join('  /  ')}
Email    ${email}
Web      www.panintelng.com
Address  ${ADDRESS}

Engineering, procurement, construction and project management for oil, gas and power.
`

const BLOCKS = [
  {
    file: 'technical',
    name: 'Technical Team',
    title: 'Engineering &amp; Project Enquiries',
    email: 'technical@panintelng.com',
    phones: CONTACT.phones,
  },
  {
    file: 'lucky',
    name: 'Lucky Ozoma',
    title: 'Managing Director',
    email: 'lucky@panintelng.com',
    phones: CONTACT.phones,
  },
]

mkdirSync('email-signatures', { recursive: true })
for (const b of BLOCKS) {
  writeFileSync(`email-signatures/${b.file}.html`, signature(b))
  writeFileSync(`email-signatures/${b.file}.txt`, plain({ ...b, title: b.title.replace(/&amp;/g, '&') }))
  console.log(`  email-signatures/${b.file}.html + .txt`)
}
