import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listClusters, updateCluster, type ClusterItem } from '@/api/cluster'
import { apiDelete, apiGet, apiPost } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { useCluster } from '@/store/cluster'
import { Badge, Button, Card, EmptyState, Modal, PageHeader } from '@/components/ui'
import { HudTable, HudTableScroll } from '@/components/HudTableScroll'
import { ConfirmDialog } from '@/components/ConfirmDialog'

type LocalContext = {
  name: string
  cluster: string
  server: string
  user: string
  conflict_name?: boolean
  conflict_server?: boolean
  existing_name?: string
}

type LocalContextsResp = {
  path: string
  contexts: LocalContext[]
}

export function ClustersPage() {
  const { t } = useTranslation()
  const { isAdmin, canMutate } = useAuth()
  const { clusterId, setClusterId } = useCluster()
  const queryClient = useQueryClient()
  const canWrite = isAdmin || canMutate('clusters')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [kubeconfig, setKubeconfig] = useState('')
  const [createMode, setCreateMode] = useState<'kubeconfig' | 'token'>('kubeconfig')
  const [server, setServer] = useState('')
  const [token, setToken] = useState('')
  const [insecure, setInsecure] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ClusterItem | null>(null)
  const [editTarget, setEditTarget] = useState<ClusterItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editKubeconfig, setEditKubeconfig] = useState('')
  const [selectedContexts, setSelectedContexts] = useState<string[]>([])

  const q = useQuery({
    queryKey: ['clusters-mgmt'],
    queryFn: listClusters,
  })

  const localQ = useQuery({
    queryKey: ['clusters-local-contexts'],
    queryFn: () => apiGet<LocalContextsResp>('/api/v1/clusters/local-contexts'),
    enabled: canWrite,
    staleTime: 15_000,
  })

  const clusters = q.data || []
  const localContexts = useMemo(() => localQ.data?.contexts || [], [localQ.data])
  const isEmpty = !q.isLoading && clusters.length === 0

  const create = async () => {
    if (!name.trim()) {
      setErr(t('clusters.nameRequired'))
      return
    }
    if (createMode === 'kubeconfig' && !kubeconfig.trim()) {
      setErr(t('clusters.kubeRequired'))
      return
    }
    if (createMode === 'token' && (!server.trim() || !token.trim())) {
      setErr(t('clusters.tokenRequired'))
      return
    }
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      await apiPost('/api/v1/clusters', {
        name: name.trim(),
        description: description.trim() || undefined,
        ...(createMode === 'token'
          ? { server: server.trim(), token: token.trim(), insecure }
          : { kubeconfigData: btoa(unescape(encodeURIComponent(kubeconfig))) }),
      })
      setName('')
      setDescription('')
      setKubeconfig('')
      setServer('')
      setToken('')
      setMsg(t('clusters.created'))
      await q.refetch()
      void queryClient.invalidateQueries({ queryKey: ['clusters'] })
      void localQ.refetch()
    } catch (e: any) {
      setErr(e?.message || t('clusters.createFailed'))
    } finally {
      setBusy(false)
    }
  }

  const toggleContext = (ctx: string) => {
    setSelectedContexts((prev) =>
      prev.includes(ctx) ? prev.filter((x) => x !== ctx) : [...prev, ctx],
    )
  }

  const importLocal = async () => {
    if (!selectedContexts.length) {
      setErr(t('clusters.importNeedSelect'))
      return
    }
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      const res = await apiPost<{
        imported: string[]
        skipped: Record<string, string>
        failed: Record<string, string>
      }>('/api/v1/clusters/import-local', {
        contexts: selectedContexts,
        skip_conflicts: true,
      })
      const imported = res?.imported || []
      const skipped = Object.keys(res?.skipped || {})
      const failed = Object.keys(res?.failed || {})
      setMsg(
        t('clusters.importOk', { imported: imported.length }) +
          (skipped.length ? t('clusters.importSkipped', { count: skipped.length }) : '') +
          (failed.length ? t('clusters.importFailedCount', { count: failed.length }) : ''),
      )
      if (failed.length) {
        setErr(Object.entries(res.failed).map(([k, v]) => `${k}: ${v}`).join('; '))
      }
      setSelectedContexts([])
      await q.refetch()
      void queryClient.invalidateQueries({ queryKey: ['clusters'] })
      void localQ.refetch()
    } catch (e: any) {
      setErr(e?.message || t('clusters.importFailed'))
    } finally {
      setBusy(false)
    }
  }

  const setActive = async (id: string) => {
    setBusy(true)
    setErr('')
    try {
      // Shared switcher: server active + topbar selection + query invalidate
      setClusterId(id)
      await q.refetch()
    } catch (e: any) {
      setErr(e?.message || t('clusters.setActiveFailed'))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!deleteTarget?.id) return
    setBusy(true)
    try {
      await apiDelete(`/api/v1/clusters/${deleteTarget.id}`)
      setDeleteTarget(null)
      await q.refetch()
      void queryClient.invalidateQueries({ queryKey: ['clusters'] })
    } catch (e: any) {
      setErr(e?.message || t('clusters.deleteFailed'))
    } finally {
      setBusy(false)
    }
  }

  const openEdit = (c: ClusterItem) => {
    setEditTarget(c)
    setEditName(c.name || '')
    setEditDescription(String(c.description || ''))
    setEditKubeconfig('')
    setErr('')
  }

  const saveEdit = async () => {
    if (!editTarget?.id) return
    if (!editName.trim()) {
      setErr(t('clusters.nameRequired'))
      return
    }
    setBusy(true)
    setErr('')
    try {
      const body: Parameters<typeof updateCluster>[1] = {
        name: editName.trim(),
        description: editDescription.trim(),
      }
      if (editKubeconfig.trim()) {
        body.kubeconfigData = btoa(unescape(encodeURIComponent(editKubeconfig)))
      }
      await updateCluster(String(editTarget.id), body)
      setEditTarget(null)
      await q.refetch()
      void queryClient.invalidateQueries({ queryKey: ['clusters'] })
    } catch (e: any) {
      setErr(e?.message || t('clusters.updateFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <PageHeader title={t('clusters.title')} subtitle={t('clusters.subtitle')} />
      {err ? (
        <div className="rounded border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{err}</div>
      ) : null}
      {msg ? (
        <div className="rounded border border-ok/30 bg-ok/10 px-4 py-2 text-sm text-ok">{msg}</div>
      ) : null}

      {isEmpty && canWrite ? (
        <Card className="space-y-3 border-cyan/40 bg-cyan/5 p-5">
          <h2 className="font-display text-lg font-bold tracking-[0.12em] text-cyan">
            {t('clusters.guideTitle')}
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-text">
            <li>{t('clusters.guideStep1')}</li>
            <li>{t('clusters.guideStep2')}</li>
            <li>{t('clusters.guideStep3')}</li>
            <li>{t('clusters.guideStep4')}</li>
          </ol>
          <p className="text-xs text-text-dim">{t('clusters.emptyHint')}</p>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <HudTableScroll>
          <HudTable>
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>{t('common.status')}</th>
                <th>{t('clusters.version')}</th>
                <th>{t('clusters.source')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {clusters.map((c) => {
                const id = String(c.id || c.name)
                const selected = id === clusterId || c.name === clusterId
                return (
                <tr key={id} className={selected ? 'bg-mist' : undefined}>
                  <td className="font-semibold text-cyan">
                    {c.name}
                    {selected ? (
                      <span className="ml-2 text-[10px] tracking-wider text-ok uppercase">
                        {t('clusters.current')}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <Badge tone={selected || c.status === 'Available' || c.status === 'Active' ? 'ok' : 'neutral'}>
                      {selected ? t('common.active') : c.status || '-'}
                    </Badge>
                  </td>
                  <td>{c.version || '-'}</td>
                  <td className="text-text-dim">{String(c.source || '-')}</td>
                  <td>
                    <div className="flex gap-1">
                      {canWrite ? (
                        <>
                          <Button
                            variant="outline"
                            className="px-2 py-1 text-xs"
                            type="button"
                            disabled={busy || selected}
                            onClick={() => void setActive(id)}
                          >
                            {selected ? t('common.active') : t('common.setActive')}
                          </Button>
                          <Button
                            variant="ghost"
                            className="px-2 py-1 text-xs"
                            type="button"
                            onClick={() => openEdit(c)}
                          >
                            {t('common.edit')}
                          </Button>
                          <Button
                            variant="danger"
                            className="px-2 py-1 text-xs"
                            type="button"
                            onClick={() => setDeleteTarget(c)}
                          >
                            {t('common.delete')}
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-text-dim">{t('common.readOnly')}</span>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
              {!q.isLoading && !clusters.length ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState>{t('clusters.empty')}</EmptyState>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </HudTable>
        </HudTableScroll>
      </Card>

      {canWrite ? (
        <Card
          className={
            isEmpty
              ? 'space-y-3 border-cyan/50 bg-cyan/5 p-5 shadow-[0_0_24px_rgba(53,230,255,0.08)]'
              : 'space-y-3 p-5'
          }
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold tracking-[0.12em]">
                {t('clusters.importLocal')}
              </h2>
              <p className="mt-1 text-[11px] text-text-dim">
                {t('clusters.importSource', { path: localQ.data?.path || '…' })}
              </p>
            </div>
            <Button
              type="button"
              disabled={busy || !selectedContexts.length}
              onClick={() => void importLocal()}
            >
              {t('clusters.importSelected', { count: selectedContexts.length })}
            </Button>
          </div>
          {localQ.isError ? (
            <p className="text-sm text-warn">
              {(localQ.error as Error)?.message || t('clusters.couldNotRead')}
            </p>
          ) : null}
          <div className="overflow-hidden rounded border border-line">
            <HudTableScroll maxHeightClass="max-h-64">
              <HudTable>
                <thead>
                  <tr>
                    <th className="w-10"></th>
                    <th>{t('clusters.context')}</th>
                    <th>{t('clusters.server')}</th>
                    <th>{t('clusters.conflict')}</th>
                  </tr>
                </thead>
                <tbody>
                  {localContexts.map((c) => {
                    const blocked = Boolean(c.conflict_name || c.conflict_server)
                    return (
                      <tr key={c.name} className={blocked ? 'opacity-60' : undefined}>
                        <td>
                          <input
                            type="checkbox"
                            disabled={blocked || busy}
                            checked={selectedContexts.includes(c.name)}
                            onChange={() => toggleContext(c.name)}
                          />
                        </td>
                        <td className="font-mono text-xs text-cyan">{c.name}</td>
                        <td className="font-mono text-[11px] text-text-dim">{c.server || '-'}</td>
                        <td className="text-xs">
                          {c.conflict_name ? (
                            <Badge tone="warn">{t('clusters.conflictName')}</Badge>
                          ) : c.conflict_server ? (
                            <Badge tone="warn">
                              {t('clusters.conflictServer')}
                              {c.existing_name ? `: ${c.existing_name}` : ''}
                            </Badge>
                          ) : (
                            <span className="text-text-dim">{t('clusters.none')}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {!localQ.isLoading && !localContexts.length ? (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState>{t('clusters.noLocal')}</EmptyState>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </HudTable>
            </HudTableScroll>
          </div>
        </Card>
      ) : null}

      {canWrite ? (
        <Card className="space-y-3 p-5">
          <h2 className="font-display text-lg font-bold tracking-[0.12em]">
            {t('clusters.createTitle')}
          </h2>
          <div className="flex gap-2 text-xs">
            <Button
              type="button"
              variant={createMode === 'kubeconfig' ? 'primary' : 'outline'}
              className="px-3 py-1"
              onClick={() => setCreateMode('kubeconfig')}
            >
              {t('clusters.modeKube')}
            </Button>
            <Button
              type="button"
              variant={createMode === 'token' ? 'primary' : 'outline'}
              className="px-3 py-1"
              onClick={() => setCreateMode('token')}
            >
              {t('clusters.modeToken')}
            </Button>
          </div>
          <label className="block space-y-1">
            <span className="hud-label">{t('common.name')}</span>
            <input className="hud-field" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="hud-label">{t('clusters.description')}</span>
            <input
              className="hud-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          {createMode === 'kubeconfig' ? (
          <label className="block space-y-1">
            <span className="hud-label">{t('clusters.kubeconfig')}</span>
            <textarea
              className="hud-field min-h-[160px] font-mono text-xs"
              value={kubeconfig}
              onChange={(e) => setKubeconfig(e.target.value)}
              placeholder={t('clusters.kubeconfig')}
            />
          </label>
          ) : (
            <>
              <label className="block space-y-1">
                <span className="hud-label">{t('clusters.serverUrl')}</span>
                <input
                  className="hud-field font-mono text-xs"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  placeholder="https://127.0.0.1:6443"
                />
              </label>
              <label className="block space-y-1">
                <span className="hud-label">{t('clusters.token')}</span>
                <textarea
                  className="hud-field min-h-[80px] font-mono text-xs"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={insecure} onChange={(e) => setInsecure(e.target.checked)} />
                {t('clusters.insecure')}
              </label>
            </>
          )}
          <Button type="button" disabled={busy} onClick={() => void create()}>
            {t('clusters.create')}
          </Button>
        </Card>
      ) : null}

      <Modal
        open={Boolean(editTarget)}
        title={t('clusters.editTitle')}
        subtitle={editTarget?.name}
        onClose={() => setEditTarget(null)}
      >
        <div className="space-y-3 px-5 py-4">
          <label className="block space-y-1">
            <span className="hud-label">{t('common.name')}</span>
            <input
              className="hud-field"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="hud-label">{t('clusters.description')}</span>
            <input
              className="hud-field"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="hud-label">{t('clusters.replaceKubeOptional')}</span>
            <textarea
              className="hud-field min-h-[140px] font-mono text-xs"
              value={editKubeconfig}
              onChange={(e) => setEditKubeconfig(e.target.value)}
              placeholder={t('clusters.replaceKubeOptional')}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setEditTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" disabled={busy} onClick={() => void saveEdit()}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('clusters.deleteTitle')}
        confirmText={deleteTarget?.name}
        confirmLabel={t('common.delete')}
        busy={busy}
        description={t('clusters.deleteConfirm', { name: deleteTarget?.name || '' })}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </div>
  )
}
