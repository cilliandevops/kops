import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Activity, Boxes, Container, Server, Siren } from 'lucide-react'
import { getNodeMetrics, getSummary, listEvents } from '@/api/cluster'
import { useCluster } from '@/store/cluster'
import { useAuth } from '@/store/auth'
import { Badge, Card, EmptyState, PageHeader, StatCard } from '@/components/ui'
import { HudTable, HudTableScroll } from '@/components/HudTableScroll'
import { formatPercent } from '@/lib/utils'
import { shouldSkipEnterAnim } from '@/lib/motionPrefs'
import { parseNodeMetricsSummary } from '@/lib/nodeMetricsSummary'

const skipEnter = shouldSkipEnterAnim()
const container = {
  hidden: skipEnter ? { opacity: 1 } : { opacity: 0 },
  show: {
    opacity: 1,
    transition: skipEnter ? { duration: 0 } : { staggerChildren: 0.06 },
  },
}
const item = {
  hidden: skipEnter ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

type ResourceTile = {
  key: string
  label: string
  field: string
  to: string
  resource?: string
}

const RESOURCE_TILES: ResourceTile[] = [
  { key: 'nodes', label: 'Nodes', field: 'nodes', to: '/nodes', resource: 'nodes' },
  { key: 'namespaces', label: 'Namespaces', field: 'namespaces', to: '/namespaces', resource: 'namespaces' },
  { key: 'pods', label: 'Pods', field: 'pods', to: '/pods', resource: 'pods' },
  { key: 'deployments', label: 'Deployments', field: 'deployments', to: '/deployments', resource: 'deployments' },
  { key: 'statefulSets', label: 'StatefulSets', field: 'statefulSets', to: '/statefulsets', resource: 'statefulsets' },
  { key: 'daemonSets', label: 'DaemonSets', field: 'daemonSets', to: '/daemonsets', resource: 'daemonsets' },
  { key: 'services', label: 'Services', field: 'services', to: '/services', resource: 'services' },
  { key: 'ingresses', label: 'Ingresses', field: 'ingresses', to: '/ingresses', resource: 'ingresses' },
  { key: 'pvs', label: 'PVs', field: 'persistentVolumes', to: '/persistentvolumes', resource: 'persistentvolumes' },
  { key: 'pvcs', label: 'PVCs', field: 'pvcs', to: '/persistentvolumeclaims', resource: 'persistentvolumeclaims' },
  { key: 'configMaps', label: 'ConfigMaps', field: 'configMaps', to: '/configmaps', resource: 'configmaps' },
  { key: 'secrets', label: 'Secrets', field: 'secrets', to: '/secrets', resource: 'secrets' },
]

function UsageBar({ label, percent, detail }: { label: string; percent: number; detail: string }) {
  const pct = Math.max(0, Math.min(100, percent))
  const tone = pct >= 80 ? 'bg-danger' : pct >= 50 ? 'bg-orange' : 'bg-cyan'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-text-dim">{label}</span>
        <span className="font-mono text-text">
          {formatPercent(pct)} · {detail}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-mist">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function OverviewPage() {
  const { t } = useTranslation()
  const { clusterId, activeCluster } = useCluster()
  const { checkPermission } = useAuth()

  const summaryQ = useQuery({
    queryKey: ['summary', clusterId],
    queryFn: getSummary,
    enabled: Boolean(clusterId),
  })
  const eventsQ = useQuery({
    queryKey: ['events-recent', clusterId],
    queryFn: () => listEvents({ limit: 50 }),
    enabled: Boolean(clusterId),
  })
  const metricsQ = useQuery({
    queryKey: ['node-metrics', clusterId],
    queryFn: getNodeMetrics,
    enabled: Boolean(clusterId),
    refetchInterval: 20_000,
  })

  const metrics = metricsQ.data?.nodes || []
  const events = eventsQ.data?.events || []
  const warningEvents = events.filter((e: any) => e.type === 'Warning')
  const summary = summaryQ.data

  const rollup = useMemo(() => parseNodeMetricsSummary(metrics), [metrics])

  const cards = [
    {
      label: t('overview.nodes'),
      value: summary?.nodes ?? rollup.totalNodes ?? '-',
      icon: <Server className="h-5 w-5" />,
    },
    {
      label: t('overview.namespaces'),
      value: summary?.namespaces ?? '-',
      icon: <Boxes className="h-5 w-5" />,
    },
    {
      label: t('overview.pods'),
      value: summary?.pods ?? '-',
      icon: <Container className="h-5 w-5" />,
    },
    {
      label: t('overview.avgCpu'),
      value: rollup.totalNodes ? formatPercent(rollup.avgCpuUsagePercent) : '-',
      icon: <Activity className="h-5 w-5" />,
    },
    {
      label: t('overview.recentWarnings'),
      value: warningEvents.length,
      icon: <Siren className="h-5 w-5" />,
    },
  ]

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-4">
      <PageHeader
        title={t('overview.title')}
        subtitle={t('overview.subtitle')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{activeCluster?.name || clusterId || '—'}</Badge>
            <Link
              to="/fleet"
              className="text-xs text-cyan hover:underline"
              title={t('overview.viewFleet')}
            >
              {t('overview.viewFleet')}
            </Link>
          </div>
        }
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-5"
      >
        {cards.map((card) => (
          <motion.div key={card.label} variants={item}>
            <StatCard label={card.label} value={card.value} icon={card.icon} />
          </motion.div>
        ))}
      </motion.div>

      <Card className="min-w-0 p-3 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold tracking-[0.12em] sm:text-lg">
              {t('overview.clusterResources')}
            </h2>
            <p className="mt-1 hidden text-xs text-text-dim sm:block">
              Cluster-wide counts from /api/v1/summary/resources · click to open list
            </p>
          </div>
          <Badge tone="neutral">
            {summaryQ.isLoading ? t('common.loading') : `${RESOURCE_TILES.length} types`}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-4 xl:grid-cols-6">
          {RESOURCE_TILES.map((tile) => {
            const count = summary?.[tile.field]
            const allowed = !tile.resource || checkPermission(tile.resource, 'read')
            const value = count == null ? '—' : count
            const inner = (
              <>
                <div className="hud-label text-[10px] sm:text-[11px]">{tile.label}</div>
                <div className="mt-0.5 font-display text-xl font-semibold tracking-[-0.01em] text-text sm:mt-1 sm:text-2xl">
                  {value}
                </div>
              </>
            )
            if (!allowed) {
              return (
                <div
                  key={tile.key}
                  className="rounded border border-line/60 bg-mist/40 px-2.5 py-2.5 opacity-50 sm:px-3 sm:py-3"
                  title="No permission"
                >
                  {inner}
                </div>
              )
            }
            return (
              <Link
                key={tile.key}
                to={tile.to}
                className="rounded border border-line bg-mist px-2.5 py-2.5 transition hover:border-cyan/40 hover:bg-cyan/10 active:scale-[0.98] sm:px-3 sm:py-3"
              >
                {inner}
              </Link>
            )
          })}
        </div>
        {!summaryQ.isLoading && !summary ? (
          <div className="mt-3">
            <EmptyState>Summary unavailable for this cluster.</EmptyState>
          </div>
        ) : null}
      </Card>

      <Card className="min-w-0 p-3 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold tracking-[0.12em] sm:text-lg">
              {t('overview.nodeSnapshot')}
            </h2>
            <p className="mt-1 hidden text-xs text-text-dim sm:block">
              Aggregated from metrics-server · point-in-time (not Prometheus history)
            </p>
          </div>
          <Badge tone="neutral">
            {rollup.totalNodes} {t('overview.nodes').toLowerCase()}
          </Badge>
        </div>
        {rollup.totalNodes ? (
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded border border-line bg-mist px-2.5 py-2.5 sm:px-3 sm:py-3">
              <div className="hud-label">{t('overview.avgCpu')}</div>
              <div className="mt-1 font-display text-lg font-semibold text-text sm:text-xl">
                {formatPercent(rollup.avgCpuUsagePercent)}
              </div>
            </div>
            <div className="rounded border border-line bg-mist px-2.5 py-2.5 sm:px-3 sm:py-3">
              <div className="hud-label">Avg Memory</div>
              <div className="mt-1 font-display text-lg font-semibold text-text sm:text-xl">
                {formatPercent(rollup.avgMemoryUsagePercent)}
              </div>
            </div>
            <div className="rounded border border-line bg-mist px-2.5 py-2.5 sm:px-3 sm:py-3">
              <div className="hud-label">Capacity</div>
              <div className="mt-1 font-mono text-xs text-text sm:text-sm">
                {rollup.totalCpuCores} cores · {rollup.totalMemoryGB} Gi
              </div>
            </div>
            <div className="col-span-2 space-y-3 rounded border border-line bg-mist px-2.5 py-2.5 sm:px-3 sm:py-3 md:col-span-2 lg:col-span-1">
              <UsageBar
                label="CPU requests"
                percent={rollup.totalCpuRequestsPercent}
                detail={`${rollup.totalCpuRequests} cores`}
              />
              <UsageBar
                label="Mem requests"
                percent={rollup.totalMemoryRequestsPercent}
                detail={`${rollup.totalMemoryRequests} Gi`}
              />
            </div>
          </div>
        ) : (
          <EmptyState>
            {metricsQ.isLoading ? t('common.loading') : 'Connect metrics-server to populate node snapshot.'}
          </EmptyState>
        )}
      </Card>

      <div className="grid w-full gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="min-w-0 overflow-hidden">
          <div className="border-b border-line px-3 py-3 sm:px-5 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold tracking-[0.12em] sm:text-lg">
                {t('overview.nodeUsage')}
              </h2>
              <Badge tone="neutral">snapshot</Badge>
            </div>
            <p className="mt-1 hidden text-sm text-text-dim sm:block">
              Per-node CPU / memory / request saturation
            </p>
          </div>
          <HudTableScroll pinFirst wide>
          <HudTable pinFirst wide>
              <thead>
                <tr>
                  <th>Node</th>
                  <th>CPU</th>
                  <th>Memory</th>
                  <th>CPU req</th>
                  <th>Mem req</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((n: any) => (
                  <tr key={n.nodeName}>
                    <td>
                      <Link
                        className="font-semibold text-cyan hover:underline"
                        to={`/nodes/${encodeURIComponent(n.nodeName)}`}
                      >
                        {n.nodeName}
                      </Link>
                    </td>
                    <td>{n.cpuPercent || '-'}</td>
                    <td>{n.memoryPercent || '-'}</td>
                    <td>{n.cpuRequestsPercent || '-'}</td>
                    <td>{n.memoryRequestsPercent || '-'}</td>
                  </tr>
                ))}
                {!metricsQ.isLoading && !metrics.length ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState>Connect metrics-server to populate this table.</EmptyState>
                    </td>
                  </tr>
                ) : null}
                {metricsQ.isLoading && !metrics.length ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState>{t('common.loading')}</EmptyState>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </HudTable>
          </HudTableScroll>
        </Card>

        <Card className="min-w-0 p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
            <h2 className="font-display text-base font-bold tracking-[0.12em] sm:text-lg">
              {t('overview.recentEvents')}
            </h2>
            <div className="flex items-center gap-2">
              <Badge tone="warn">{warningEvents.length} warn</Badge>
              <Link to="/events" className="text-xs font-semibold text-cyan hover:underline">
                All
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            {events.slice(0, 8).map((event: any) => (
              <div
                key={event.id || `${event.name}-${event.lastTime}`}
                className="rounded border border-line bg-mist px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-semibold">{event.reason || event.name}</div>
                  <Badge tone={event.type === 'Warning' ? 'warn' : 'ok'}>
                    {event.type || 'Normal'}
                  </Badge>
                </div>
                <div className="mt-1 line-clamp-2 text-xs text-text-dim">
                  {event.message || '-'}
                </div>
              </div>
            ))}
            {!eventsQ.isLoading && !events.length ? (
              <div className="text-sm text-text-dim">No recent events</div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
