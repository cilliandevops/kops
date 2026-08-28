/** CiliKube theme packs — same idea as CiliTerm: semantic colors → CSS variables. */

export type ThemeColors = {
  bg: string
  bgPanel: string
  bgPanelSolid: string
  primary: string
  primaryDim: string
  secondary: string
  red: string
  green: string
  text: string
  textDim: string
  /**
   * Borders and fills default to a tint of `primary`, which reads as toy-like once the
   * accent is saturated. Neutral themes set these to grays so only interactive elements
   * carry color.
   */
  line?: string
  mist?: string
}

/** Colors for Logs <pre> and xterm.js (Exec / Attach). */
export type TerminalTheme = {
  bg: string
  fg: string
  cursor: string
  selection: string
}

export type Theme = {
  id: string
  name: string
  /** light | dark — for system/OS hints and terminal defaults */
  mode: 'dark' | 'light'
  colors: ThemeColors
  terminal: TerminalTheme
}

export const BUILTIN_THEMES: Theme[] = [
  {
    id: 'graphite',
    name: 'Graphite',
    mode: 'light',
    colors: {
      bg: '#f4f4f5',
      bgPanel: 'rgba(255, 255, 255, 0.98)',
      bgPanelSolid: '#ffffff',
      primary: '#2563eb',
      primaryDim: '#1e40af',
      secondary: '#b45309',
      red: '#dc2626',
      green: '#15803d',
      text: '#18181b',
      textDim: '#71717a',
      line: 'rgba(24, 24, 27, 0.12)',
      mist: 'rgba(24, 24, 27, 0.04)',
    },
    terminal: {
      bg: '#fafafa',
      fg: '#18181b',
      cursor: '#2563eb',
      selection: 'rgba(37, 99, 235, 0.22)',
    },
  },
  {
    id: 'carbon',
    name: 'Carbon',
    mode: 'dark',
    colors: {
      bg: '#131316',
      bgPanel: 'rgba(31, 31, 36, 0.96)',
      bgPanelSolid: '#1c1c20',
      primary: '#7ea8ff',
      primaryDim: '#4d78d8',
      secondary: '#e0a35c',
      red: '#f27272',
      green: '#5fcf94',
      text: '#ececf0',
      textDim: '#9c9caa',
      line: 'rgba(236, 236, 240, 0.14)',
      mist: 'rgba(236, 236, 240, 0.05)',
    },
    terminal: {
      bg: '#0f0f12',
      fg: '#ececf0',
      cursor: '#7ea8ff',
      selection: 'rgba(126, 168, 255, 0.26)',
    },
  },
  {
    id: 'tron',
    name: 'TRON',
    mode: 'dark',
    colors: {
      bg: '#020508',
      bgPanel: 'rgba(6, 16, 22, 0.9)',
      bgPanelSolid: '#061018',
      primary: '#2ef0ff',
      primaryDim: '#178a9c',
      secondary: '#ffb000',
      red: '#ff3d52',
      green: '#3dffb0',
      text: '#e8fbff',
      textDim: '#7aafbb',
    },
    terminal: {
      bg: '#040a0e',
      fg: '#cfeef5',
      cursor: '#35e6ff',
      selection: 'rgba(53,230,255,0.25)',
    },
  },
  {
    id: 'paper',
    name: 'Paper',
    mode: 'light',
    colors: {
      bg: '#ebe6da',
      bgPanel: 'rgba(255, 253, 248, 0.97)',
      bgPanelSolid: '#fffdf8',
      primary: '#065a74',
      primaryDim: '#2f6678',
      secondary: '#a03d0a',
      red: '#a82222',
      green: '#0f6b42',
      text: '#0b1218',
      textDim: '#3a4a54',
    },
    terminal: {
      bg: '#f7f3ea',
      fg: '#0b1218',
      cursor: '#065a74',
      selection: 'rgba(6,90,116,0.28)',
    },
  },
  {
    id: 'matrix',
    name: 'Matrix',
    mode: 'dark',
    colors: {
      bg: '#000400',
      bgPanel: 'rgba(2, 14, 6, 0.92)',
      bgPanelSolid: '#03140a',
      primary: '#2dff7a',
      primaryDim: '#1a7a3f',
      secondary: '#c8ff2e',
      red: '#ff4444',
      green: '#7affc0',
      text: '#d4ffe0',
      textDim: '#5a9a68',
    },
    terminal: {
      bg: '#000800',
      fg: '#b8ffcc',
      cursor: '#2dff7a',
      selection: 'rgba(45,255,122,0.28)',
    },
  },
  {
    id: 'amber',
    name: 'Amber',
    mode: 'dark',
    colors: {
      bg: '#080400',
      bgPanel: 'rgba(22, 14, 2, 0.92)',
      bgPanelSolid: '#120c02',
      primary: '#ffb400',
      primaryDim: '#9a6800',
      secondary: '#ff6a1a',
      red: '#ff4a2e',
      green: '#d4ef40',
      text: '#ffe29a',
      textDim: '#b88a30',
    },
    terminal: {
      bg: '#100800',
      fg: '#ffe29a',
      cursor: '#ffb400',
      selection: 'rgba(255,180,0,0.28)',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    mode: 'dark',
    colors: {
      bg: '#242933',
      bgPanel: 'rgba(46, 52, 64, 0.94)',
      bgPanelSolid: '#3b4252',
      primary: '#8fdbef',
      primaryDim: '#5e81ac',
      secondary: '#ebcb8b',
      red: '#bf616a',
      green: '#a3be8c',
      text: '#eceff4',
      textDim: '#9aa3b5',
    },
    terminal: {
      bg: '#2e3440',
      fg: '#eceff4',
      cursor: '#88c0d0',
      selection: 'rgba(136,192,208,0.3)',
    },
  },
  {
    id: 'sakura',
    name: 'Sakura',
    mode: 'light',
    colors: {
      bg: '#fff8f6',
      bgPanel: 'rgba(255, 253, 252, 0.97)',
      bgPanelSolid: '#fffdfc',
      primary: '#d4537e',
      primaryDim: '#a63d62',
      secondary: '#c4782a',
      red: '#c0392b',
      green: '#2d8a5f',
      text: '#2a1420',
      textDim: '#7a5360',
    },
    terminal: {
      bg: '#fff5f7',
      fg: '#2a1420',
      cursor: '#d4537e',
      selection: 'rgba(212,83,126,0.28)',
    },
  },
  {
    id: 'midnight-violet',
    name: 'Midnight Violet',
    mode: 'dark',
    colors: {
      bg: '#07040f',
      bgPanel: 'rgba(18, 8, 28, 0.94)',
      bgPanelSolid: '#12081c',
      primary: '#c084fc',
      primaryDim: '#7c3aed',
      secondary: '#f0abfc',
      red: '#f87171',
      green: '#6ee7b7',
      text: '#f3e8ff',
      textDim: '#a78bb8',
    },
    terminal: {
      bg: '#0c0614',
      fg: '#efe6ff',
      cursor: '#c084fc',
      selection: 'rgba(192,132,252,0.3)',
    },
  },
  {
    id: 'solarized',
    name: 'Solarized',
    mode: 'dark',
    colors: {
      bg: '#002b36',
      bgPanel: 'rgba(7, 54, 66, 0.94)',
      bgPanelSolid: '#073642',
      primary: '#268bd2',
      primaryDim: '#1a6a9e',
      secondary: '#b58900',
      red: '#dc322f',
      green: '#859900',
      text: '#fdf6e3',
      textDim: '#93a1a1',
    },
    terminal: {
      bg: '#002b36',
      fg: '#eee8d5',
      cursor: '#268bd2',
      selection: 'rgba(38,139,210,0.32)',
    },
  },
]

export const DEFAULT_THEME_ID = 'paper'
export const THEME_STORAGE_KEY = 'cilikube_theme'

export function hexToRgba(hex: string, alpha: number): string {
  let m = hex.replace('#', '').trim()
  if (m.length === 3) m = [...m].map((c) => c + c).join('')
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function resolveTheme(id?: string | null): Theme {
  return (
    BUILTIN_THEMES.find((t) => t.id === id) ||
    BUILTIN_THEMES.find((t) => t.id === DEFAULT_THEME_ID) ||
    BUILTIN_THEMES[0]
  )
}

/** Map our terminal pack into xterm.js `ITheme`. */
export function toXtermTheme(term: TerminalTheme): {
  background: string
  foreground: string
  cursor: string
  selectionBackground: string
} {
  return {
    background: term.bg,
    foreground: term.fg,
    cursor: term.cursor,
    selectionBackground: term.selection,
  }
}

/** Apply theme colors to :root (Tailwind @theme + custom HUD classes). */
export function applyTheme(theme: Theme): void {
  const c = theme.colors
  const t = theme.terminal
  const root = document.documentElement
  const set = (k: string, v: string) => root.style.setProperty(k, v)

  root.dataset.theme = theme.id
  root.dataset.themeMode = theme.mode
  // Neutral themes drop the HUD decoration (corner brackets, accent inset, bloom);
  // the expressive themes keep it as their identity.
  if (c.line) {
    root.dataset.themeNeutral = '1'
  } else {
    delete root.dataset.themeNeutral
  }
  // Keep native <textarea>/<input> chrome aligned with theme (esp. OS dark + light UI).
  root.style.colorScheme = theme.mode

  set('--color-bg', c.bg)
  set('--color-panel', c.bgPanel)
  set('--color-panel-solid', c.bgPanelSolid)
  const light = theme.mode === 'light'
  set('--color-line', c.line ?? hexToRgba(c.primary, light ? 0.38 : 0.26))
  set('--color-cyan', c.primary)
  set('--color-cyan-dim', c.primaryDim)
  set('--color-cyan-faint', hexToRgba(c.primary, light ? 0.2 : 0.18))
  set('--color-orange', c.secondary)
  set('--color-text', c.text)
  set('--color-text-dim', c.textDim)
  set('--color-ok', c.green)
  set('--color-warn', c.secondary)
  set('--color-danger', c.red)
  set('--color-accent', c.primary)
  set('--color-accent-bright', c.primary)
  set('--color-signal', c.secondary)
  set('--color-ink', c.text)
  set('--color-ink-soft', c.textDim)
  set('--color-mist', c.mist ?? hexToRgba(c.primary, light ? 0.11 : 0.09))
  set('--color-ambient', c.mist ?? hexToRgba(c.primary, light ? 0.14 : 0.1))
  // Neutral themes drop the graph-paper overlay; panels on a gray field carry the depth.
  set('--color-grid-line', c.line ? 'transparent' : hexToRgba(c.primary, light ? 0.12 : 0.08))
  set('--color-selection', hexToRgba(c.primary, light ? 0.26 : 0.32))
  // Neutral themes opt out of the accent bloom entirely; it is the loudest decorative tell.
  set('--color-glow', c.line ? 'transparent' : hexToRgba(c.primary, light ? 0.14 : 0.4))
  set('--color-scroll-thumb', c.line ?? hexToRgba(c.primary, light ? 0.5 : 0.45))
  set('--color-scroll-track', hexToRgba(c.bgPanelSolid, light ? 0.85 : 0.55))

  set('--color-term-bg', t.bg)
  set('--color-term-fg', t.fg)
  set('--color-term-cursor', t.cursor)
  set('--color-term-selection', t.selection)
}

const listeners = new Set<() => void>()

export function getStoredThemeId(): string {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID
  } catch {
    return DEFAULT_THEME_ID
  }
}

export function setThemeId(id: string): void {
  const theme = resolveTheme(id)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id)
  } catch {
    /* ignore */
  }
  applyTheme(theme)
  listeners.forEach((l) => l())
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function initTheme(): Theme {
  const theme = resolveTheme(getStoredThemeId())
  applyTheme(theme)
  return theme
}
