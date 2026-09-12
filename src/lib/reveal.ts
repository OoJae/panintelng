import { reducedMotion } from './motion'

/**
 * Scroll reveals, without an animation library.
 *
 * This previously ran on GSAP + ScrollTrigger — 45 kB gzip to fade elements in
 * and draw one SVG. A single IntersectionObserver toggling a class, with the
 * transition declared in CSS, produces the identical result: same 0.8s
 * duration, same expo-out curve (--ease-out is cubic-bezier(0.16,1,0.3,1),
 * which is what GSAP's expo.out approximates), same 80ms sibling stagger.
 *
 * One observer serves every element on the page, and each target is
 * unobserved once it has fired — reveals happen once, as before.
 */

const STAGGER_MS = 80

let observer: IntersectionObserver | null = null

function seen(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries, io) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-in')
        io.unobserve(entry.target) // once, never again
      }
    },
    // Fire a little before the element is fully on screen, matching the old
    // ScrollTrigger start of "top 88%".
    { rootMargin: '0px 0px -12% 0px', threshold: 0 }
  )
  return observer
}

export function initReveals(scope: ParentNode = document) {
  const blocks = Array.from(scope.querySelectorAll<HTMLElement>('[data-reveal]'))
  if (!blocks.length) return

  if (reducedMotion()) {
    blocks.forEach((el) => el.classList.add('is-in'))
    return
  }

  // Siblings sharing a group stagger together, so a row of cards reads as one
  // gesture rather than six separate ones.
  const groups = new Map<string, HTMLElement[]>()
  for (const el of blocks) {
    const key = el.dataset.revealGroup
    if (key) groups.set(key, [...(groups.get(key) ?? []), el])
  }
  for (const members of groups.values()) {
    members.forEach((el, i) => el.style.setProperty('--reveal-delay', `${i * STAGGER_MS}ms`))
  }

  const io = seen()
  for (const el of blocks) {
    if (el.dataset.revealBound) continue
    el.dataset.revealBound = '1'
    io.observe(el)
  }
}

/**
 * The bow-tie draws itself: axis labels, then the boxes, then the lines, then
 * the ring, and the barriers land last because they are the point of the
 * drawing. Delays are written as custom properties so the transitions stay
 * declarative in CSS.
 */
export function initSchematic(scope: ParentNode = document) {
  for (const svg of scope.querySelectorAll<SVGSVGElement>('.bowtie')) {
    if (svg.dataset.bound) continue
    svg.dataset.bound = '1'

    if (reducedMotion()) {
      svg.classList.add('is-in')
      continue
    }

    // (selector, start delay in ms, per-sibling stagger) — mirrors the timeline
    // this replaced, so the sequence is unchanged.
    const schedule: [string, number, number][] = [
      ['.bt-axis', 0, 0],
      ['.bt-box, .bt-label', 50, 50],
      ['.bt-line', 200, 70],
      ['.bt-event-ring', 550, 0],
      ['.bt-event-label', 950, 0],
      ['.bt-barrier, .bt-barrier-label', 1050, 80],
    ]
    for (const [selector, start, stagger] of schedule) {
      svg.querySelectorAll<SVGElement>(selector).forEach((el, i) => {
        el.style.setProperty('--draw-delay', `${start + i * stagger}ms`)
      })
    }

    seen().observe(svg)
  }
}
