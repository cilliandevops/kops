import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type HudSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type Props = {
  value: string
  onChange: (value: string) => void
  options: HudSelectOption[]
  className?: string
  placeholder?: string
  disabled?: boolean
  /** Show filter input when option count exceeds this (default 8). Set 0 to always show. */
  searchableWhen?: number
  /** Icon or mark shown before the selected label (does not affect value). */
  leading?: ReactNode
  /** Floor for the portaled menu width so long option labels stay readable. */
  menuMinWidth?: number
  'aria-label'?: string
}

type MenuPos = {
  left: number
  width: number
  maxHeight: number
  placement: 'bottom' | 'top'
  /** distance from viewport top (bottom placement) or unused */
  top?: number
  /** distance from viewport bottom (top placement) */
  bottom?: number
}

const MENU_GAP = 4
const MENU_MAX_H = 240 // max-h-60

export function HudSelect({
  value,
  onChange,
  options,
  className,
  placeholder = 'Select…',
  disabled,
  searchableWhen = 8,
  leading,
  menuMinWidth = 140,
  'aria-label': ariaLabel,
}: Props) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(-1)
  const [pos, setPos] = useState<MenuPos | null>(null)

  const selected = options.find((o) => o.value === value)
  const showSearch =
    searchableWhen === 0 || options.length > searchableWhen

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    )
  }, [options, query])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setHighlight(-1)
    setPos(null)
  }, [])

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const spaceBelow = vh - rect.bottom - MENU_GAP
    const spaceAbove = rect.top - MENU_GAP
    const placement: 'bottom' | 'top' =
      spaceBelow < 120 && spaceAbove > spaceBelow ? 'top' : 'bottom'
    const available = placement === 'bottom' ? spaceBelow : spaceAbove
    const maxHeight = Math.max(96, Math.min(MENU_MAX_H, available))
    const width = Math.min(vw - 16, Math.max(rect.width, menuMinWidth))
    let left = rect.left
    if (left + width > vw - 8) left = Math.max(8, vw - width - 8)
    if (left < 8) left = 8

    if (placement === 'bottom') {
      setPos({
        placement,
        top: rect.bottom + MENU_GAP,
        left,
        width,
        maxHeight,
      })
    } else {
      setPos({
        placement,
        bottom: vh - rect.top + MENU_GAP,
        left,
        width,
        maxHeight,
      })
    }
  }, [menuMinWidth])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, updatePosition, filtered.length, showSearch])

  useEffect(() => {
    if (!open) return
    const onScrollOrResize = () => updatePosition()
    window.addEventListener('resize', onScrollOrResize)
    // Capture scroll from any scrollable ancestor (e.g. main)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      close()
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const idx = filtered.findIndex((o) => o.value === value)
    setHighlight(idx >= 0 ? idx : filtered.length ? 0 : -1)
  }, [open, filtered, value])

  useEffect(() => {
    if (!open || highlight < 0) return
    const el = listRef.current?.querySelector(`[data-idx="${highlight}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open])

  const pick = (v: string) => {
    onChange(v)
    close()
  }

  const onTriggerKey = (e: KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => {
        let next = h
        for (let i = 0; i < filtered.length; i++) {
          next = (next + 1) % filtered.length
          if (!filtered[next]?.disabled) return next
        }
        return h
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => {
        let next = h
        for (let i = 0; i < filtered.length; i++) {
          next = (next - 1 + filtered.length) % filtered.length
          if (!filtered[next]?.disabled) return next
        }
        return h
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filtered[highlight]
      if (opt && !opt.disabled) pick(opt.value)
    }
  }

  const menuStyle: CSSProperties | undefined = pos
    ? {
        position: 'fixed',
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
        zIndex: 'var(--z-select)',
        ...(pos.placement === 'bottom'
          ? { top: pos.top }
          : { bottom: pos.bottom }),
      }
    : undefined

  const menu =
    open && pos
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            style={menuStyle}
            className="hud-select-menu flex flex-col overflow-hidden rounded border border-line bg-panel-solid shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
            onKeyDown={onListKey}
          >
            {showSearch ? (
              <div className="shrink-0 border-b border-line p-2">
                <input
                  autoFocus
                  className="hud-field w-full px-2 py-1.5 text-xs"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter…"
                  onKeyDown={onListKey}
                />
              </div>
            ) : null}
            <div
              ref={listRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
            >
              {filtered.length ? (
                filtered.map((opt, idx) => {
                  const active = opt.value === value
                  const hi = idx === highlight
                  return (
                    <button
                      key={opt.value || `__empty-${idx}`}
                      type="button"
                      role="option"
                      data-idx={idx}
                      aria-selected={active}
                      disabled={opt.disabled}
                      className={cn(
                        'flex w-full items-center px-3 py-1.5 text-left font-mono text-[12px] transition',
                        opt.disabled && 'cursor-not-allowed opacity-40',
                        active && 'bg-cyan/20 text-cyan',
                        !active && hi && 'bg-cyan/10 text-text',
                        !active && !hi && 'text-text hover:bg-mist',
                      )}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => {
                        if (!opt.disabled) pick(opt.value)
                      }}
                    >
                      <span className="truncate">{opt.label}</span>
                    </button>
                  )
                })
              ) : (
                <div className="px-3 py-2 text-xs text-text-dim">No matches</div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className={cn('relative inline-block min-w-0', className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        title={selected?.label || placeholder || ariaLabel}
        className={cn(
          'hud-select hud-select-trigger flex w-full items-center justify-between gap-1.5 text-left',
          open && 'hud-select-open',
          disabled && 'opacity-50',
        )}
        onClick={() => {
          if (disabled) return
          setOpen((v) => !v)
        }}
        onKeyDown={onTriggerKey}
      >
        {leading ? <span className="hud-select-leading shrink-0">{leading}</span> : null}
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-text-dim')}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-text-dim transition',
            open && 'rotate-180 text-cyan',
          )}
        />
      </button>
      {menu}
    </div>
  )
}
