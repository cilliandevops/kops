import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { useGlobalSearchHits } from '@/hooks/useGlobalSearchHits'
import { ALL_NAMESPACES } from '@/store/namespace'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

function shortcutLabel() {
  if (typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform)) {
    return '⌘K'
  }
  return 'Ctrl+K'
}

export function GlobalSearchPalette() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const { hits, loading, namespace } = useGlobalSearchHits(q, open)
  const nsLabel =
    namespace === ALL_NAMESPACES || !namespace ? t('common.allNamespaces') : namespace

  const close = () => {
    setOpen(false)
    setQ('')
    setHighlight(0)
  }

  const go = (to: string) => {
    close()
    navigate(to, { state: { from: `${location.pathname}${location.search}` } })
  }

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 0)
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return
      const trigger = document.getElementById('hud-global-search-trigger')
      if (trigger?.contains(e.target as Node)) return
      close()
    }
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  useEffect(() => {
    setHighlight(0)
  }, [q, hits.length])

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (hits.length ? (h + 1) % hits.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (hits.length ? (h - 1 + hits.length) % hits.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const hit = hits[highlight]
      if (hit) go(hit.to)
    }
  }

  const panel =
    open &&
    createPortal(
      <div className="hud-global-search-root fixed inset-0 flex items-stretch justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-start sm:px-4 sm:pt-[12vh]">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Global search"
          className="flex h-full w-full max-w-xl flex-col overflow-hidden rounded-none border-0 border-line bg-panel-solid shadow-none sm:h-auto sm:max-h-[min(70vh,36rem)] sm:rounded sm:border sm:shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
        >
          <div className="flex items-center gap-2 border-b border-line px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:py-2.5 sm:pt-2.5">
            <Search className="h-4 w-4 shrink-0 text-cyan" />
            <input
              ref={inputRef}
              className="hud-field min-w-0 flex-1 border-0 bg-transparent px-0 text-base shadow-none focus:ring-0 sm:text-[13px]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onListKey}
              placeholder={`${t('common.search')}… (${nsLabel})`}
              aria-controls={listId}
              aria-autocomplete="list"
            />
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-line text-text-dim sm:hidden"
              aria-label="Close search"
              onClick={close}
            >
              <X className="h-4 w-4" />
            </button>
            <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-text-dim sm:inline">
              Esc
            </kbd>
          </div>
          <div
            id={listId}
            role="listbox"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 sm:max-h-[50vh] sm:flex-none"
          >
            {loading && !hits.length ? (
              <div className="px-4 py-6 text-center text-xs text-text-dim">{t('common.loading')}</div>
            ) : null}
            {!q.trim() ? (
              <div className="px-4 py-6 text-center text-xs text-text-dim">
                {t('nav.searchPlaceholder')} · {nsLabel}
              </div>
            ) : null}
            {q.trim() && !loading && !hits.length ? (
              <div className="px-4 py-6 text-center text-xs text-text-dim">{t('common.search')}</div>
            ) : null}
            {hits.map((h, idx) => (
              <button
                key={`${h.kind}-${h.namespace}-${h.name}`}
                type="button"
                role="option"
                aria-selected={idx === highlight}
                className={cn(
                  'flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left font-mono text-[13px] transition sm:min-h-0 sm:py-2 sm:text-[12px]',
                  idx === highlight ? 'bg-cyan/15 text-cyan' : 'text-text hover:bg-mist',
                )}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => go(h.to)}
              >
                <Badge tone="neutral">{h.kind}</Badge>
                <span className="min-w-0 flex-1 truncate font-semibold">{h.name}</span>
                <span className="max-w-[30%] shrink-0 truncate text-text-dim">
                  {h.namespace || 'cluster'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>,
      document.body,
    )

  return (
    <>
      <button
        id="hud-global-search-trigger"
        type="button"
        className="hud-select hud-select-trigger flex h-9 w-full min-w-0 max-w-full items-center justify-start gap-2 px-3 py-2 text-left text-text-dim"
        onClick={() => setOpen(true)}
        aria-label="Open global search"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-cyan/80" />
        <span className="min-w-0 flex-1 truncate text-[12px]">
          {t('nav.searchPlaceholder')}
        </span>
        <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-text-dim sm:inline">
          {shortcutLabel()}
        </kbd>
      </button>
      {panel}
    </>
  )
}
