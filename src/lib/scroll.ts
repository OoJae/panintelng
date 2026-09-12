import Lenis from 'lenis'
import { reducedMotion } from './motion'

/**
 * Smooth scroll.
 *
 * Lenis stays — at 5 kB gzip it *is* the smooth feel, and removing it would
 * change how the site behaves under the hand. What went is the GSAP ticker that
 * used to drive it: a plain requestAnimationFrame loop does the same job.
 */

/** Offset a target so it clears the fixed navigation bar. */
function navOffset(): number {
  const nav = document.querySelector<HTMLElement>('[data-nav]')
  return -((nav?.offsetHeight ?? 76) + 16)
}

/**
 * Landing on a deep link (`/capabilities#technical-safety`) — the browser makes
 * its own jump to the anchor, but Lenis starts from the real scroll position and
 * the jump is lost. Redo it once layout settles, then again when images and
 * webfonts have changed the document height.
 */
function honourHashOnLoad(lenis: Lenis) {
  const id = location.hash.slice(1)
  if (!id) return
  const target = document.getElementById(id)
  if (!target) return

  const go = () => lenis.scrollTo(target, { offset: navOffset(), immediate: true })
  go()
  requestAnimationFrame(go)
  document.fonts?.ready.then(() => requestAnimationFrame(go))
  window.addEventListener('load', () => requestAnimationFrame(go), { once: true })
}

export function initScroll(): Lenis | null {
  if (reducedMotion()) {
    // Native scrolling only — the browser's own anchor jump and CSS
    // scroll-margin-top handle deep links correctly here.
    return null
  }

  const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.6 })

  const raf = (time: number) => {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)

  // In-page anchors go through Lenis so they ease rather than jump.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!
      const target = id.length > 1 ? document.querySelector(id) : null
      if (!target) return
      e.preventDefault()
      history.pushState(null, '', id)
      lenis.scrollTo(target as HTMLElement, { offset: navOffset(), duration: 1.15 })
    })
  })

  honourHashOnLoad(lenis)
  window.addEventListener('hashchange', () => honourHashOnLoad(lenis))

  if (import.meta.env.DEV) (window as unknown as { __lenis?: Lenis }).__lenis = lenis

  return lenis
}
