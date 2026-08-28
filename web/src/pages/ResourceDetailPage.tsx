import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dump as yamlDump, load as yamlLoad } from 'js-yaml'
import { ArrowLeft, Bot, Pencil, RefreshCw, Save, Trash2, X } from 'lucide-react'
import {
  deleteClusterScopedResource,
  deleteNamespacedResource,
  getClusterScopedResource,
  getNamespacedResource,
  listNamespacedResource,
  metaName,
  updateClusterScopedResource,
  updateNamespacedResource,
} from '@/api/resources'
import { getObjectEvents } from '@/api/cluster'
import { apiPatch } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { useCluster } from '@/store/cluster'
import { Badge, Button, Card, EmptyState, PageHeader } from '@/components/ui'
import { HudTable, HudTableScroll } from '@/components/HudTableScroll'
import { AgeCell, CreatedCell } from '@/components/AgeCell'
import { PercentCell } from '@/components/PodMetricCells'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { podMetricsKey, usePodMetricsMap } from '@/hooks/usePodMetricsMap'
import { PromTimeChart } from '@/components/PromTimeChart'
import { ScaleDialog } from '@/components/ScaleDialog'
import { PodWorkbench } from '@/components/PodWorkbench'
import { NodeOpsControls } from '@/components/NodeOpsControls'
import { buildInvestigateHref, kindFromResource } from '@/lib/aiInvestigate'

type Tab = 'summary' | 'events' | 'yaml' | 'metrics' | 'related'

const KIND_MAP: Record<string, string> = {
  pods: 'Pod',
  deployments: 'Deployment',
  statefulsets: 'StatefulSet',
  daemonsets: 'DaemonSet',
  services: 'Service',
  configmaps: 'ConfigMap',
  secrets: 'Secret',
  jobs: 'Job',
  cronjobs: 'CronJob',
  ingresses: 'Ingress',
  networkpolicies: 'NetworkPolicy',
  gatewayclasses: 'GatewayClass',
  gateways: 'Gateway',
  httproutes: 'HTTPRoute',
  serviceaccounts: 'ServiceAccount',
  persistentvolumeclaims: 'PersistentVolumeClaim',
  persistentvolumes: 'PersistentVolume',
  storageclasses: 'StorageClass',
  roles: 'Role',
  rolebindings: 'RoleBinding',
  clusterroles: 'ClusterRole',
  clusterrolebindings: 'ClusterRoleBinding',
  nodes: 'Node',
  namespaces: 'Namespace',
  replicasets: 'ReplicaSet',
  replicationcontrollers: 'ReplicationController',
  podtemplates: 'PodTemplate',
  endpoints: 'Endpoints',
  endpointslices: 'EndpointSlice',
  leases: 'Lease',
  ingressclasses: 'IngressClass',
  servicecidrs: 'ServiceCIDR',
  priorityclasses: 'PriorityClass',
  runtimeclasses: 'RuntimeClass',
  mutatingwebhookconfigurations: 'MutatingWebhookConfiguration',
  validatingwebhookconfigurations: 'ValidatingWebhookConfiguration',
  volumeattachments: 'VolumeAttachment',
  csidrivers: 'CSIDriver',
  csinodes: 'CSINode',
}

export function ResourceDetailPage({
  resource,
  namespaced = true,
}: {
  resource: string
  namespaced?: boolean
}) {
  const { t } = useTranslation()
  const { namespace = '', name = '' } = useParams()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { clusterId } = useCluster()
  const { canMutate, canDelete, checkPermission } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const listHref = `/${resource}`
  const openConsole = (tab: 'logs' | 'exec') => {
    // replace — do not push a history entry, or browser Back only dismisses the console
    setSearchParams({ console: tab }, { replace: true })
  }
  const goBack = () => {
    const from = (location.state as { from?: string } | null)?.from
    const idx = (window.history.state as { idx?: number } | null)?.idx
    // Same stack as the browser Back button when we actually navigated here in-app
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1)
      return
    }
    navigate(from || listHref)
  }
  const [tab, setTab] = useState<Tab>('summary')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmApply, setConfirmApply] = useState(false)
  const [confirmRestart, setConfirmRestart] = useState(false)
  const [scaleOpen, setScaleOpen] = useState(false)
  const [scaleBusy, setScaleBusy] = useState(false)
  const consoleTab = searchParams.get('console')
  const consoleOpen =
    resource === 'pods' &&
    (consoleTab === 'logs' || consoleTab === 'exec' || consoleTab === 'attach' || consoleTab === 'yaml')

  const canRead = checkPermission(resource, 'read')
  const canWrite = canMutate(resource)
  const canRemove = canDelete(resource)
  const kind = KIND_MAP[resource] || kindFromResource(resource) || resource
  const investigateHref = name
    ? buildInvestigateHref({
        kind,
        name,
        namespace: namespaced ? namespace : undefined,
        resource,
      })
    : ''
  const supportsRestart = ['deployments', 'statefulsets', 'daemonsets'].includes(resource)
  const supportsScale = ['deployments', 'statefulsets'].includes(resource)
  const podMetrics = usePodMetricsMap(resource === 'pods' ? namespace || undefined : undefined)
  const podSnap =
    resource === 'pods' && name
      ? podMetrics.map.get(podMetricsKey(namespace, name))
      : undefined

  const detailQ = useQuery({
    queryKey: ['detail', clusterId, resource, namespace, name],
    enabled: canRead && Boolean(name),
    queryFn: () =>
      namespaced
        ? getNamespacedResource(namespace, resource, name)
        : getClusterScopedResource(resource, name),
  })

  const eventsQ = useQuery({
    queryKey: ['object-events', clusterId, kind, namespace, name],
    enabled: tab === 'events' && Boolean(name),
    queryFn: () => getObjectEvents(kind, name, namespaced ? namespace : undefined),
  })

  const obj = detailQ.data
  const yamlText = useMemo(() => {
    if (!obj) return ''
    try {
      const clone = structuredClone(obj)
      if (clone.metadata) delete clone.metadata.managedFields
      return yamlDump(clone, { lineWidth: 120, noRefs: true })
    } catch {
      return JSON.stringify(obj, null, 2)
    }
  }, [obj])

  const owners = useMemo((): Array<{ kind: string; name: string; apiVersion?: string }> => {
    const refs = obj?.metadata?.ownerReferences || []
    return refs.map((r: any) => ({
      kind: String(r.kind || ''),
      name: String(r.name || ''),
      apiVersion: r.apiVersion ? String(r.apiVersion) : undefined,
    }))
  }, [obj])

  const relatedQ = useQuery({
    queryKey: ['related-children', clusterId, resource, namespace, name, obj?.metadata?.uid],
    enabled:
      tab === 'related' &&
      namespaced &&
      Boolean(obj) &&
      ['deployments', 'statefulsets', 'daemonsets', 'jobs', 'services'].includes(resource),
    queryFn: async () => {
      const pods = await listNamespacedResource(namespace, 'pods')
      const uid = obj?.metadata?.uid
      const matchLabels: Record<string, string> =
        obj?.spec?.selector?.matchLabels || obj?.spec?.selector || {}

      return pods.filter((p: any) => {
        // Direct owner (STS/DS/Job) or via ReplicaSet name prefix for Deployments
        const owned = (p.metadata?.ownerReferences || []).some((r: any) => {
          if (r.uid === uid) return true
          if (resource === 'deployments' && r.kind === 'ReplicaSet') {
            return String(r.name || '').startsWith(`${name}-`)
          }
          return r.name === name && String(r.kind).toLowerCase() === kind.toLowerCase()
        })
        if (owned) return true
        if (!matchLabels || typeof matchLabels !== 'object') return false
        const labels = p.metadata?.labels || {}
        return Object.entries(matchLabels).every(([k, v]) => labels[k] === v)
      })
    },
  })

  const promQuery = useMemo(() => {
    if (resource === 'nodes') {
      return `sum(rate(container_cpu_usage_seconds_total{node="${name}"}[5m]))`
    }
    if (namespaced && name) {
      return `sum(rate(container_cpu_usage_seconds_total{namespace="${namespace}",pod=~"${name}.*"}[5m]))`
    }
    return ''
  }, [resource, namespace, name, namespaced])

  const applyYaml = async () => {
    setBusy(true)
    setErr('')
    try {
      const parsed = yamlLoad(draft) as any
      if (!parsed?.metadata) throw new Error('Invalid YAML object')
      if (parsed.metadata.name && parsed.metadata.name !== name) {
        throw new Error(`metadata.name must remain "${name}"`)
      }
      if (obj?.metadata?.resourceVersion) {
        parsed.metadata.resourceVersion = obj.metadata.resourceVersion
        parsed.metadata.name = name
        if (namespaced) parsed.metadata.namespace = namespace
      }
      if (namespaced) await updateNamespacedResource(namespace, resource, name, parsed)
      else await updateClusterScopedResource(resource, name, parsed)
      await detailQ.refetch()
      setEditing(false)
      setConfirmApply(false)
    } catch (e: any) {
      setErr(e?.message || 'Apply failed')
      setConfirmApply(false)
    } finally {
      setBusy(false)
    }
  }

  const doDelete = async () => {
    setBusy(true)
    setErr('')
    try {
      if (namespaced) await deleteNamespacedResource(namespace, resource, name)
      else await deleteClusterScopedResource(resource, name)
      void queryClient.invalidateQueries({ queryKey: [resource] })
      navigate(`/${resource}`)
    } catch (e: any) {
      setErr(e?.message || 'Delete failed')
    } finally {
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  const doRestart = async () => {
    if (!obj) return
    setBusy(true)
    setErr('')
    try {
      const clone = structuredClone(obj)
      const tpl = clone.spec?.template
      if (!tpl) throw new Error('Resource has no pod template to restart')
      tpl.metadata = tpl.metadata || {}
      tpl.metadata.annotations = {
        ...(tpl.metadata.annotations || {}),
        'cilikube.io/restartedAt': new Date().toISOString(),
      }
      await updateNamespacedResource(namespace, resource, name, clone)
      await detailQ.refetch()
      setConfirmRestart(false)
    } catch (e: any) {
      setErr(e?.message || 'Restart failed')
      setConfirmRestart(false)
    } finally {
      setBusy(false)
    }
  }

  if (!canRead) {
    return <EmptyState>You do not have permission to view this resource.</EmptyState>
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'summary', label: 'Summary' },
    { id: 'events', label: 'Events' },
    { id: 'yaml', label: 'YAML' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'related', label: 'Related' },
  ]

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <PageHeader
        title={name}
        subtitle={namespaced ? `${namespace} · ${resource}` : resource}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              className="px-3 py-1.5 text-xs"
              type="button"
              onClick={goBack}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Link to={listHref} className="text-xs text-cyan hover:underline">
              List
            </Link>
            {investigateHref ? (
              <Link
                to={investigateHref}
                className="inline-flex items-center gap-1 rounded border border-cyan/35 bg-cyan/10 px-3 py-1.5 text-xs font-semibold text-cyan hover:bg-cyan/18"
                title={t('ai.investigateHint')}
              >
                <Bot className="h-3.5 w-3.5" />
                {t('ai.investigate')}
              </Link>
            ) : null}
            {resource === 'pods' ? (
              <>
                <Button
                  variant="outline"
                  className="px-3 py-1.5 text-xs"
                  type="button"
                  onClick={() => openConsole('logs')}
                >
                  Logs
                </Button>
                <Button
                  variant="outline"
                  className="px-3 py-1.5 text-xs"
                  type="button"
                  onClick={() => openConsole('exec')}
                >
                  Terminal
                </Button>
              </>
            ) : null}
            {resource === 'nodes' && obj ? <NodeOpsControls node={obj} /> : null}
            {supportsScale && canWrite ? (
              <Button
                variant="outline"
                className="px-3 py-1.5 text-xs"
                type="button"
                onClick={() => setScaleOpen(true)}
              >
                Scale
              </Button>
            ) : null}
            {supportsRestart && canWrite ? (
              <Button
                variant="outline"
                className="px-3 py-1.5 text-xs"
                type="button"
                onClick={() => setConfirmRestart(true)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Restart
              </Button>
            ) : null}
            {canRemove ? (
              <Button
                variant="danger"
                className="px-3 py-1.5 text-xs"
                type="button"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="-mx-0.5 flex gap-1.5 overflow-x-auto overscroll-x-contain border-b border-line pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id)
              setEditing(false)
            }}
            className={
              tab === t.id
                ? 'shrink-0 rounded border border-cyan/40 bg-cyan/15 px-3 py-2 text-xs font-semibold text-cyan sm:py-1.5'
                : 'shrink-0 rounded border border-transparent px-3 py-2 text-xs font-semibold text-text-dim hover:border-line sm:py-1.5'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {err ? (
        <div className="rounded border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{err}</div>
      ) : null}

      {tab === 'summary' ? (
        <Card className="p-5">
          {detailQ.isLoading ? (
            <EmptyState>Loading…</EmptyState>
          ) : (
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <div className="hud-label">Kind</div>
                <div className="mt-1 font-semibold">{kind}</div>
              </div>
              <div>
                <div className="hud-label">Age</div>
                <div className="mt-1">
                  <AgeCell value={obj?.metadata?.creationTimestamp} />
                </div>
              </div>
              <div>
                <div className="hud-label">Created</div>
                <div className="mt-1">
                  <CreatedCell value={obj?.metadata?.creationTimestamp} />
                </div>
              </div>
              {obj?.status?.phase || obj?.status?.conditions ? (
                <div>
                  <div className="hud-label">Status</div>
                  <div className="mt-1">
                    <Badge tone="accent">
                      {obj?.status?.phase ||
                        obj?.status?.conditions?.[0]?.type ||
                        '-'}
                    </Badge>
                  </div>
                </div>
              ) : null}
              {resource === 'pods' ? (
                <div className="md:col-span-2 rounded border border-line bg-mist px-3 py-3">
                  <div className="hud-label mb-2">Live usage (metrics-server)</div>
                  {!podMetrics.available ? (
                    <p className="text-xs text-text-dim">
                      {podMetrics.message || 'metrics-server unavailable'}
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-6">
                      <div>
                        <div className="text-[10px] text-text-dim">CPU</div>
                        <div className="font-mono text-sm">{podSnap?.cpu || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-text-dim">%CPU/R</div>
                        <PercentCell
                          percent={podSnap?.cpuRequestPercent}
                          ratio={podSnap?.cpuRequestRatio}
                          hint={podSnap?.cpuRequest}
                        />
                      </div>
                      <div>
                        <div className="text-[10px] text-text-dim">%CPU/L</div>
                        <PercentCell
                          percent={podSnap?.cpuLimitPercent}
                          ratio={podSnap?.cpuLimitRatio}
                          hint={podSnap?.cpuLimit}
                        />
                      </div>
                      <div>
                        <div className="text-[10px] text-text-dim">MEM</div>
                        <div className="font-mono text-sm">{podSnap?.memory || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-text-dim">%MEM/R</div>
                        <PercentCell
                          percent={podSnap?.memoryRequestPercent}
                          ratio={podSnap?.memoryRequestRatio}
                          hint={podSnap?.memoryRequest}
                        />
                      </div>
                      <div>
                        <div className="text-[10px] text-text-dim">%MEM/L</div>
                        <PercentCell
                          percent={podSnap?.memoryLimitPercent}
                          ratio={podSnap?.memoryLimitRatio}
                          hint={podSnap?.memoryLimit}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
              <div className="md:col-span-2">
                <div className="hud-label">Labels</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(obj?.metadata?.labels || {}).length
                    ? Object.entries(obj.metadata.labels).map(([k, v]) => (
                        <Badge key={k} tone="neutral">
                          {k}={String(v)}
                        </Badge>
                      ))
                    : '-'}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="hud-label">Owner references</div>
                <div className="mt-1 text-text-dim">
                  {owners.length
                    ? owners.map((o) => `${o.kind}/${o.name}`).join(', ')
                    : 'None'}
                </div>
              </div>
            </div>
          )}
        </Card>
      ) : null}

      {tab === 'events' ? (
        <Card className="overflow-hidden">
          <HudTableScroll>
          <HudTable>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Message</th>
                  <th>Last</th>
                </tr>
              </thead>
              <tbody>
                {(eventsQ.data?.events || []).map((e: any) => (
                  <tr key={e.id || `${e.reason}-${e.lastTime}`}>
                    <td>
                      <Badge tone={e.type === 'Warning' ? 'warn' : 'ok'}>{e.type || 'Normal'}</Badge>
                    </td>
                    <td className="font-semibold">{e.reason}</td>
                    <td className="max-w-md truncate text-text-dim">{e.message}</td>
                    <td className="text-text-dim">{e.lastTime || '-'}</td>
                  </tr>
                ))}
                {!eventsQ.isLoading && !(eventsQ.data?.events || []).length ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState>No events for this object.</EmptyState>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </HudTable>
          </HudTableScroll>
        </Card>
      ) : null}

      {tab === 'yaml' ? (
        <Card className="overflow-hidden">
          <div className="flex justify-end gap-2 border-b border-line px-4 py-2">
            {canWrite ? (
              editing ? (
                <>
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-xs"
                    type="button"
                    onClick={() => {
                      setEditing(false)
                      setDraft(yamlText)
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="px-3 py-1.5 text-xs"
                    type="button"
                    onClick={() => setConfirmApply(true)}
                  >
                    <Save className="h-3.5 w-3.5" />
                    Apply
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  className="px-3 py-1.5 text-xs"
                  type="button"
                  onClick={() => {
                    setDraft(yamlText)
                    setEditing(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              )
            ) : null}
          </div>
          {editing ? (
            <textarea
              className="m-0 h-[min(60vh,55dvh)] w-full resize-none term-surface px-3 py-3 font-mono text-[12px] outline-none sm:h-[60vh] sm:px-4"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <pre className="m-0 h-[min(60vh,55dvh)] overflow-auto term-surface px-3 py-3 font-mono text-[12px] whitespace-pre sm:h-[60vh] sm:px-4">
              {detailQ.isLoading ? '# loading…' : yamlText}
            </pre>
          )}
        </Card>
      ) : null}

      {tab === 'metrics' ? (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold tracking-[0.12em]">CPU (1h)</h2>
            <Badge tone="neutral">Prometheus · time axis</Badge>
          </div>
          <p className="mb-3 font-mono text-[11px] text-text-dim">{promQuery || 'n/a'}</p>
          {promQuery ? <PromTimeChart query={promQuery} hours={1} /> : <EmptyState>No query for this resource.</EmptyState>}
        </Card>
      ) : null}

      {tab === 'related' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-3 font-display text-sm font-bold tracking-[0.12em]">OWNERS</h2>
            {owners.length ? (
              <ul className="space-y-2 text-sm">
                {owners.map((o) => (
                  <li key={`${o.kind}/${o.name}`} className="flex items-center gap-2">
                    <Badge tone="neutral">{o.kind}</Badge>
                    <span className="font-semibold text-cyan">{o.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>No ownerReferences (root object).</EmptyState>
            )}
            <div className="mt-4 rounded border border-line/60 term-surface px-3 py-4 font-mono text-[11px] opacity-90">
              <div className="mb-2 text-cyan">{kind}/{name}</div>
              {owners.map((o) => (
                <div key={`edge-${o.kind}-${o.name}`}>↑ owned by {o.kind}/{o.name}</div>
              ))}
              {(relatedQ.data || []).slice(0, 12).map((p: any) => (
                <div key={`pod-${metaName(p)}`}>↓ Pod/{metaName(p)}</div>
              ))}
              {(relatedQ.data || []).length > 12 ? (
                <div>… +{(relatedQ.data || []).length - 12} more</div>
              ) : null}
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="border-b border-line px-4 py-3 font-display text-sm tracking-[0.12em]">
              RELATED PODS ({(relatedQ.data || []).length})
            </div>
            <HudTableScroll maxHeightClass="max-h-[50vh]">
              <HudTable>
                <thead>
                  <tr>
                    <th>Kind</th>
                    <th>{t('common.name')}</th>
                    <th>Phase</th>
                  </tr>
                </thead>
                <tbody>
                  {(relatedQ.data || []).map((p: any) => (
                    <tr key={`pod-row-${metaName(p)}`}>
                      <td>Pod</td>
                      <td>
                        <Link
                          className="text-cyan hover:underline"
                          to={`/pods/${namespace}/${metaName(p)}`}
                        >
                          {metaName(p)}
                        </Link>
                      </td>
                      <td>{p.status?.phase || '-'}</td>
                    </tr>
                  ))}
                  {!relatedQ.isLoading && !(relatedQ.data || []).length ? (
                    <tr>
                      <td colSpan={3}>
                        <EmptyState>
                          No related pods (ownerRef / selector). Check Summary for owners.
                        </EmptyState>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </HudTable>
            </HudTableScroll>
          </Card>
        </div>
      ) : null}

      <ScaleDialog
        open={scaleOpen}
        resourceName={`${namespace}/${name}`}
        current={obj?.spec?.replicas ?? 0}
        busy={scaleBusy}
        onClose={() => setScaleOpen(false)}
        onConfirm={async (replicas) => {
          setScaleBusy(true)
          setErr('')
          try {
            await apiPatch(`/api/v1/namespaces/${namespace}/${resource}/${name}`, {
              spec: { replicas },
            })
            await detailQ.refetch()
            setScaleOpen(false)
          } catch (e: any) {
            setErr(e?.message || 'Scale failed')
          } finally {
            setScaleBusy(false)
          }
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete resource"
        confirmText={name}
        confirmLabel="Delete"
        busy={busy}
        description={`Delete ${namespaced ? `${namespace}/` : ''}${name}?`}
        onClose={() => setConfirmDelete(false)}
        onConfirm={doDelete}
      />
      <ConfirmDialog
        open={confirmApply}
        title="Apply YAML"
        danger={false}
        confirmLabel="Apply"
        busy={busy}
        description="Apply YAML changes to this resource?"
        onClose={() => setConfirmApply(false)}
        onConfirm={applyYaml}
      />
      <ConfirmDialog
        open={confirmRestart}
        title="Restart workload"
        danger={false}
        confirmLabel="Restart"
        busy={busy}
        description={`Restart ${resource} ${namespace}/${name} by rolling pods?`}
        onClose={() => setConfirmRestart(false)}
        onConfirm={doRestart}
      />
      {resource === 'pods' ? (
        <PodWorkbench
          open={consoleOpen}
          pod={obj || { metadata: { name, namespace } }}
          initialTab={(consoleTab as 'logs' | 'exec' | 'attach' | 'yaml') || 'logs'}
          onClose={() => {
            const next = new URLSearchParams(searchParams)
            next.delete('console')
            setSearchParams(next, { replace: true })
          }}
          onDeleted={() => {
            void queryClient.invalidateQueries({ queryKey: ['detail', clusterId, resource, namespace, name] })
            navigate('/pods')
          }}
        />
      ) : null}
    </div>
  )
}
