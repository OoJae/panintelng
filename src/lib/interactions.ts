/**
 * Navigation behaviour.
 *
 * Over a full-bleed hero the bar starts transparent with white marks, then
 * turns solid once the hero has passed — the pattern both reference sites use.
 */
export function initNav() {
  const nav = document.querySelector<HTMLElement>('[data-nav]')
  const burger = document.querySelector<HTMLButtonElement>('.nav__burger')
  const menu = document.querySelector<HTMLElement>('[data-menu]')
  if (!nav) return

  const overHero = document.body.hasAttribute('data-hero')
  const threshold = () => {
    const hero = document.querySelector<HTMLElement>('.hero, .pagehero')
    return hero ? Math.max(hero.offsetHeight - nav.offsetHeight - 40, 40) : 40
  }

  let menuOpen = false

  const sync = () => {
    // While the menu is open the bar must always be solid, whatever the scroll.
    nav.classList.toggle('nav--over', overHero && !menuOpen && window.scrollY < threshold())
  }
  sync()
  window.addEventListener('scroll', sync, { passive: true })
  window.addEventListener('resize', sync, { passive: true })

  if (!burger || !menu) return

  const setOpen = (open: boolean) => {
    menuOpen = open
    burger.setAttribute('aria-expanded', String(open))
    menu.dataset.open = String(open)
    document.body.style.overflow = open ? 'hidden' : ''
    sync()
  }

  burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'))
  menu.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) setOpen(false) })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) { setOpen(false); burger.focus() }
  })
  // Resizing past the breakpoint leaves the panel stranded otherwise.
  window.addEventListener('resize', () => { if (menuOpen && window.innerWidth > 960) setOpen(false) })
}

/** Marks the current page in the nav so the amber rule sits under it. */
export function markCurrentPage() {
  const here = location.pathname.replace(/index\.html$/, '') || '/'
  document.querySelectorAll<HTMLAnchorElement>('.nav__link').forEach((a) => {
    if (new URL(a.href).pathname === here) a.setAttribute('aria-current', 'page')
  })
}

/** Footer copyright year, so it never goes stale. */
export function setYear() {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear())
  })
}
