import { useDeferredValue, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { RefreshCw, RotateCcw, Search, Trash2 } from 'lucide-react'
import {
  addHelmRepo,
  listHelmCharts,
  listHelmRepos,
  listHelmReleases,
  removeHelmRepo,
  rollbackHelmRelease,
  uninstallHelmRelease,
  updateHelmRepos,
  type HelmChartSummary,
  type HelmRelease,
} from '@/api/helm'
import { Badge, Button, Card, EmptyState, Input, PageHeader } from '@/components/ui'
import { HudTable, HudTableScroll } from '@/components/HudTableScroll'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useAuth } from '@/store/auth'
import { useCluster } from '@/store/cluster'
import { ALL_NAMESPACES, useNamespace } from '@/store/namespace'
import { cn } from '@/lib/utils'

type Tab = 'discover' | 'installed' | 'repos'

/** Stable identity so the catalog memos do not recompute while a query is pending. */
const NO_CHARTS: HelmChartSummary[] = []

/** helm reports timestamps like `2026-07-30 10:54:44.123 +0800 CST`; minutes are enough. */
function formatUpdated(value?: string) {
  if (!value) return '-'
  const m = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/)
  return m ? `${m[1]} ${m[2]}` : value
}

/** Charts render as monograms: repo indexes carry no icon that `helm search` exposes. */
function ChartMark({ name }: { name: string }) {
  const initials = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '?'
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded border border-line bg-mist font-mono text-[13px] font-semibold text-text-dim">
      {initials}
    </div>
  )
}

function DiscoverTab({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [repoFilter, setRepoFilter] = useState('')
  const deferredQuery = useDeferredValue(query)

  const chartsQ = useQuery({
    queryKey: ['helm-charts'],
    queryFn: () => listHelmCharts(),
    staleTime: 5 * 60 * 1000,
  })

  const refresh = useMutation({
    mutationFn: () => listHelmCharts(true),
    onSuccess: (data) => qc.setQueryData(['helm-charts'], data),
  })

  const charts = chartsQ.data ?? NO_CHARTS

  const repoCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of charts) counts.set(c.repo, (counts.get(c.repo) || 0) + 1)
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [charts])

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase()
    return charts.filter((c) => {
      if (repoFilter && c.repo !== repoFilter) return false
      if (!needle) return true
      return (
        c.name.toLowerCase().includes(needle) ||
        c.repo.toLowerCase().includes(needle) ||
        (c.description || '').toLowerCase().includes(needle)
      )
    })
  }, [charts, deferredQuery, repoFilter])

  const err = (chartsQ.error as Error | null)?.message || (refresh.error as Error | null)?.message || ''
  const missingHelmCli = /helm CLI not found/i.test(err)

  return (
    <div className="flex min-h-0 w-full flex-col gap-3">
      {missingHelmCli ? (
        <div className="rounded border border-warn/40 bg-warn/10 px-4 py-3 text-sm">
          <p className="font-semibold text-warn">{t('marketplace.noHelmCli')}</p>
          <p className="mt-1 text-text-dim">{t('marketplace.noHelmCliHint')}</p>
        </div>
      ) : err ? (
        <div className="rounded border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{err}</div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-dim" />
          <Input
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('marketplace.searchPlaceholder')}
            aria-label={t('marketplace.searchPlaceholder')}
          />
        </div>
        {canEdit ? (
          <Button
            variant="outline"
            type="button"
            className="px-3 py-2 text-xs"
            disabled={refresh.isPending}
            onClick={() => refresh.mutate()}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refresh.isPending && 'animate-spin')} />
            {t('marketplace.refresh')}
          </Button>
        ) : null}
        <span className="text-xs text-text-dim">
          {t('marketplace.chartCount', { count: filtered.length })}
        </span>
      </div>

      {repoCounts.length ? (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setRepoFilter('')}
            className={cn(
              'rounded border px-2.5 py-1 text-xs transition',
              !repoFilter
                ? 'border-cyan/50 bg-cyan-faint text-cyan'
                : 'border-line text-text-dim hover:border-cyan/40 hover:text-text',
            )}
          >
            {t('marketplace.allRepos')} · {charts.length}
          </button>
          {repoCounts.map(([repo, count]) => (
            <button
              key={repo}
              type="button"
              onClick={() => setRepoFilter(repo === repoFilter ? '' : repo)}
              className={cn(
                'rounded border px-2.5 py-1 text-xs transition',
                repo === repoFilter
                  ? 'border-cyan/50 bg-cyan-faint text-cyan'
                  : 'border-line text-text-dim hover:border-cyan/40 hover:text-text',
              )}
            >
              {repo} · {count}
            </button>
          ))}
        </div>
      ) : null}

      {chartsQ.isLoading ? (
        <Card>
          <EmptyState>{t('marketplace.loadingCatalog')}</EmptyState>
        </Card>
      ) : !filtered.length ? (
        <Card>
          <EmptyState>
            {charts.length ? t('marketplace.noMatches') : t('marketplace.emptyCatalog')}
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((c) => (
            <ChartCard key={c.ref} chart={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function ChartCard({ chart }: { chart: HelmChartSummary }) {
  return (
    <Link
      to={`/marketplace/chart/${encodeURIComponent(chart.repo)}/${encodeURIComponent(chart.name)}`}
      className="group hud-panel flex min-w-0 flex-col gap-2.5 rounded p-3.5 transition hover:border-cyan/50"
    >
      <div className="flex min-w-0 items-start gap-3">
        <ChartMark name={chart.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-text group-hover:text-cyan">
            {chart.name}
          </div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-text-dim">{chart.repo}</div>
        </div>
      </div>
      <p className="line-clamp-2 min-h-[2.5em] text-xs leading-relaxed text-text-dim">
        {chart.description || '—'}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="neutral">{chart.version}</Badge>
        {chart.appVersion ? (
          <span className="font-mono text-[11px] text-text-dim">app {chart.appVersion}</span>
        ) : null}
      </div>
    </Link>
  )
}

function InstalledTab({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation()
  const { clusterId } = useCluster()
  const { namespace } = useNamespace()
  const [uninstallTarget, setUninstallTarget] = useState<HelmRelease | null>(null)
  const [rollbackTarget, setRollbackTarget] = useState<HelmRelease | null>(null)
  const [err, setErr] = useState('')

  const scoped = namespace && namespace !== ALL_NAMESPACES ? namespace : undefined
  const listQ = useQuery({
    queryKey: ['helm-releases', clusterId, namespace],
    queryFn: () => listHelmReleases(scoped),
  })

  const releases = listQ.data || []
  const listErr = (listQ.error as Error | null)?.message || ''

  const uninstall = useMutation({
    mutationFn: (r: HelmRelease) => uninstallHelmRelease(r.namespace, r.name),
    onSuccess: async () => {
      setUninstallTarget(null)
      setErr('')
      await listQ.refetch()
    },
    onError: (e: Error) => setErr(e.message),
  })

  const rollback = useMutation({
    mutationFn: (r: HelmRelease) => rollbackHelmRelease(r.namespace, r.name),
    onSuccess: async () => {
      setRollbackTarget(null)
      setErr('')
      await listQ.refetch()
    },
    onError: (e: Error) => setErr(e.message),
  })

  const busy = uninstall.isPending || rollback.isPending

  return (
    <div className="flex min-h-0 w-full flex-col gap-3">
      {err || listErr ? (
        <div className="rounded border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
          {err || listErr}
        </div>
      ) : null}
      <Card className="overflow-hidden p-0">
        <HudTableScroll maxHeightClass="max-h-[calc(100dvh-18rem)]">
          <HudTable>
            <thead>
              <tr>
                <th>{t('marketplace.release')}</th>
                <th>{t('common.namespace')}</th>
                <th>{t('marketplace.chart')}</th>
                <th>{t('common.status')}</th>
                <th>{t('marketplace.revision')}</th>
                <th>{t('marketplace.updated')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {releases.map((r) => (
                <tr key={`${r.namespace}/${r.name}`}>
                  <td className="font-semibold text-cyan">{r.name}</td>
                  <td>{r.namespace}</td>
                  <td className="font-mono text-xs">{r.chart || '-'}</td>
                  <td>
                    <Badge tone={r.status === 'deployed' ? 'ok' : 'warn'}>{r.status || '-'}</Badge>
                  </td>
                  <td>{r.revision || '-'}</td>
                  <td className="text-text-dim whitespace-nowrap" title={r.updated || undefined}>
                    {formatUpdated(r.updated)}
                  </td>
                  <td>
                    {canEdit ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          className="h-7 w-7 px-0"
                          type="button"
                          disabled={busy}
                          title={t('marketplace.rollback')}
                          aria-label={t('marketplace.rollback')}
                          onClick={() => setRollbackTarget(r)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="danger"
                          className="h-7 w-7 px-0"
                          type="button"
                          title={t('marketplace.uninstall')}
                          aria-label={t('marketplace.uninstall')}
                          onClick={() => setUninstallTarget(r)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-text-dim">{t('common.readOnly')}</span>
                    )}
                  </td>
                </tr>
              ))}
              {!listQ.isLoading && !releases.length ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState>{t('marketplace.noReleases')}</EmptyState>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </HudTable>
        </HudTableScroll>
      </Card>

      <ConfirmDialog
        open={Boolean(uninstallTarget)}
        title={t('marketplace.uninstallTitle')}
        confirmText={uninstallTarget?.name}
        confirmLabel={t('marketplace.uninstall')}
        busy={busy}
        description={
          <span>
            {t('marketplace.uninstallPrompt')}{' '}
            <span className="font-semibold text-text">
              {uninstallTarget?.namespace}/{uninstallTarget?.name}
            </span>
          </span>
        }
        onClose={() => setUninstallTarget(null)}
        onConfirm={() => {
          if (uninstallTarget) uninstall.mutate(uninstallTarget)
        }}
      />

      <ConfirmDialog
        open={Boolean(rollbackTarget)}
        title={t('marketplace.rollbackTitle')}
        danger={false}
        confirmLabel={t('marketplace.rollback')}
        busy={busy}
        description={
          <span>
            {t('marketplace.rollbackPrompt')}{' '}
            <span className="font-semibold text-text">
              {rollbackTarget?.namespace}/{rollbackTarget?.name}
            </span>
          </span>
        }
        onClose={() => setRollbackTarget(null)}
        onConfirm={() => {
          if (rollbackTarget) rollback.mutate(rollbackTarget)
        }}
      />
    </div>
  )
}

function ReposTab({ canEdit }: { canEdit: boolean }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', url: '' })
  const [err, setErr] = useState('')
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)

  const reposQ = useQuery({ queryKey: ['helm-repos'], queryFn: listHelmRepos })
  const repos = reposQ.data || []

  const invalidateCatalog = async () => {
    await qc.invalidateQueries({ queryKey: ['helm-charts'] })
    await reposQ.refetch()
  }

  const add = useMutation({
    mutationFn: () => addHelmRepo(form.name.trim(), form.url.trim()),
    onSuccess: async () => {
      setForm({ name: '', url: '' })
      setErr('')
      await invalidateCatalog()
    },
    onError: (e: Error) => setErr(e.message),
  })

  const remove = useMutation({
    mutationFn: (name: string) => removeHelmRepo(name),
    onSuccess: async () => {
      setRemoveTarget(null)
      setErr('')
      await invalidateCatalog()
    },
    onError: (e: Error) => setErr(e.message),
  })

  const update = useMutation({
    mutationFn: updateHelmRepos,
    onSuccess: invalidateCatalog,
    onError: (e: Error) => setErr(e.message),
  })

  const listErr = (reposQ.error as Error | null)?.message || ''

  return (
    <div className="flex min-h-0 w-full flex-col gap-3">
      {err || listErr ? (
        <div className="rounded border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
          {err || listErr}
        </div>
      ) : null}

      <Card className="overflow-hidden p-0">
        <HudTableScroll maxHeightClass="max-h-[40dvh]">
          <HudTable>
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>URL</th>
                {canEdit ? <th>{t('common.actions')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {repos.map((r) => (
                <tr key={r.name}>
                  <td className="font-semibold text-text">{r.name}</td>
                  <td className="font-mono text-xs text-text-dim">{r.url}</td>
                  {canEdit ? (
                    <td>
                      <Button
                        variant="ghost"
                        type="button"
                        className="px-2 py-1 text-xs"
                        onClick={() => setRemoveTarget(r.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('marketplace.removeRepo')}
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
              {!reposQ.isLoading && !repos.length ? (
                <tr>
                  <td colSpan={canEdit ? 3 : 2}>
                    <EmptyState>{t('marketplace.noRepos')}</EmptyState>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </HudTable>
        </HudTableScroll>
      </Card>

      {canEdit ? (
        <Card className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-sm font-semibold tracking-[0.08em] text-text uppercase">
              {t('marketplace.addRepo')}
            </h2>
            <Button
              variant="outline"
              type="button"
              className="px-3 py-2 text-xs"
              disabled={update.isPending}
              onClick={() => update.mutate()}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', update.isPending && 'animate-spin')} />
              {t('marketplace.updateRepos')}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
            <label className="block space-y-1">
              <span className="hud-label">{t('common.name')}</span>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="bitnami"
              />
            </label>
            <label className="block space-y-1">
              <span className="hud-label">URL</span>
              <Input
                className="font-mono text-xs"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://charts.bitnami.com/bitnami"
              />
            </label>
            <Button
              type="button"
              disabled={add.isPending || !form.name.trim() || !form.url.trim()}
              onClick={() => add.mutate()}
            >
              {t('marketplace.addRepo')}
            </Button>
          </div>
        </Card>
      ) : null}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title={t('marketplace.removeRepoTitle')}
        confirmLabel={t('marketplace.removeRepo')}
        busy={remove.isPending}
        description={
          <span>
            {t('marketplace.removeRepoPrompt')}{' '}
            <span className="font-semibold text-text">{removeTarget}</span>
          </span>
        }
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) remove.mutate(removeTarget)
        }}
      />
    </div>
  )
}

export function MarketplacePage() {
  const { t } = useTranslation()
  const { canEdit, isViewerOnly } = useAuth()
  const { pathname } = useLocation()
  const tab: Tab = pathname.endsWith('/installed')
    ? 'installed'
    : pathname.endsWith('/repos')
      ? 'repos'
      : 'discover'
  const mayEdit = canEdit && !isViewerOnly

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      {/* The sidebar already switches between the three views — no in-page tab strip. */}
      <PageHeader
        title={t(`marketplace.tab.${tab}`)}
        subtitle={t('marketplace.subtitle')}
      />
      {tab === 'discover' ? <DiscoverTab canEdit={mayEdit} /> : null}
      {tab === 'installed' ? <InstalledTab canEdit={mayEdit} /> : null}
      {tab === 'repos' ? <ReposTab canEdit={mayEdit} /> : null}
    </div>
  )
}
