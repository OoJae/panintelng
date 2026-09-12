/**
 * Technical schematics, hand-authored.
 *
 * These are not decoration. The bow-tie is the standard diagram of process
 * safety: threats on the left, consequences on the right, the top event in the
 * middle, and barriers on every line between them. The barriers named here are
 * services Panintel actually lists (RBI, EER/EESA, fire and explosion studies),
 * so the drawing states the offer rather than illustrating it.
 *
 * `pathLength="1"` normalises every line so one stroke-draw tween covers all
 * of them regardless of their real length.
 */

type Node = { label: string; y: number }

const THREATS: Node[] = [
  { label: 'Corrosion', y: 40 },
  { label: 'Overpressure', y: 135 },
  { label: 'Ignition source', y: 230 },
]
const CONSEQUENCES: Node[] = [
  { label: 'Fire / explosion', y: 40 },
  { label: 'Release', y: 135 },
  { label: 'Production loss', y: 230 },
]
const PREVENT = ['Risk-based inspection', 'Relief & vent systems', 'Area classification']
const MITIGATE = ['Fire & gas detection', 'EER / EESA', 'Containment']

// Tighter frame so the type inside stays legible once the SVG is scaled down
// into a five-column lane. PAD leaves room for the barrier labels.
const W = 460
const H = 300
const PAD = 16
const CX = W / 2
const CY = H / 2
const R = 40
const BOX_W = 104
const BOX_H = 30

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

function side(nodes: Node[], barriers: string[], right: boolean) {
  const boxX = right ? W - BOX_W : 0
  // Where the line leaves the box, and which way it then travels to the centre.
  const anchorX = right ? W - BOX_W : BOX_W
  const travel = right ? -1 : 1

  return nodes
    .map((n, i) => {
      const y = n.y + BOX_H / 2
      const tx = CX - travel * R * 0.86      // meets the rim on the near side
      const ty = CY + (y - CY) * 0.26
      const d = `M ${anchorX} ${y} C ${anchorX + travel * 56} ${y}, ${tx - travel * 46} ${ty}, ${tx} ${ty}`

      // The barrier is drawn across the line, clear of the box.
      const bx = anchorX + travel * 46
      const by = y + (ty - y) * 0.2
      const label = barriers[i] ?? ''
      return `
    <g class="bt-branch">
      <rect class="bt-box" x="${boxX}" y="${n.y}" width="${BOX_W}" height="${BOX_H}" rx="1"/>
      <text class="bt-label" x="${boxX + BOX_W / 2}" y="${y + 4}" text-anchor="middle">${esc(n.label)}</text>
      <path class="bt-line" d="${d}" pathLength="1" fill="none"/>
      <rect class="bt-barrier" x="${bx - 2.5}" y="${by - 13}" width="5" height="26" rx="1"/>
      <text class="bt-barrier-label" x="${bx}" y="${by - 19}" text-anchor="middle">${esc(label)}</text>
    </g>`
    })
    .join('')
}

export function bowTie(): string {
  return `
<svg class="bowtie" viewBox="${-PAD} ${-PAD} ${W + PAD * 2} ${H + PAD * 2}" role="img" aria-labelledby="bt-title bt-desc">
  <title id="bt-title">Bow-tie risk diagram</title>
  <desc id="bt-desc">Threats on the left and consequences on the right of a central loss-of-containment event, with a named barrier on every path between them.</desc>
  ${side(THREATS, PREVENT, false)}
  ${side(CONSEQUENCES, MITIGATE, true)}
  <g class="bt-event">
    <circle class="bt-event-ring" cx="${CX}" cy="${CY}" r="${R}" pathLength="1" fill="none"/>
    <text class="bt-event-label" x="${CX}" y="${CY - 4}" text-anchor="middle">Loss of</text>
    <text class="bt-event-label" x="${CX}" y="${CY + 12}" text-anchor="middle">containment</text>
  </g>
  <text class="bt-axis" x="0" y="${H + 6}">Threats</text>
  <text class="bt-axis" x="${CX}" y="${H + 6}" text-anchor="middle">Top event</text>
  <text class="bt-axis" x="${W}" y="${H + 6}" text-anchor="end">Consequences</text>
</svg>`
}
