import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { Badge } from '@/components/ui'
import { ResourceListPage, ageCell, createdCell } from '@/components/ResourceListPage'
import {
  listClusterResource,
  listNamespacedResource,
  metaName,
  metaNamespace,
} from '@/api/resources'
import { useNamespace } from '@/store/namespace'
import { useYamlModal } from '@/hooks/useYamlModal'

function NameLink({
  resource,
  item,
  namespaced = true,
}: {
  resource: string
  item: any
  namespaced?: boolean
}) {
  const location = useLocation()
  const name = metaName(item)
  const ns = metaNamespace(item)
  const to = namespaced ? `/${resource}/${ns}/${name}` : `/${resource}/${name}`
  return (
    <Link
      className="font-semibold text-cyan hover:underline"
      to={to}
      title={name}
      state={{ from: `${location.pathname}${location.search}` }}
    >
      {name}
    </Link>
  )
}

function nameLink(resource: string, item: any, namespaced = true) {
  return <NameLink resource={resource} item={item} namespaced={namespaced} />
}

/** Cell for a list of strings that can get long — truncate with a full-value tooltip. */
function listCell(values: unknown[], max = 3) {
  const items = (values || []).filter(Boolean).map(String)
  if (!items.length) return '-'
  const shown = items.slice(0, max).join(', ')
  const rest = items.length - max
  return (
    <span className="font-mono text-xs" title={items.join(', ')}>
      {shown}
      {rest > 0 ? ` +${rest}` : ''}
    </span>
  )
}

function ownerCell(item: any) {
  const owner = (item?.metadata?.ownerReferences || [])[0]
  if (!owner) return '-'
  return (
    <span className="font-mono text-xs" title={`${owner.kind}/${owner.name}`}>
      {owner.kind}/{owner.name}
    </span>
  )
}

// --- Workloads ---

export function ReplicaSetsPage() {
  const { namespace } = useNamespace()
  const { yamlButton, yamlModal } = useYamlModal('replicasets', true)
  return (
    <>
      <ResourceListPage
        titleKey="nav.replicasets"
        namespaced
        resourceKey="replicasets"
        queryFn={() => listNamespacedResource(namespace, 'replicasets')}
        columns={[
          { key: 'name', headerKey: 'common.name', render: (item) => nameLink('replicasets', item) },
          { key: 'ns', headerKey: 'common.namespace', render: (item) => metaNamespace(item) },
          {
            key: 'ready',
            header: 'Ready',
            render: (item) => {
              const desired = item.spec?.replicas ?? 0
              const ready = item.status?.readyReplicas ?? 0
              return (
                <Badge tone={desired > 0 && ready === desired ? 'ok' : desired === 0 ? 'neutral' : 'warn'}>
                  {ready}/{desired}
                </Badge>
              )
            },
          },
          { key: 'current', header: 'Current', render: (item) => item.status?.replicas ?? 0 },
          { key: 'owner', header: 'Owner', render: ownerCell },
          {
            key: 'images',
            header: 'Images',
            render: (item) => listCell((item.spec?.template?.spec?.containers || []).map((c: any) => c.image), 2),
          },
          { key: 'age', headerKey: 'common.age', render: ageCell },
          { key: 'created', headerKey: 'common.created', render: createdCell },
        ]}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}

export function ReplicationControllersPage() {
  const { namespace } = useNamespace()
  const { yamlButton, yamlModal } = useYamlModal('replicationcontrollers', true)
  return (
    <>
      <ResourceListPage
        titleKey="nav.replicationcontrollers"
        namespaced
        resourceKey="replicationcontrollers"
        queryFn={() => listNamespacedResource(namespace, 'replicationcontrollers')}
        columns={[
          {
            key: 'name',
            headerKey: 'common.name',
            render: (item) => nameLink('replicationcontrollers', item),
          },
          { key: 'ns', headerKey: 'common.namespace', render: (item) => metaNamespace(item) },
          {
            key: 'ready',
            header: 'Ready',
            render: (item) => {
              const desired = item.spec?.replicas ?? 0
              const ready = item.status?.readyReplicas ?? 0
              return (
                <Badge tone={desired > 0 && ready === desired ? 'ok' : desired === 0 ? 'neutral' : 'warn'}>
                  {ready}/{desired}
                </Badge>
              )
            },
          },
          { key: 'current', header: 'Current', render: (item) => item.status?.replicas ?? 0 },
          { key: 'age', headerKey: 'common.age', render: ageCell },
          { key: 'created', headerKey: 'common.created', render: createdCell },
        ]}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}

export function PodTemplatesPage() {
  const { namespace } = useNamespace()
  const { yamlButton, yamlModal } = useYamlModal('podtemplates', true)
  return (
    <>
      <ResourceListPage
        titleKey="nav.podtemplates"
        namespaced
        resourceKey="podtemplates"
        queryFn={() => listNamespacedResource(namespace, 'podtemplates')}
        columns={[
          { key: 'name', headerKey: 'common.name', render: (item) => nameLink('podtemplates', item) },
          { key: 'ns', headerKey: 'common.namespace', render: (item) => metaNamespace(item) },
          {
            key: 'containers',
            header: 'Containers',
            render: (item) => listCell((item.template?.spec?.containers || []).map((c: any) => c.name)),
          },
          {
            key: 'images',
            header: 'Images',
            render: (item) => listCell((item.template?.spec?.containers || []).map((c: any) => c.image), 2),
          },
          { key: 'age', headerKey: 'common.age', render: ageCell },
          { key: 'created', headerKey: 'common.created', render: createdCell },
        ]}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}

// --- Network ---

export function EndpointsPage() {
  const { namespace } = useNamespace()
  const { yamlButton, yamlModal } = useYamlModal('endpoints', true)
  return (
    <>
      <ResourceListPage
        titleKey="nav.endpoints"
        namespaced
        resourceKey="endpoints"
        subtitleKey="resourcePages.endpoints.subtitle"
        queryFn={() => listNamespacedResource(namespace, 'endpoints')}
        columns={[
          { key: 'name', headerKey: 'common.name', render: (item) => nameLink('endpoints', item) },
          { key: 'ns', headerKey: 'common.namespace', render: (item) => metaNamespace(item) },
          {
            key: 'addresses',
            header: 'Addresses',
            render: (item) =>
              listCell(
                (item.subsets || []).flatMap((s: any) => (s.addresses || []).map((a: any) => a.ip)),
                3,
              ),
          },
          {
            key: 'ports',
            header: 'Ports',
            render: (item) =>
              listCell(
                (item.subsets || []).flatMap((s: any) =>
                  (s.ports || []).map((p: any) => `${p.port}/${p.protocol || 'TCP'}`),
                ),
                4,
              ),
          },
          {
            key: 'notready',
            header: 'Not ready',
            render: (item) => {
              const count = (item.subsets || []).reduce(
                (sum: number, s: any) => sum + (s.notReadyAddresses || []).length,
                0,
              )
              return count > 0 ? <Badge tone="warn">{count}</Badge> : <Badge tone="neutral">0</Badge>
            },
          },
          { key: 'age', headerKey: 'common.age', render: ageCell },
          { key: 'created', headerKey: 'common.created', render: createdCell },
        ]}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}

export function EndpointSlicesPage() {
  const { namespace } = useNamespace()
  const { yamlButton, yamlModal } = useYamlModal('endpointslices', true)
  return (
    <>
      <ResourceListPage
        titleKey="nav.endpointslices"
        namespaced
        resourceKey="endpointslices"
        queryFn={() => listNamespacedResource(namespace, 'endpointslices')}
        columns={[
          { key: 'name', headerKey: 'common.name', render: (item) => nameLink('endpointslices', item) },
          { key: 'ns', headerKey: 'common.namespace', render: (item) => metaNamespace(item) },
          {
            key: 'family',
            header: 'Address type',
            render: (item) => <Badge tone="neutral">{item.addressType || '-'}</Badge>,
          },
          {
            key: 'service',
            header: 'Service',
            render: (item) => {
              const svc = item.metadata?.labels?.['kubernetes.io/service-name']
              if (!svc) return '-'
              const ns = metaNamespace(item)
              return (
                <Link className="font-mono text-xs text-cyan hover:underline" to={`/services/${ns}/${svc}`}>
                  {svc}
                </Link>
              )
            },
          },
          {
            key: 'endpoints',
            header: 'Endpoints',
            render: (item) => {
              const eps = item.endpoints || []
              const ready = eps.filter((e: any) => e.conditions?.ready !== false).length
              return (
                <Badge tone={eps.length && ready === eps.length ? 'ok' : eps.length ? 'warn' : 'neutral'}>
                  {ready}/{eps.length}
                </Badge>
              )
            },
          },
          {
            key: 'addresses',
            header: 'Addresses',
            render: (item) => listCell((item.endpoints || []).flatMap((e: any) => e.addresses || []), 3),
          },
          {
            key: 'ports',
            header: 'Ports',
            render: (item) =>
              listCell((item.ports || []).map((p: any) => `${p.port}/${p.protocol || 'TCP'}`), 4),
          },
          { key: 'age', headerKey: 'common.age', render: ageCell },
        ]}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}

export function IngressClassesPage() {
  const { t } = useTranslation()
  const { yamlButton, yamlModal } = useYamlModal('ingressclasses', false)
  return (
    <>
      <ResourceListPage
        titleKey="nav.ingressclasses"
        resourceKey="ingressclasses"
        queryFn={() => listClusterResource('ingressclasses')}
        columns={[
          {
            key: 'name',
            headerKey: 'common.name',
            render: (item) => nameLink('ingressclasses', item, false),
          },
          {
            key: 'controller',
            header: 'Controller',
            render: (item) => <span className="font-mono text-xs">{item.spec?.controller || '-'}</span>,
          },
          {
            key: 'params',
            header: 'Parameters',
            render: (item) => {
              const p = item.spec?.parameters
              if (!p) return '-'
              return <span className="font-mono text-xs">{`${p.kind}/${p.name}`}</span>
            },
          },
          {
            key: 'default',
            header: 'Default',
            render: (item) =>
              item.metadata?.annotations?.['ingressclass.kubernetes.io/is-default-class'] === 'true' ? (
                <Badge tone="ok">{t('common.yes')}</Badge>
              ) : (
                <Badge tone="neutral">{t('common.no')}</Badge>
              ),
          },
          { key: 'age', headerKey: 'common.age', render: ageCell },
          { key: 'created', headerKey: 'common.created', render: createdCell },
        ]}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}

export function ServiceCIDRsPage() {
  const { yamlButton, yamlModal } = useYamlModal('servicecidrs', false)
  return (
    <>
      <ResourceListPage
        titleKey="nav.servicecidrs"
        resourceKey="servicecidrs"
        subtitleKey="resourcePages.serviceCidrs.subtitle"
        queryFn={() => listClusterResource('servicecidrs')}
        columns={[
          { key: 'name', headerKey: 'common.name', render: (item) => nameLink('servicecidrs', item, false) },
          {
            key: 'cidrs',
            header: 'CIDRs',
            render: (item) => listCell(item.spec?.cidrs || [], 4),
          },
          {
            key: 'ready',
            header: 'Ready',
            render: (item) => {
              const cond = (item.status?.conditions || []).find((c: any) => c.type === 'Ready')
              if (!cond) return <Badge tone="neutral">Unknown</Badge>
              return <Badge tone={cond.status === 'True' ? 'ok' : 'warn'}>{cond.status}</Badge>
            },
          },
          { key: 'age', headerKey: 'common.age', render: ageCell },
          { key: 'created', headerKey: 'common.created', render: createdCell },
        ]}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}

// --- Cluster / scheduling ---

export function PriorityClassesPage() {
  const { t } = useTranslation()
  const { yamlButton, yamlModal } = useYamlModal('priorityclasses', false)
  return (
    <>
      <ResourceListPage
        titleKey="nav.priorityclasses"
        resourceKey="priorityclasses"
        queryFn={() => listClusterResource('priorityclasses')}
        columns={[
          { key: 'name', headerKey: 'common.name', render: (item) => nameLink('priorityclasses', item, false) },
          {
            key: 'value',
            header: 'Value',
            render: (item) => <span className="font-mono text-xs">{item.value ?? '-'}</span>,
          },
          {
            key: 'global',
            header: 'Global default',
            render: (item) =>
              item.globalDefault ? (
                <Badge tone="accent">{t('common.yes')}</Badge>
              ) : (
                <Badge tone="neutral">{t('common.no')}</Badge>
              ),
          },
          {
            key: 'preemption',
            header: 'Preemption',
            render: (item) => item.preemptionPolicy || 'PreemptLowerPriority',
          },
          {
            key: 'desc',
            header: 'Description',
            render: (item) => (
              <span className="text-xs" title={item.description || ''}>
                {item.description || '-'}
              </span>
            ),
          },
          { key: 'age', headerKey: 'common.age', render: ageCell },
        ]}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}

export function RuntimeClassesPage() {
  const { yamlButton, yamlModal } = useYamlModal('runtimeclasses', false)
  return (
    <>
      <ResourceListPage
        titleKey="nav.runtimeclasses"
        resourceKey="runtimeclasses"
        queryFn={() => listClusterResource('runtimeclasses')}
        columns={[
          { key: 'name', headerKey: 'common.name', render: (item) => nameLink('runtimeclasses', item, false) },
          {
            key: 'handler',
            header: 'Handler',
            render: (item) => <span className="font-mono text-xs">{item.handler || '-'}</span>,
          },
          {
            key: 'nodeSelector',
            header: 'Node selector',
            render: (item) =>
              listCell(
                Object.entries(item.scheduling?.nodeSelector || {}).map(([k, v]) => `${k}=${v}`),
                2,
              ),
          },
          {
            key: 'tolerations',
            header: 'Tolerations',
            render: (item) => (item.scheduling?.tolerations || []).length || 0,
          },
          { key: 'age', headerKey: 'common.age', render: ageCell },
          { key: 'created', headerKey: 'common.created', render: createdCell },
        ]}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}

export function LeasesPage() {
  const { namespace } = useNamespace()
  const { yamlButton, yamlModal } = useYamlModal('leases', true)
  return (
    <>
      <ResourceListPage
        titleKey="nav.leases"
        namespaced
        resourceKey="leases"
        subtitleKey="resourcePages.leases.subtitle"
        queryFn={() => listNamespacedResource(namespace, 'leases')}
        columns={[
          { key: 'name', headerKey: 'common.name', render: (item) => nameLink('leases', item) },
          { key: 'ns', headerKey: 'common.namespace', render: (item) => metaNamespace(item) },
          {
            key: 'holder',
            header: 'Holder',
            render: (item) => (
              <span className="font-mono text-xs" title={item.spec?.holderIdentity || ''}>
                {item.spec?.holderIdentity || '-'}
              </span>
            ),
          },
          {
            key: 'duration',
            header: 'Lease duration',
            render: (item) =>
              item.spec?.leaseDurationSeconds != null ? `${item.spec.leaseDurationSeconds}s` : '-',
          },
          {
            key: 'renew',
            header: 'Renewed',
            render: (item) => <AgeOrDash value={item.spec?.renewTime} />,
          },
          { key: 'age', headerKey: 'common.age', render: ageCell },
        ]}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}

function AgeOrDash({ value }: { value?: string }) {
  const { t } = useTranslation()
  if (!value) return <>-</>
  const ms = Date.now() - new Date(value).getTime()
  if (Number.isNaN(ms)) return <>-</>
  const secs = Math.max(0, Math.round(ms / 1000))
  const mins = Math.round(secs / 60)
  const hours = Math.round(mins / 60)
  // Unit suffixes stay kubectl-style (s/m/h); only the surrounding phrasing is translated.
  const age = secs < 60 ? `${secs}s` : mins < 60 ? `${mins}m` : `${hours}h`
  return <span className="font-mono text-xs">{t('resourcePages.leases.renewedAgo', { age })}</span>
}

// --- Admission control ---

function webhookColumns(resource: string) {
  return [
    { key: 'name', headerKey: 'common.name', render: (item: any) => nameLink(resource, item, false) },
    {
      key: 'webhooks',
      header: 'Webhooks',
      render: (item: any) => (item.webhooks || []).length,
    },
    {
      key: 'targets',
      header: 'Services',
      render: (item: any) =>
        listCell(
          (item.webhooks || []).map((w: any) =>
            w.clientConfig?.service
              ? `${w.clientConfig.service.namespace}/${w.clientConfig.service.name}`
              : w.clientConfig?.url || '',
          ),
          2,
        ),
    },
    {
      key: 'failurePolicy',
      header: 'Failure policy',
      render: (item: any) => {
        const policies = Array.from(
          new Set((item.webhooks || []).map((w: any) => w.failurePolicy || 'Fail')),
        )
        if (!policies.length) return '-'
        return (
          <Badge tone={policies.includes('Fail') ? 'warn' : 'neutral'}>{policies.join(', ')}</Badge>
        )
      },
    },
    {
      key: 'resources',
      header: 'Rules',
      render: (item: any) =>
        listCell(
          (item.webhooks || []).flatMap((w: any) =>
            (w.rules || []).flatMap((r: any) => r.resources || []),
          ),
          3,
        ),
    },
    { key: 'age', headerKey: 'common.age', render: ageCell },
  ]
}

export function MutatingWebhooksPage() {
  const { yamlButton, yamlModal } = useYamlModal('mutatingwebhookconfigurations', false)
  return (
    <>
      <ResourceListPage
        title="MutatingWebhookConfigurations"
        resourceKey="mutatingwebhookconfigurations"
        queryFn={() => listClusterResource('mutatingwebhookconfigurations')}
        columns={webhookColumns('mutatingwebhookconfigurations')}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}

export function ValidatingWebhooksPage() {
  const { yamlButton, yamlModal } = useYamlModal('validatingwebhookconfigurations', false)
  return (
    <>
      <ResourceListPage
        title="ValidatingWebhookConfigurations"
        resourceKey="validatingwebhookconfigurations"
        queryFn={() => listClusterResource('validatingwebhookconfigurations')}
        columns={webhookColumns('validatingwebhookconfigurations')}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}

// --- Storage ---

export function VolumeAttachmentsPage() {
  const { t } = useTranslation()
  const { yamlButton, yamlModal } = useYamlModal('volumeattachments', false)
  return (
    <>
      <ResourceListPage
        titleKey="nav.volumeattachments"
        resourceKey="volumeattachments"
        queryFn={() => listClusterResource('volumeattachments')}
        columns={[
          { key: 'name', headerKey: 'common.name', render: (item) => nameLink('volumeattachments', item, false) },
          {
            key: 'attacher',
            header: 'Attacher',
            render: (item) => <span className="font-mono text-xs">{item.spec?.attacher || '-'}</span>,
          },
          {
            key: 'pv',
            header: 'PersistentVolume',
            render: (item) => {
              const pv = item.spec?.source?.persistentVolumeName
              if (!pv) return '-'
              return (
                <Link className="font-mono text-xs text-cyan hover:underline" to={`/persistentvolumes/${pv}`}>
                  {pv}
                </Link>
              )
            },
          },
          {
            key: 'node',
            header: 'Node',
            render: (item) => {
              const node = item.spec?.nodeName
              if (!node) return '-'
              return (
                <Link className="font-mono text-xs text-cyan hover:underline" to={`/nodes/${node}`}>
                  {node}
                </Link>
              )
            },
          },
          {
            key: 'attached',
            header: 'Attached',
            render: (item) =>
              item.status?.attached ? (
                <Badge tone="ok">{t('common.yes')}</Badge>
              ) : (
                <Badge tone="warn">{t('common.no')}</Badge>
              ),
          },
          { key: 'age', headerKey: 'common.age', render: ageCell },
        ]}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}

export function CSIDriversPage() {
  const { t } = useTranslation()
  const { yamlButton, yamlModal } = useYamlModal('csidrivers', false)
  return (
    <>
      <ResourceListPage
        titleKey="nav.csidrivers"
        resourceKey="csidrivers"
        queryFn={() => listClusterResource('csidrivers')}
        columns={[
          { key: 'name', headerKey: 'common.name', render: (item) => nameLink('csidrivers', item, false) },
          {
            key: 'attach',
            header: 'Attach required',
            render: (item) =>
              item.spec?.attachRequired ? (
                <Badge tone="accent">{t('common.yes')}</Badge>
              ) : (
                <Badge tone="neutral">{t('common.no')}</Badge>
              ),
          },
          {
            key: 'podinfo',
            header: 'Pod info on mount',
            render: (item) => (item.spec?.podInfoOnMount ? t('common.yes') : t('common.no')),
          },
          {
            key: 'modes',
            header: 'Volume modes',
            render: (item) => listCell(item.spec?.volumeLifecycleModes || [], 2),
          },
          {
            key: 'fsgroup',
            header: 'FS group policy',
            render: (item) => item.spec?.fsGroupPolicy || '-',
          },
          { key: 'age', headerKey: 'common.age', render: ageCell },
        ]}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}

export function CSINodesPage() {
  const { yamlButton, yamlModal } = useYamlModal('csinodes', false)
  return (
    <>
      <ResourceListPage
        titleKey="nav.csinodes"
        resourceKey="csinodes"
        queryFn={() => listClusterResource('csinodes')}
        columns={[
          {
            key: 'name',
            headerKey: 'common.name',
            render: (item) => (
              <Link
                className="font-semibold text-cyan hover:underline"
                to={`/nodes/${metaName(item)}`}
                title={metaName(item)}
              >
                {metaName(item)}
              </Link>
            ),
          },
          {
            key: 'drivers',
            header: 'Drivers',
            render: (item) => listCell((item.spec?.drivers || []).map((d: any) => d.name), 2),
          },
          {
            key: 'nodeIds',
            header: 'Node IDs',
            render: (item) => listCell((item.spec?.drivers || []).map((d: any) => d.nodeID), 2),
          },
          {
            key: 'maxVolumes',
            header: 'Max volumes',
            render: (item) =>
              listCell(
                (item.spec?.drivers || [])
                  .map((d: any) => (d.allocatable?.count != null ? String(d.allocatable.count) : ''))
                  .filter(Boolean),
                2,
              ),
          },
          { key: 'age', headerKey: 'common.age', render: ageCell },
        ]}
        actions={(item) => yamlButton(item)}
      />
      {yamlModal}
    </>
  )
}
