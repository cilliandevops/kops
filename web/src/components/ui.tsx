import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export { HudSelect, type HudSelectOption } from './HudSelect'

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
}) {
  const variants = {
    primary:
      'border border-cyan/50 bg-cyan/15 text-cyan hover:bg-cyan/25 shadow-[0_0_18px_rgba(53,230,255,0.18)]',
    ghost: 'bg-transparent text-text-dim hover:bg-cyan-faint hover:text-text',
    danger: 'border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25',
    outline: 'border border-line bg-panel-solid text-text hover:border-cyan hover:text-cyan',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-semibold tracking-wide transition active:scale-[0.98] disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded border border-line bg-panel-solid px-3.5 py-2.5 text-sm text-text outline-none transition placeholder:text-text-dim/60 focus:border-cyan focus:shadow-[0_0_0_3px_rgba(53,230,255,0.14)]',
        className,
      )}
      {...props}
    />
  )
}

export function Card({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn('hud-panel rounded', className)}>{children}</div>
}

export function Panel({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn('hud-panel rounded', className)}>{children}</div>
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'accent'
}) {
  const tones = {
    neutral: 'border-line bg-mist text-text-dim',
    ok: 'border-ok/30 bg-ok/10 text-ok',
    warn: 'border-warn/30 bg-warn/10 text-warn',
    danger: 'border-danger/30 bg-danger/10 text-danger',
    accent: 'border-cyan/30 bg-cyan-faint text-cyan',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-2.5 flex w-full shrink-0 flex-col gap-2.5 sm:mb-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
      <div className="min-w-0">
        <h1 className="page-header-title font-display text-xl font-semibold tracking-[-0.01em] text-text">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 line-clamp-2 text-[13px] text-text-dim">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">{action}</div> : null}
    </div>
  )
}

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
}) {
  return (
    <Card className="h-full min-w-0 p-3 sm:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <div className="hud-label text-[10px] sm:text-[11px]">{label}</div>
          <div className="mt-1.5 font-display text-xl font-semibold tracking-[-0.01em] text-text sm:mt-2 sm:text-2xl">
            {value}
          </div>
        </div>
        {icon ? (
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded border border-line bg-cyan-faint text-cyan sm:h-10 sm:w-10">
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  )
}

export function ConnDot({ online = true }: { online?: boolean }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        online
          ? 'bg-ok shadow-[0_0_8px_rgba(77,255,176,0.7)]'
          : 'bg-danger shadow-[0_0_8px_rgba(255,77,94,0.7)]',
      )}
    />
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 py-10 text-center text-sm text-text-dim">{children}</div>
  )
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  // Portal to body: page transitions (framer-motion transform) + shell overflow
  // otherwise trap position:fixed and clip dialogs.
  return createPortal(
    <div className="ui-modal-root fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6">
      <button
        type="button"
        aria-label="Close overlay"
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-xl border border-line bg-panel-solid shadow-[0_0_40px_rgba(53,230,255,0.12)] sm:max-h-[88vh] sm:rounded',
          wide ? 'max-w-6xl' : 'max-w-3xl',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <div className="hud-label">Action</div>
            <h2 className="mt-1 truncate font-display text-base font-bold tracking-[0.12em] text-text sm:text-lg">
              {title}
            </h2>
            {subtitle ? <p className="mt-1 truncate text-xs text-text-dim">{subtitle}</p> : null}
          </div>
          <Button variant="ghost" className="h-9 w-9 shrink-0 px-0" onClick={onClose} type="button">
            ✕
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
