/** UI font packs — sans UI + Maple mono for code by default; all-mono packs opt-in. */

export type FontPack = {
  id: string
  name: string
  display: string
  sans: string
  mono: string
  /** When true, load self-hosted cn-font-split CSS (subset woff2 chunks). */
  cjk: boolean
}

/*
 * Nothing curated: no system-ui stack, no explicit CJK list. The generic families
 * resolve to whatever the browser is configured to use, and browsers already fall back
 * per character for glyphs the chosen face lacks, so naming CJK faces only overrides a
 * choice the user has already made.
 */
const BROWSER_SANS = 'sans-serif'
const BROWSER_MONO = 'ui-monospace, monospace'

/** Maple Mono ships Latin only; CJK falls through to the browser's own monospace. */
const MAPLE = `"Maple Mono", ${BROWSER_MONO}`
const MAPLE_CN = `"Maple Mono CN", "Maple Mono", ${BROWSER_MONO}`

export const FONT_PACKS: FontPack[] = [
  {
    id: 'sans',
    name: 'Browser default + Maple Mono',
    display: BROWSER_SANS,
    sans: BROWSER_SANS,
    mono: MAPLE,
    cjk: false,
  },
  {
    id: 'maple-cn',
    name: 'Maple Mono CN (all)',
    display: MAPLE_CN,
    sans: MAPLE_CN,
    mono: MAPLE_CN,
    cjk: true,
  },
]

export const DEFAULT_FONT_ID = 'sans'
export const FONT_STORAGE_KEY = 'cilikube_font'

const MAPLE_CN_CSS_ID = 'maple-cn-split'
const MAPLE_CN_CSS_HREF = '/fonts/maple-cn-split/result.css'

const listeners = new Set<() => void>()
let mapleCnLoading: Promise<void> | null = null

/** Self-hosted cn-font-split subsets (same origin — best for CN networks). */
export function ensureMapleCnCss(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()
  if (document.getElementById(MAPLE_CN_CSS_ID)) return Promise.resolve()
  if (mapleCnLoading) return mapleCnLoading
  mapleCnLoading = new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.id = MAPLE_CN_CSS_ID
    link.rel = 'stylesheet'
    link.href = MAPLE_CN_CSS_HREF
    link.onload = () => resolve()
    link.onerror = () => {
      mapleCnLoading = null
      reject(new Error('Failed to load Maple Mono CN'))
    }
    document.head.appendChild(link)
  })
  return mapleCnLoading
}

export function resolveFont(id?: string | null): FontPack {
  // The Latin-only all-mono pack was dropped as redundant: it differed from maple-cn
  // only in where CJK glyphs came from. Keep such users on an all-mono UI rather than
  // resetting them to sans — cn-font-split serves per-unicode-range chunks, so this
  // only pulls the subsets actually rendered.
  if (id === 'maple') return FONT_PACKS.find((f) => f.id === 'maple-cn') || FONT_PACKS[0]
  // Migrate removed / legacy ids → default pack
  if (id === 'jetbrains' || id === 'hud') return FONT_PACKS[0]
  return FONT_PACKS.find((f) => f.id === id) || FONT_PACKS[0]
}

export function applyFont(pack: FontPack): void {
  const root = document.documentElement
  root.dataset.font = pack.id
  if (pack.cjk) {
    root.dataset.fontCjk = '1'
    void ensureMapleCnCss().catch(() => {
      /* keep system CJK fallback */
    })
  } else {
    delete root.dataset.fontCjk
  }
  root.style.setProperty('--font-display', pack.display)
  root.style.setProperty('--font-sans', pack.sans)
  root.style.setProperty('--font-mono', pack.mono)
  /*
   * The wordmark follows the pack rather than having a face of its own, so an all-mono
   * pack really is all-mono. This used to be pinned to "Geist Sans", which the app never
   * loads a @font-face for, leaving the wordmark to render in the first installed CJK
   * face's Latin glyphs.
   */
  root.style.setProperty('--font-brand', pack.display)
}

export function getStoredFontId(): string {
  try {
    const raw = localStorage.getItem(FONT_STORAGE_KEY)
    return resolveFont(raw).id
  } catch {
    return DEFAULT_FONT_ID
  }
}

export function setFontId(id: string): void {
  const pack = resolveFont(id)
  try {
    localStorage.setItem(FONT_STORAGE_KEY, pack.id)
  } catch {
    /* ignore */
  }
  applyFont(pack)
  listeners.forEach((l) => l())
}

export function subscribeFont(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function initFont(): FontPack {
  const pack = resolveFont(getStoredFontId())
  applyFont(pack)
  return pack
}
