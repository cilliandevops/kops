import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Bot, Cloud, Loader2, Siren } from 'lucide-react'
import { getFleetSummary, updateCluster, type FleetClusterCard } from '@/api/cluster'
import {
  buildFleetFocusHref,
  buildFleetInspectHref,
  buildFleetTourHref,
} from '@/lib/aiInvestigate'
import { useAuth } from '@/store/auth'
import { useCluster } from '@/store/cluster'
import { Badge, Button, EmptyState, PageHeader } from '@/components/ui'
import { cn } from '@/lib/utils'

const ENV_PRESETS = ['production', 'staging', 'development', 'demo'] as const

function statusTone(card: FleetClusterCard): 'ok' | 'warn' | 'danger' | 'neutral' {
  // Signal lamp follows the fleet probe, not the stale statusCache string.
  // (Cache may still say "Unavailable: …" / "Initialization failed" while Nodes/Pods list OK.)
  if (!card.reachable) return 'danger'
  if (
    (card.not_ready_nodes || 0) > 0 ||
    (card.unhealthy_pods || 0) > 0 ||
    (card.warning_events || 0) > 0
  ) {
    return 'warn'
  }
  return 'ok'
}

function shortServer(server?: string) {
  if (!server) return '—'
  try {
    const u = new URL(server)
    return u.host || server
  } catch {
    return server.replace(/^https?:\/\//, '')
  }
}

function sourceLabel(source?: string) {
  const s = (source || '').toLowerCase()
  if (s === 'database' || s === 'db') return 'DB'
  if (s === 'file' || s === 'kubeconfig') return 'File'
  if (s === 'incluster' || s === 'in-cluster') return 'In-cluster'
  return source || '—'
}

function Metric({
  label,
  value,
  warn,
  hint,
  onClick,
  clickTitle,
}: {
  label: string
  value: string | number
  warn?: boolean
  hint?: string
  onClick?: (e: MouseEvent) => void
  clickTitle?: string
}) {
  const valueClass = cn(
    'mt-0.5 font-mono text-[13px] font-semibold',
    warn ? 'text-warn' : 'text-text',
    onClick && 'underline decoration-dotted underline-offset-2 hover:text-cyan',
  )
  return (
    <div className="min-w-0">
      <div className="hud-label">{label}</div>
      {onClick ? (
        <button
          type="button"
          title={clickTitle}
          onClick={onClick}
          className={cn(valueClass, 'block text-left')}
        >
          {value}
        </button>
      ) : (
        <div className={valueClass}>{value}</div>
      )}
      {hint ? <div className="mt-0.5 truncate text-[0.65rem] text-warn">{hint}</div> : null}
    </div>
  )
}

/** Single traffic-light lamp: green ok · yellow warn · red offline · dim unknown */
function ClusterSignal({
  tone,
  label,
}: {
  tone: ReturnType<typeof statusTone>
  label: string
}) {
  return (
    <span
      className={cn('cluster-signal', `is-${tone}`)}
      role="img"
      aria-label={label}
      title={label}
    />
  )
}

function signalLabel(
  tone: ReturnType<typeof statusTone>,
  t: (key: string) => string,
): string {
  if (tone === 'ok') return t('fleet.signalOk')
  if (tone === 'warn') return t('fleet.signalWarn')
  if (tone === 'danger') return t('fleet.signalOffline')
  return t('fleet.signalUnknown')
}

function envTone(env?: string): 'danger' | 'warn' | 'accent' | 'neutral' {
  const e = (env || '').toLowerCase()
  if (e === 'production' || e === 'prod') return 'danger'
  if (e === 'staging' || e === 'stage') return 'warn'
  if (e === 'demo') return 'accent'
  return 'neutral'
}

export function FleetPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAdmin, canMutate } = useAuth()
  const canWrite = isAdmin || canMutate('clusters')
  const { clusterId, setClusterId, switching } = useCluster()

  const fleetQ = useQuery({
    queryKey: ['fleet-summary'],
    queryFn: getFleetSummary,
    refetchInterval: 30_000,
  })

  const envMut = useMutation({
    mutationFn: ({ id, environment }: { id: string; environment: string }) =>
      updateCluster(id, { environment }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['fleet-summary'] })
      await queryClient.invalidateQueries({ queryKey: ['clusters'] })
    },
  })

  const clusters = fleetQ.data?.clusters || []
  const activeId = fleetQ.data?.active_cluster_id || clusterId

  const rollup = {
    total: clusters.length,
    reachable: clusters.filter((c) => c.reachable).length,
    unhealthy: clusters.reduce((n, c) => n + (c.unhealthy_pods || 0), 0),
    warnings: clusters.reduce((n, c) => n + (c.warning_events || 0), 0),
  }

  const openCluster = (id: string) => {
    if (id && id !== clusterId) setClusterId(id)
    navigate('/overview')
  }

  const openAiInspect = (card: FleetClusterCard, e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    navigate(
      buildFleetInspectHref({
        clusterId: card.id,
        clusterName: card.name,
      }),
    )
  }

  const openAiFocus = (
    card: FleetClusterCard,
    focus: 'unhealthy' | 'warnings',
    e: MouseEvent,
  ) => {
    e.stopPropagation()
    e.preventDefault()
    navigate(
      buildFleetFocusHref({
        clusterId: card.id,
        clusterName: card.name,
        focus,
      }),
    )
  }

  const openFleetTour = () => {
    navigate(buildFleetTourHref())
  }

  const setEnv = (card: FleetClusterCard, env: string, e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!canWrite || !card.id || envMut.isPending) return
    const next = card.environment === env ? '' : env
    envMut.mutate({ id: card.id, environment: next })
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <PageHeader
        title={t('fleet.title')}
        subtitle={t('fleet.subtitle')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              className="px-3 py-1.5 text-xs"
              type="button"
              disabled={fleetQ.isFetching}
              onClick={() => void fleetQ.refetch()}
            >
              {fleetQ.isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {t('common.refresh')}
            </Button>
            <Button
              className="px-3 py-1.5 text-xs"
              type="button"
              disabled={!rollup.reachable || switching}
              title={t('fleet.fleetInspectHint')}
              onClick={openFleetTour}
            >
              <Bot className="h-3.5 w-3.5" />
              {t('fleet.fleetInspect')}
            </Button>
            <Link
              to="/clusters"
              className="inline-flex items-center gap-1 rounded border border-line px-3 py-1.5 text-xs text-cyan hover:bg-cyan/10"
            >
              <Cloud className="h-3.5 w-3.5" />
              {t('fleet.manageClusters')}
            </Link>
          </div>
        }
      />

      {fleetQ.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-text-dim">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('common.loading')}
        </div>
      ) : null}

      {fleetQ.isError ? (
        <EmptyState>
          <div className="space-y-2">
            <div className="font-semibold text-text">{t('fleet.loadFailed')}</div>
            <div>{(fleetQ.error as Error)?.message || t('fleet.loadFailedHint')}</div>
          </div>
        </EmptyState>
      ) : null}

      {!fleetQ.isLoading && !fleetQ.isError && clusters.length === 0 ? (
        <EmptyState>
          <div className="space-y-3">
            <div className="font-semibold text-text">{t('clusters.empty')}</div>
            <div>{t('fleet.emptyHint')}</div>
            <Link
              to="/clusters"
              className="inline-flex rounded border border-cyan/40 bg-cyan/10 px-3 py-1.5 text-xs font-semibold text-cyan"
            >
              {t('fleet.manageClusters')}
            </Link>
          </div>
        </EmptyState>
      ) : null}

      {!fleetQ.isLoading && !fleetQ.isError && clusters.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: t('fleet.rollupClusters'), value: rollup.total },
            { label: t('fleet.rollupReachable'), value: `${rollup.reachable}/${rollup.total}` },
            {
              label: t('fleet.rollupUnhealthy'),
              value: rollup.unhealthy,
              warn: rollup.unhealthy > 0,
            },
            {
              label: t('fleet.rollupWarnings'),
              value: rollup.warnings,
              warn: rollup.warnings > 0,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="app-surface rounded-md px-3 py-2.5"
            >
              <div className="hud-label">{item.label}</div>
              <div
                className={cn(
                  'mt-1 font-mono text-base font-semibold',
                  item.warn ? 'text-warn' : 'text-text',
                )}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {clusters.map((card) => {
          const isCurrent = card.id === activeId || card.id === clusterId || card.name === clusterId
          const tone = statusTone(card)
          const nodesLabel =
            card.nodes == null
              ? '—'
              : (card.not_ready_nodes || 0) > 0
                ? `${card.nodes - (card.not_ready_nodes || 0)}/${card.nodes}`
                : String(card.nodes)
          const envBusy = envMut.isPending && envMut.variables?.id === card.id

          return (
            <div
              key={card.id || card.name}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (!switching) openCluster(card.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (!switching) openCluster(card.id)
                }
              }}
              className={cn(
                'app-surface group flex min-w-0 cursor-pointer flex-col gap-3 rounded-md p-4 text-left transition',
                'hover:border-cyan/40',
                isCurrent && 'border-cyan/45',
                !card.reachable && 'opacity-90',
                switching && 'pointer-events-none opacity-70',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                  <ClusterSignal tone={tone} label={signalLabel(tone, t)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-display text-[15px] font-bold tracking-[0.04em]">
                      {card.name}
                    </h2>
                    {isCurrent ? <Badge tone="accent">{t('fleet.current')}</Badge> : null}
                    {card.environment ? (
                      <Badge tone={envTone(card.environment)}>{card.environment}</Badge>
                    ) : null}
                    <Badge tone={tone}>
                      {card.reachable
                        ? tone === 'warn'
                          ? t('fleet.signalWarn')
                          : card.status || 'OK'
                        : t('fleet.unreachable')}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {card.version ? (
                      <span className="rounded border border-line/70 bg-mist/20 px-1.5 py-0.5 font-mono text-[0.65rem] text-text-dim">
                        {card.version}
                      </span>
                    ) : null}
                    <span className="rounded border border-line/70 bg-mist/20 px-1.5 py-0.5 text-[0.65rem] text-text-dim">
                      {sourceLabel(card.source)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="min-w-0 rounded-md border border-line/60 bg-mist/15 px-2.5 py-1.5">
                <div className="hud-label">
                  {t('fleet.apiServer')}
                </div>
                <div
                  className="mt-0.5 truncate font-mono text-[0.72rem] text-text"
                  title={card.server || undefined}
                >
                  {shortServer(card.server)}
                </div>
              </div>

              {canWrite && card.source !== 'showcase' ? (
                <div
                  className="flex flex-wrap items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <span className="hud-label mr-0.5">
                    {t('fleet.env')}
                  </span>
                  {ENV_PRESETS.map((env) => {
                    const active = (card.environment || '').toLowerCase() === env
                    return (
                      <button
                        key={env}
                        type="button"
                        disabled={envBusy}
                        title={active ? t('fleet.envClearHint') : t('fleet.envSetHint', { env })}
                        onClick={(e) => setEnv(card, env, e)}
                        className={cn(
                          'rounded border px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide transition',
                          active
                            ? 'border-cyan/50 bg-cyan/15 text-cyan'
                            : 'border-line/70 text-text-dim hover:border-cyan/30 hover:text-text',
                          envBusy && 'opacity-60',
                        )}
                      >
                        {t(`fleet.envPresets.${env}`)}
                      </button>
                    )
                  })}
                  {envBusy ? <Loader2 className="h-3 w-3 animate-spin text-text-dim" /> : null}
                </div>
              ) : null}

              {card.reachable ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Metric
                    label={t('fleet.nodes')}
                    value={nodesLabel}
                    warn={(card.not_ready_nodes || 0) > 0}
                    hint={
                      (card.not_ready_nodes || 0) > 0
                        ? `${card.not_ready_nodes} ${t('fleet.notReady')}`
                        : undefined
                    }
                  />
                  <Metric label={t('fleet.namespaces')} value={card.namespaces ?? '—'} />
                  <Metric label={t('fleet.pods')} value={card.pods ?? '—'} />
                  <Metric
                    label={t('fleet.unhealthy')}
                    value={card.unhealthy_pods ?? '—'}
                    warn={(card.unhealthy_pods || 0) > 0}
                    clickTitle={t('fleet.metricDrillUnhealthy')}
                    onClick={
                      (card.unhealthy_pods || 0) > 0
                        ? (e) => openAiFocus(card, 'unhealthy', e)
                        : undefined
                    }
                  />
                  <Metric
                    label={t('fleet.warnings')}
                    value={card.warning_events ?? '—'}
                    warn={(card.warning_events || 0) > 0}
                    clickTitle={t('fleet.metricDrillWarnings')}
                    onClick={
                      (card.warning_events || 0) > 0
                        ? (e) => openAiFocus(card, 'warnings', e)
                        : undefined
                    }
                  />
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-xs text-text-dim">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                  <span className="min-w-0 break-all">{card.error || t('fleet.unreachableHint')}</span>
                </div>
              )}

              <div
                className="mt-auto flex items-center justify-between gap-2 border-t border-line/70 pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  disabled={switching}
                  onClick={(e) => openAiInspect(card, e)}
                  className="inline-flex items-center gap-1 rounded border border-cyan/35 bg-cyan/10 px-2.5 py-1 text-[0.7rem] font-semibold text-cyan hover:bg-cyan/15"
                >
                  <Bot className="h-3.5 w-3.5" />
                  {t('fleet.aiInspect')}
                </button>
                <span className="inline-flex items-center gap-1 text-[0.7rem] text-cyan opacity-70 transition group-hover:opacity-100">
                  <Siren className="h-3 w-3" />
                  {t('fleet.openOverview')}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
