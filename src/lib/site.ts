import { initNav, markCurrentPage, setYear } from './interactions'
import { initScroll } from './scroll'
import { initReveals, initSchematic } from './reveal'
import { initForm } from './form'

/**
 * Boot shared by every page. Adds `.js` first so the CSS knows it may hide
 * things for animation — without it the page renders fully, statically legible.
 */
export function bootSite() {
  document.documentElement.classList.add('js')
  markCurrentPage()
  setYear()
  initNav()
  initScroll()
  initReveals()
  initSchematic()
  initForm()
}
