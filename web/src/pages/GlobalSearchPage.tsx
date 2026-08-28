import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGlobalSearchHits } from '@/hooks/useGlobalSearchHits'
import { ALL_NAMESPACES } from '@/store/namespace'
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui'
import { HudTable, HudTableScroll } from '@/components/HudTableScroll'
import { useTranslation } from 'react-i18next'

/** Full-page search (bookmarkable). Prefer top-bar ⌘K / Ctrl+K for daily use. */
export function GlobalSearchPage() {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const { hits, loading, namespace } = useGlobalSearchHits(q, true)
  const nsLabel = namespace === ALL_NAMESPACES || !namespace ? 'all namespaces' : namespace

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <PageHeader
        title={t('searchPage.title')}
        subtitle={t('searchPage.subtitle', { ns: nsLabel })}
      />
      <label className="block max-w-xl space-y-1">
        <span className="hud-label">Query</span>
        <input
          className="hud-field"
          value={q}
          autoFocus
          onChange={(e) => setQ(e.target.value)}
          placeholder="pod / deployment / service / node name"
        />
      </label>
      <Card className="overflow-hidden">
        <HudTableScroll>
          <HudTable>
            <thead>
              <tr>
                <th>Kind</th>
                <th>{t('common.name')}</th>
                <th>{t('common.namespace')}</th>
              </tr>
            </thead>
            <tbody>
              {hits.map((h) => (
                <tr key={`${h.kind}-${h.namespace}-${h.name}`}>
                  <td>
                    <Badge tone="neutral">{h.kind}</Badge>
                  </td>
                  <td>
                    <Link className="font-semibold text-cyan hover:underline" to={h.to}>
                      {h.name}
                    </Link>
                  </td>
                  <td>{h.namespace || '-'}</td>
                </tr>
              ))}
              {q.trim() && !hits.length && !loading ? (
                <tr>
                  <td colSpan={3}>
                    <EmptyState>No matches in loaded resource sets.</EmptyState>
                  </td>
                </tr>
              ) : null}
              {!q.trim() ? (
                <tr>
                  <td colSpan={3}>
                    <EmptyState>Type a name fragment to search.</EmptyState>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </HudTable>
        </HudTableScroll>
      </Card>
    </div>
  )
}
