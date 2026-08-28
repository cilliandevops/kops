import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button, Card } from '@/components/ui'

/**
 * Unknown routes used to redirect to /ai, which silently swallowed typos and
 * dead links. Showing the failed path makes a bad bookmark diagnosable.
 */
export function NotFoundPage() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <div className="flex w-full min-w-0 flex-1 items-center justify-center py-16">
      <Card className="flex max-w-lg flex-col items-center gap-4 px-8 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-text-dim">
          <Compass className="h-5 w-5" />
        </div>
        <div className="font-display text-3xl tracking-[0.12em] text-text">404</div>
        <div className="text-sm text-text">{t('notFound.title')}</div>
        <code className="max-w-full truncate rounded border border-line bg-surface-sunken px-3 py-1.5 font-mono text-xs text-text-dim">
          {pathname}
        </code>
        <p className="text-xs leading-relaxed text-text-dim">{t('notFound.hint')}</p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Link to="/ai">
            <Button variant="primary">{t('notFound.goAi')}</Button>
          </Link>
          <Link to="/overview">
            <Button variant="ghost">{t('notFound.goConsole')}</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
