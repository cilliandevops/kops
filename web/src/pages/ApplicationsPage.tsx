import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getApplication, listApplications } from '@/api/application'
import { useCluster } from '@/store/cluster'
import { ALL_NAMESPACES, useNamespace } from '@/store/namespace'
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui'
import { HudTable, HudTableScroll } from '@/components/HudTableScroll'

export function ApplicationsPage() {
  const { t } = useTranslation()
  const { clusterId } = useCluster()
  const { namespace } = useNamespace()
  const q = useQuery({
    queryKey: ['applications', clusterId, namespace],
    queryFn: () => listApplications(namespace === ALL_NAMESPACES ? undefined : namespace),
    enabled: Boolean(clusterId),
  })
  const items = q.data || []

  return (
    <div className="space-y-5">
      <PageHeader title={t('applications.title')} subtitle={t('applications.subtitle')} />
      <HudTableScroll>
        <HudTable>
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('common.namespace')}</th>
              <th>{t('common.status')}</th>
              <th>{t('applications.replicas')}</th>
              <th>{t('applications.images')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={`${a.namespace}/${a.name}`}>
                <td>
                  <Link className="font-semibold text-cyan hover:underline" to={`/applications/${a.namespace}/${a.name}`}>
                    {a.name}
                  </Link>
                </td>
                <td>{a.namespace}</td>
                <td>
                  <Badge tone={a.status === 'healthy' ? 'ok' : a.status === 'unhealthy' ? 'danger' : 'warn'}>{a.status}</Badge>
                </td>
                <td>
                  {a.readyReplicas}/{a.replicas}
                </td>
                <td className="max-w-[20rem] truncate font-mono text-xs">{(a.images || []).join(', ') || '—'}</td>
                <td className="flex flex-wrap gap-2">
                  <Link className="text-xs text-cyan hover:underline" to={`/topology?namespace=${a.namespace}`}>
                    {t('nav.topology')}
                  </Link>
                  <Link
                    className="text-xs text-cyan hover:underline"
                    to={`/ai?q=${encodeURIComponent(`investigate app ${a.name} in ${a.namespace}`)}`}
                  >
                    {t('nav.ai')}
                  </Link>
                </td>
              </tr>
            ))}
            {!q.isLoading && !items.length ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState>{t('applications.empty')}</EmptyState>
                </td>
              </tr>
            ) : null}
          </tbody>
        </HudTable>
      </HudTableScroll>
    </div>
  )
}

export function ApplicationDetailPage() {
  const { t } = useTranslation()
  const { namespace = '', name = '' } = useParams()
  const { clusterId } = useCluster()
  const q = useQuery({
    queryKey: ['application', clusterId, namespace, name],
    queryFn: () => getApplication(namespace, name),
    enabled: Boolean(clusterId && namespace && name),
  })
  const a = q.data

  if (q.isLoading) return <div className="text-sm text-text-dim">{t('common.loading')}</div>
  if (!a) return <EmptyState>{t('applications.empty')}</EmptyState>

  const section = (title: string, kind: string, refs: { name: string }[]) => (
    <Card className="space-y-2 p-4">
      <h3 className="font-display text-sm tracking-[0.12em]">{title}</h3>
      {refs.length ? (
        <ul className="space-y-1 text-sm">
          {refs.map((r) => (
            <li key={r.name}>
              <Link className="text-cyan hover:underline" to={`/${kind}/${a.namespace}/${r.name}`}>
                {r.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-text-dim">—</p>
      )}
    </Card>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title={a.name}
        subtitle={`${a.namespace} · ${a.readyReplicas}/${a.replicas} · ${(a.images || []).join(', ')}`}
        action={
          <div className="flex gap-2">
            <Link className="text-sm text-cyan hover:underline" to="/applications">
              {t('common.back')}
            </Link>
            <Link className="text-sm text-cyan hover:underline" to={`/topology?namespace=${a.namespace}`}>
              {t('nav.topology')}
            </Link>
            <Link
              className="text-sm text-cyan hover:underline"
              to={`/ai?q=${encodeURIComponent(`investigate app ${a.name} in ${a.namespace}`)}`}
            >
              {t('nav.ai')}
            </Link>
          </div>
        }
      />
      {a.reason ? <p className="text-sm text-text-dim">{a.reason}</p> : null}
      <div className="grid gap-3 md:grid-cols-3">
        {section(t('nav.deployments'), 'deployments', a.deployments || [])}
        {section(t('nav.services'), 'services', a.services || [])}
        {section(t('nav.ingress'), 'ingresses', a.ingresses || [])}
      </div>
    </div>
  )
}
