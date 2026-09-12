import { ORG } from '../content/company'

/**
 * Company structure, redrawn.
 *
 * The chart on slide 4 of the profile is a borrowed graphic — it is still
 * watermarked "MCKIAN ENERGY SOLUTIONS LIMITED". Only the role structure is
 * reused here; every line and box below is Panintel's own.
 */

const W = 940
const BOX_W = 168
const BOX_H = 40
const GAP = (W - 5 * BOX_W) / 4
const COL = BOX_W + GAP
const ROW_Y = [0, 112, 196, 280, 364]
const BUS_Y = 86

const colX = (i: number) => i * COL
const mid = (i: number) => colX(i) + BOX_W / 2
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

function box(x: number, y: number, label: string, kind = '') {
  // Two lines when a role carries a unit name in brackets.
  const m = label.match(/^(.*?)\s*\((.*)\)$/)
  const cx = x + BOX_W / 2
  const text = m
    ? `<text class="oc-t" x="${cx}" y="${y + 17}" text-anchor="middle">${esc(m[1]!)}</text>
       <text class="oc-t oc-t--sub" x="${cx}" y="${y + 30}" text-anchor="middle">${esc(m[2]!)}</text>`
    : `<text class="oc-t" x="${cx}" y="${y + 24}" text-anchor="middle">${esc(label)}</text>`
  return `<g class="oc-node${kind}"><rect class="oc-box" x="${x}" y="${y}" width="${BOX_W}" height="${BOX_H}" rx="1"/>${text}</g>`
}

export function orgChart(): string {
  const units = ORG.directors
  const H = ROW_Y[4]! + BOX_H + 8

  const lines: string[] = []
  // Managing Director down to the distribution bus, and the bus itself.
  lines.push(`<path class="oc-line" d="M ${mid(2)} ${BOX_H} V ${BUS_Y}"/>`)
  lines.push(`<path class="oc-line" d="M ${mid(0)} ${BUS_Y} H ${mid(4)}"/>`)
  units.forEach((_, i) => lines.push(`<path class="oc-line" d="M ${mid(i)} ${BUS_Y} V ${ROW_Y[1]!}"/>`))

  const nodes: string[] = [box(colX(2), ROW_Y[0]!, ORG.lead, ' oc-node--lead')]

  // QHSE reports to the MD directly and sits off the line — a staff function,
  // which is exactly how the profile draws it.
  nodes.push(box(colX(4), ROW_Y[0]!, ORG.staff, ' oc-node--staff'))
  lines.push(`<path class="oc-line oc-line--staff" d="M ${colX(2) + BOX_W} ${BOX_H / 2} H ${colX(4)}"/>`)

  units.forEach((u, i) => {
    nodes.push(box(colX(i), ROW_Y[1]!, `${u.title} (${u.unit})`))
    u.reports.forEach((r, j) => {
      const y = ROW_Y[2 + j]
      if (y === undefined) return
      nodes.push(box(colX(i), y, r))
      lines.push(`<path class="oc-line" d="M ${mid(i)} ${ROW_Y[1 + j]! + BOX_H} V ${y}"/>`)
    })
  })

  return `
<svg class="orgchart" viewBox="-2 -2 ${W + 4} ${H + 4}" role="img" aria-labelledby="oc-title oc-desc">
  <title id="oc-title">Panintel company structure</title>
  <desc id="oc-desc">The Managing Director leads five units — Subsurface Services, Well Services, Engineering Design, Drilling Services and Shared Services — each with a project manager and project engineers beneath. Head QHSE reports directly to the Managing Director as a staff function.</desc>
  <g>${lines.join('')}</g>
  <g>${nodes.join('')}</g>
</svg>`
}
