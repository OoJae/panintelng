/** Single source of truth for whether this visit gets motion. */
export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
