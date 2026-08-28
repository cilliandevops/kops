import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  createEnvironment,
  deleteEnvironment,
  listEnvironments,
  type EnvironmentItem,
  type EnvironmentPayload,
} from '@/api/environment'
import { listClusters } from '@/api/cluster'
import { useAuth } from '@/store/auth'
import { useEnvironment } from '@/store/environment'
import { Badge, Button, Card, EmptyState, PageHeader } from '@/components/ui'
import { HudTable, HudTableScroll } from '@/components/HudTableScroll'
import { ConfirmDialog } from '@/components/ConfirmDialog'

const PURPOSES = ['test', 'staging', 'prod', 'other'] as const

export function EnvironmentsPage() {
  const { t } = useTranslation()
  const { isAdmin, canMutate } = useAuth()
  const { applyEnvironment } = useEnvironment()
  const canWrite = isAdmin || canMutate('clusters')
  const [form, setForm] = useState<EnvironmentPayload>({
    name: '',
    cluster_id: '',
    namespace: 'default',
    purpose: 'test',
    description: '',
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EnvironmentItem | null>(null)

  const q = useQuery({ queryKey: ['environments'], queryFn: listEnvironments })
  const clustersQ = useQuery({ queryKey: ['clusters'], queryFn: listClusters })
  const items = q.data || []
  const clusters = clustersQ.data || []

  const submit = async () => {
    if (!form.name.trim() || !form.cluster_id || !form.namespace.trim()) {
      setErr(t('common.required'))
      return
    }
    setBusy(true)
    setErr('')
    try {
      await createEnvironment({ ...form, name: form.name.trim(), namespace: form.namespace.trim() })
      setForm({ name: '', cluster_id: form.cluster_id, namespace: 'default', purpose: 'test', description: '' })
      await q.refetch()
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('common.failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t('environments.title')} subtitle={t('environments.subtitle')} />
      {err ? <div className="rounded border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{err}</div> : null}
      {canWrite ? (
        <Card className="grid gap-3 p-5 md:grid-cols-2">
          <label className="space-y-1">
            <span className="hud-label">{t('common.name')}</span>
            <input className="hud-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="hud-label">{t('nav.cluster')}</span>
            <select className="hud-field" value={form.cluster_id} onChange={(e) => setForm({ ...form, cluster_id: e.target.value })}>
              <option value="">{t('environments.pickCluster')}</option>
              {clusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="hud-label">{t('common.namespace')}</span>
            <input className="hud-field" value={form.namespace} onChange={(e) => setForm({ ...form, namespace: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="hud-label">{t('environments.purpose')}</span>
            <select className="hud-field" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {t(`environments.purposes.${p}`)}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <Button type="button" disabled={busy} onClick={() => void submit()}>
              {t('environments.create')}
            </Button>
          </div>
        </Card>
      ) : null}
      <HudTableScroll>
        <HudTable>
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('nav.cluster')}</th>
              <th>{t('common.namespace')}</th>
              <th>{t('environments.purpose')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id}>
                <td className="font-semibold text-cyan">{e.name}</td>
                <td className="font-mono text-xs">{e.cluster_id}</td>
                <td>{e.namespace}</td>
                <td>
                  <Badge tone={e.purpose === 'prod' ? 'danger' : e.purpose === 'staging' ? 'warn' : 'ok'}>
                    {t(`environments.purposes.${e.purpose}`, { defaultValue: e.purpose })}
                  </Badge>
                </td>
                <td className="flex flex-wrap gap-1">
                  <Button variant="outline" className="px-2 py-1 text-xs" type="button" onClick={() => applyEnvironment(e)}>
                    {t('environments.use')}
                  </Button>
                  {canWrite ? (
                    <Button variant="outline" className="px-2 py-1 text-xs" type="button" onClick={() => setDeleteTarget(e)}>
                      {t('common.delete')}
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
            {!q.isLoading && !items.length ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState>{t('environments.empty')}</EmptyState>
                </td>
              </tr>
            ) : null}
          </tbody>
        </HudTable>
      </HudTableScroll>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('common.delete')}
        description={deleteTarget ? t('environments.deleteConfirm', { name: deleteTarget.name }) : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          await deleteEnvironment(deleteTarget.id)
          setDeleteTarget(null)
          await q.refetch()
        }}
      />
    </div>
  )
}
