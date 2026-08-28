import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  Languages,
  LayoutList,
  LogOut,
  Palette,
  Settings,
  Type,
  UserRound,
} from 'lucide-react'
import { useAuth } from '@/store/auth'
import { NavCustomizer } from './NavCustomizer'
import type { NavGroup } from '@/nav/definitions'
import type { NavPrefs } from '@/nav/prefs'
import { useTheme } from '@/theme/useTheme'
import { useFont } from '@/theme/useFont'
import { switchTheme } from '@/theme/switchTheme'
import { setStoredLang, type AppLang } from '@/i18n'
import { cn } from '@/lib/utils'

const MENU_MIN_W = 220

export function UserMenu({
  primaryRole,
  isViewerOnly,
  navGroups,
  navPrefs,
}: {
  primaryRole: string
  isViewerOnly: boolean
  /** Menus this user may see, for the sidebar customizer. */
  navGroups: NavGroup[]
  navPrefs: NavPrefs
}) {
  const { t, i18n } = useTranslation()
  const { user, logout, isAdmin } = useAuth()
  const { themeId, themes } = useTheme()
  const { fontId, fonts, setFont } = useFont()
  const [open, setOpen] = useState(false)
  const [navCustomizerOpen, setNavCustomizerOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; maxHeight: number } | null>(
    null,
  )
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePos = () => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const menuW = Math.min(MENU_MIN_W, window.innerWidth - 16)
    const gap = 6
    const estimatedH = Math.min(28 * 16, window.innerHeight * 0.7)
    const spaceBelow = window.innerHeight - rect.bottom - gap - 8
    const placeBelow = spaceBelow >= Math.min(estimatedH, 220) || spaceBelow >= rect.top
    const maxHeight = Math.max(160, placeBelow ? spaceBelow : rect.top - gap - 8)
    const left = Math.min(Math.max(8, rect.right - menuW), window.innerWidth - menuW - 8)
    const top = placeBelow
      ? rect.bottom + gap
      : Math.max(8, rect.top - gap - Math.min(estimatedH, maxHeight))
    setMenuPos({ top, left, maxHeight })
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null)
      return
    }
    updatePos()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onReposition = () => updatePos()
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onReposition)
    document.addEventListener('scroll', onReposition, true)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onReposition)
      document.removeEventListener('scroll', onReposition, true)
    }
  }, [open])

  const roleTone =
    primaryRole === 'admin'
      ? 'text-orange'
      : primaryRole === 'editor'
        ? 'text-cyan'
        : 'text-text-dim'

  const currentLang: AppLang = i18n.language?.startsWith('zh') ? 'zh' : 'en'

  const setLang = (lang: AppLang) => {
    void i18n.changeLanguage(lang)
    setStoredLang(lang)
  }

  const menuStyle: CSSProperties | undefined = menuPos
    ? {
        position: 'fixed',
        top: menuPos.top,
        left: menuPos.left,
        zIndex: 'var(--z-user-menu)',
        width: Math.min(MENU_MIN_W, window.innerWidth - 16),
        maxHeight: Math.min(menuPos.maxHeight, 28 * 16),
      }
    : undefined

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        className="flex h-9 items-center gap-1.5 rounded border border-transparent px-1.5 text-xs text-text-dim transition hover:border-line hover:bg-mist hover:text-text sm:h-auto sm:gap-2 sm:px-2 sm:py-1"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user?.username || 'operator'}
        onClick={() => setOpen((v) => !v)}
      >
        <UserRound className="h-4 w-4 shrink-0 text-cyan sm:hidden" />
        <span className="hidden max-w-[8rem] truncate text-text sm:inline">
          {user?.username || 'operator'}
        </span>
        {isViewerOnly ? (
          <span className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] tracking-wider uppercase md:inline">
            {t('common.readOnly')}
          </span>
        ) : null}
        <ChevronDown className={cn('h-3.5 w-3.5 transition', open && 'rotate-180 text-cyan')} />
      </button>

      {open && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={menuStyle}
              className="overflow-y-auto overscroll-contain rounded border border-line bg-panel-solid py-1 shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
            >
              <div className="border-b border-line px-3 py-2 sm:hidden">
                <div className="truncate text-[12px] font-semibold text-text">
                  {user?.username || 'operator'}
                </div>
                <div className={cn('mt-0.5 text-[11px] uppercase tracking-wider', roleTone)}>
                  {primaryRole}
                  {isViewerOnly ? ` · ${t('common.readOnly')}` : ''}
                </div>
              </div>
              <Link
                role="menuitem"
                to="/profile"
                className="flex min-h-11 items-center gap-2 px-3 py-2.5 text-[13px] text-text hover:bg-mist sm:min-h-0 sm:py-2 sm:text-[12px]"
                onClick={() => setOpen(false)}
              >
                <UserRound className="h-3.5 w-3.5 text-cyan" />
                {t('nav.profile')}
              </Link>
              <button
                type="button"
                role="menuitem"
                className="flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-text hover:bg-mist sm:min-h-0 sm:py-2 sm:text-[12px]"
                onClick={() => {
                  setOpen(false)
                  setNavCustomizerOpen(true)
                }}
              >
                <LayoutList className="h-3.5 w-3.5 text-cyan" />
                {t('navCustomizer.title')}
              </button>
              {isAdmin ? (
                <Link
                  role="menuitem"
                  to="/admin/settings"
                  className="flex min-h-11 items-center gap-2 px-3 py-2.5 text-[13px] text-text hover:bg-mist sm:min-h-0 sm:py-2 sm:text-[12px]"
                  onClick={() => setOpen(false)}
                >
                  <Settings className="h-3.5 w-3.5 text-cyan" />
                  {t('nav.settings')}
                </Link>
              ) : null}

              <div className="my-1 border-t border-line" />
              <div className="flex items-center gap-2 px-3 pt-2 text-[10px] tracking-[0.14em] text-text-dim uppercase">
                <Languages className="h-3 w-3 text-cyan" />
                {t('common.language')}
              </div>
              <div
                className="flex flex-col gap-0.5 px-2 pb-2 pt-1"
                role="group"
                aria-label={t('common.language')}
              >
                {(
                  [
                    { id: 'zh' as AppLang, label: t('common.chinese') },
                    { id: 'en' as AppLang, label: t('common.english') },
                  ] as const
                ).map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={currentLang === lang.id}
                    className={cn(
                      'min-h-10 rounded px-2 py-2 text-left text-[13px] transition sm:min-h-0 sm:py-1.5 sm:text-[12px]',
                      currentLang === lang.id
                        ? 'bg-mist text-cyan'
                        : 'text-text hover:bg-mist hover:text-text',
                    )}
                    onClick={() => setLang(lang.id)}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <div className="my-1 border-t border-line" />
              <div className="flex items-center gap-2 px-3 pt-2 text-[10px] tracking-[0.14em] text-text-dim uppercase">
                <Palette className="h-3 w-3 text-cyan" />
                {t('userMenu.theme')}
              </div>
              <div className="theme-swatches" role="group" aria-label={t('userMenu.theme')}>
                {themes.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    title={`${th.name} (${th.mode})`}
                    aria-label={th.name}
                    aria-pressed={themeId === th.id}
                    className={cn('theme-swatch', themeId === th.id && 'active')}
                    style={
                      {
                        '--swatch-bg': th.colors.bg,
                        '--swatch-accent': th.colors.primary,
                      } as CSSProperties
                    }
                    onClick={() => switchTheme(th.id)}
                  />
                ))}
              </div>

              <div className="my-1 border-t border-line" />
              <div className="flex items-center gap-2 px-3 pt-2 text-[10px] tracking-[0.14em] text-text-dim uppercase">
                <Type className="h-3 w-3 text-cyan" />
                {t('userMenu.font')}
              </div>
              <div className="flex flex-col gap-0.5 px-2 pb-2 pt-1">
                {fonts.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={fontId === f.id}
                    className={cn(
                      'min-h-10 rounded px-2 py-2 text-left text-[13px] transition sm:min-h-0 sm:py-1.5 sm:text-[12px]',
                      fontId === f.id
                        ? 'bg-mist text-cyan'
                        : 'text-text hover:bg-mist hover:text-text',
                    )}
                    style={{ fontFamily: f.sans }}
                    onClick={() => setFont(f.id)}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              <div className="my-1 border-t border-line" />
              <button
                type="button"
                role="menuitem"
                className="flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-danger hover:bg-mist sm:min-h-0 sm:py-2 sm:text-[12px]"
                onClick={() => {
                  setOpen(false)
                  void logout()
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                {t('nav.logout')}
              </button>
            </div>,
            document.body,
          )
        : null}

      <NavCustomizer
        open={navCustomizerOpen}
        onClose={() => setNavCustomizerOpen(false)}
        authorized={navGroups}
        prefs={navPrefs}
      />
    </div>
  )
}
