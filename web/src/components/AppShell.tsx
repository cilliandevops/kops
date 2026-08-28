import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Menu, X } from 'lucide-react'
import { shouldSkipEnterAnim } from '@/lib/motionPrefs'
import { useAuth } from '@/store/auth'
import { SECTIONS, pathInGroup, type NavGroup } from '@/nav/definitions'
import { useNavModel } from '@/nav/useNavModel'
import { ConnDot } from './ui'
import { BrandMark } from './BrandMark'
import { ContextBar } from './ContextBar'
import { GlobalSearchPalette } from './GlobalSearchPalette'
import { OAuthAccountBanner } from './OAuthAccountBanner'
import { StarSupportFloat } from './StarSupportCta'
import { UserMenu } from './UserMenu'
import { cn } from '@/lib/utils'

function NavBody({
  groups,
  onNavigate,
}: {
  groups: NavGroup[]
  onNavigate?: () => void
}) {
  const { t } = useTranslation()
  const location = useLocation()
  const activeGroupKey =
    groups.find((group) => pathInGroup(location.pathname, group))?.titleKey ?? null

  const [openByKey, setOpenByKey] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const group of groups) {
      initial[group.titleKey] = pathInGroup(location.pathname, group)
    }
    return initial
  })

  useEffect(() => {
    if (!activeGroupKey) return
    setOpenByKey((prev) =>
      prev[activeGroupKey] ? prev : { ...prev, [activeGroupKey]: true },
    )
  }, [activeGroupKey])

  const toggleGroup = (titleKey: string) => {
    setOpenByKey((prev) => ({ ...prev, [titleKey]: !prev[titleKey] }))
  }

  return (
    <nav className="app-nav">
      {groups.map((group) => {
        const open = Boolean(openByKey[group.titleKey])
        const hasActive = group.titleKey === activeGroupKey
        return (
          <div
            key={group.titleKey}
            className={cn('app-nav-section', open && 'is-open', hasActive && 'is-current')}
          >
            <button
              type="button"
              className="app-nav-toggle"
              aria-expanded={open}
              onClick={() => toggleGroup(group.titleKey)}
            >
              <group.icon className="app-nav-icon" />
              <span className="app-nav-group">{t(group.titleKey)}</span>
              <ChevronDown className="app-nav-chevron" />
            </button>
            {open ? (
              <div className="app-nav-list">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/' || item.exact}
                    onClick={onNavigate}
                    className={({ isActive }) => cn('app-nav-item', isActive && 'is-active')}
                  >
                    <item.icon className="app-nav-icon" />
                    <span className="app-nav-label" title={t(item.labelKey)}>
                      {t(item.labelKey)}
                    </span>
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}

export function AppShell() {
  const { t } = useTranslation()
  const { user, roles, isViewerOnly } = useAuth()
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileNavOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [mobileNavOpen])

  const aiHome = location.pathname === '/ai' || location.pathname === '/'
  const section = aiHome
    ? 'ai'
    : location.pathname.startsWith('/marketplace')
      ? 'marketplace'
      : 'console'

  const { visible: visibleGroups, authorized: authorizedGroups, prefs: navPrefs } =
    useNavModel(section)

  const primaryRole = roles.includes('admin')
    ? 'admin'
    : roles.includes('editor')
      ? 'editor'
      : roles.includes('viewer')
        ? 'viewer'
        : user?.role || 'user'

  const skipEnterAnim = shouldSkipEnterAnim()

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <header className="app-topbar">
        {/* Left: menu (mobile) + full brand */}
        <div className="app-topbar-left">
          {!aiHome ? (
            <button
              type="button"
              className="app-topbar-nav-toggle md:hidden"
              aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          ) : null}
          <BrandMark
            to="/ai"
            showVersion={false}
            className="min-w-0 sm:hidden"
            brandClassName="text-[13px]"
          />
          <BrandMark
            to="/ai"
            className="hidden min-w-0 sm:inline-flex"
            brandClassName="text-sm md:text-base"
          />
        </div>

        {/* Center: section switcher — the primary destination control, same in every section */}
        <div className="app-topbar-center">
          <nav className="app-topbar-switch" aria-label={t('nav.sections')}>
            {SECTIONS.map((s) => {
              const active = s.id === section
              return (
                <Link
                  key={s.id}
                  to={s.to}
                  className={cn('app-topbar-switch-item', active && 'is-active')}
                  aria-current={active ? 'page' : undefined}
                  title={t(s.labelKey)}
                >
                  <s.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{t(s.labelKey)}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right: search · status · user. Cluster/namespace live in ContextBar. */}
        <div className="app-topbar-right">
          <div className="app-topbar-search">
            <GlobalSearchPalette />
          </div>
          <span className="hidden shrink-0 sm:inline-flex">
            <ConnDot online />
          </span>
          <div className="shrink-0">
            <UserMenu
              primaryRole={primaryRole}
              isViewerOnly={isViewerOnly}
              navGroups={authorizedGroups}
              navPrefs={navPrefs}
            />
          </div>
        </div>
      </header>

      {/* Mobile drawer — portal to body so topbar (z-shell) cannot bury it */}
      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {!aiHome && mobileNavOpen ? (
                <>
                  <motion.button
                    type="button"
                    key="nav-backdrop"
                    className="fixed inset-0 z-[var(--z-drawer-backdrop)] bg-black/60 md:hidden"
                    aria-label="Close navigation overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => setMobileNavOpen(false)}
                  />
                  <motion.aside
                    key="nav-drawer"
                    className="fixed inset-y-0 left-0 z-[var(--z-drawer)] flex w-[min(86vw,300px)] flex-col border-r border-line bg-panel-solid pt-[env(safe-area-inset-top)] shadow-[8px_0_32px_rgba(0,0,0,0.45)] md:hidden"
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
                  >
                    <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-3">
                      <BrandMark brandClassName="text-sm" />
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded border border-line text-cyan"
                        aria-label="Close navigation"
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <NavBody groups={visibleGroups} onNavigate={() => setMobileNavOpen(false)} />
                  </motion.aside>
                </>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}

      <div className="relative flex min-h-0 w-full flex-1">
        {/* Desktop sidebar — hidden on AI home (console entry lives in the AI page) */}
        {!aiHome ? (
          <aside className="hidden h-full w-[200px] shrink-0 flex-col border-r border-line bg-panel-solid/50 md:flex">
            <NavBody groups={visibleGroups} />
          </aside>
        ) : null}

        <main
          className={cn(
            'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
            aiHome
              ? 'px-0 py-0'
              : 'px-2.5 py-2.5 sm:px-4 sm:py-4 md:px-6 md:py-5 xl:px-8',
          )}
        >
          {/* Cluster/namespace scope for this page — the AI page carries its own */}
          {!aiHome ? <ContextBar /> : null}

          {!aiHome ? (
            <div className="shrink-0">
              <OAuthAccountBanner />
            </div>
          ) : null}

          <motion.div
            key={location.pathname}
            className={cn(
              'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col',
              aiHome ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain',
            )}
            initial={skipEnterAnim ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: skipEnterAnim ? 0 : 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <StarSupportFloat />
    </div>
  )
}
