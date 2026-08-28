import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dump as yamlDump, load as yamlLoad } from 'js-yaml'
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { useCluster } from '@/store/cluster'
import { Badge, Button, Card, EmptyState, Modal, PageHeader } from '@/components/ui'
import { HudTable, HudTableScroll } from '@/components/HudTableScroll'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useTranslation } from 'react-i18next'

type CrdRow = {
  name?: string
  group?: string
  version?: string
  kind?: string
  plural?: string
  scope?: string
  metadata?: { name?: string }
  spec?: {
    group?: string
    scope?: string
    version?: string
    versions?: Array<{ name?: string; storage?: boolean }>
    names?: { plural?: string; kind?: string }
  }
}

type CrInstance = {
  name?: string
  namespace?: string
  kind?: string
  apiVersion?: string
  createdAt?: string
  labels?: Record<string, string>
  annotations?: Record<string, string>
  spec?: Record<string, unknown>
  status?: Record<string, unknown>
  metadata?: { name?: string; namespace?: string }
}

function crdName(c: CrdRow) {
  return c.metadata?.name || c.name || ''
}
function crdGroup(c: CrdRow) {
  return c.spec?.group || c.group || ''
}
function crdVersion(c: CrdRow) {
  return (
    c.version ||
    c.spec?.versions?.find((v) => v.storage)?.name ||
    c.spec?.versions?.[0]?.name ||
    c.spec?.version ||
    ''
  )
}
function crdPlural(c: CrdRow) {
  return c.plural || c.spec?.names?.plural || ''
}
function crdKind(c: CrdRow) {
  return c.kind || c.spec?.names?.kind || ''
}
function crdScope(c: CrdRow) {
  return c.scope || c.spec?.scope || '-'
}

function instanceToYaml(item: CrInstance): string {
  const obj = {
    apiVersion: item.apiVersion,
    kind: item.kind,
    metadata: {
      name: item.name || item.metadata?.name,
      namespace: item.namespace || item.metadata?.namespace,
      labels: item.labels,
      annotations: item.annotations,
    },
    spec: item.spec,
    status: item.status,
  }
  try {
    return yamlDump(obj, { lineWidth: 120, noRefs: true })
  } catch {
    return JSON.stringify(obj, null, 2)
  }
}

function toCrRequest(parsed: any) {
  return {
    apiVersion: parsed.apiVersion,
    kind: parsed.kind,
    metadata: parsed.metadata || {},
    spec: parsed.spec,
  }
}

export function CrdsPage() {
  const { t } = useTranslation()
  const { clusterId } = useCluster()
  const { canEdit, isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const canWrite = isAdmin || canEdit
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<CrdRow | null>(null)
  const [instance, setInstance] = useState<CrInstance | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmApply, setConfirmApply] = useState(false)

  const crdsQ = useQuery({
    queryKey: ['crds', clusterId],
    enabled: Boolean(clusterId),
    queryFn: () => apiGet<any>('/api/v1/crds'),
  })

  const crds = useMemo(() => {
    const raw = crdsQ.data
    const items: CrdRow[] = Array.isArray(raw) ? raw : raw?.items || raw?.crds || []
    const q = filter.trim().toLowerCase()
    if (!q) return items
    return items.filter((c) => {
      const name = crdName(c)
      const group = crdGroup(c)
      const kind = crdKind(c)
      return (
        name.toLowerCase().includes(q) ||
        group.toLowerCase().includes(q) ||
        String(kind).toLowerCase().includes(q)
      )
    })
  }, [crdsQ.data, filter])

  const group = selected ? crdGroup(selected) : ''
  const version = selected ? crdVersion(selected) : ''
  const plural = selected ? crdPlural(selected) : ''
  const kind = selected ? crdKind(selected) : ''
  const basePath =
    group && version && plural
      ? `/api/v1/crds/resources/${group}/${version}/${plural}`
      : ''

  const instancesQ = useQuery({
    queryKey: ['crd-instances', clusterId, group, version, plural],
    enabled: Boolean(basePath),
    queryFn: () => apiGet<any>(basePath),
  })

  const instances: CrInstance[] = useMemo(() => {
    const raw = instancesQ.data
    return Array.isArray(raw) ? raw : raw?.items || []
  }, [instancesQ.data])

  const openInstance = async (item: CrInstance) => {
    setErr('')
    setEditing(false)
    const name = item.name || item.metadata?.name || ''
    const ns = item.namespace || item.metadata?.namespace || ''
    try {
      const full = await apiGet<CrInstance>(`${basePath}/${encodeURIComponent(name)}`, {
        ...(ns ? { namespace: ns } : {}),
      })
      setInstance(full)
      setDraft(instanceToYaml(full))
    } catch {
      setInstance(item)
      setDraft(instanceToYaml(item))
    }
  }

  const openCreate = () => {
    if (!selected) return
    setCreating(true)
    setEditing(true)
    setErr('')
    const scoped = String(crdScope(selected)).toLowerCase() === 'namespaced'
    setDraft(`apiVersion: ${group}/${version}
kind: ${kind || 'Example'}
metadata:
  name: example
${scoped ? '  namespace: default\n' : ''}spec: {}
`)
  }

  const apply = async () => {
    setBusy(true)
    setErr('')
    try {
      const parsed = yamlLoad(draft) as any
      if (!parsed?.metadata?.name) throw new Error('metadata.name is required')
      const body = toCrRequest(parsed)
      const ns = parsed.metadata?.namespace as string | undefined
      if (creating) {
        await apiPost(
          ns ? `${basePath}?namespace=${encodeURIComponent(ns)}` : basePath,
          body,
        )
      } else {
        const name = instance?.name || instance?.metadata?.name || parsed.metadata.name
        const existingNs = instance?.namespace || instance?.metadata?.namespace || ns
        await apiPut(
          existingNs
            ? `${basePath}/${encodeURIComponent(name)}?namespace=${encodeURIComponent(existingNs)}`
            : `${basePath}/${encodeURIComponent(name)}`,
          body,
        )
      }
      setConfirmApply(false)
      setCreating(false)
      setInstance(null)
      void queryClient.invalidateQueries({
        queryKey: ['crd-instances', clusterId, group, version, plural],
      })
    } catch (e: any) {
      setErr(e?.message || 'Apply failed')
      setConfirmApply(false)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!instance) return
    setBusy(true)
    setErr('')
    try {
      const name = instance.name || instance.metadata?.name || ''
      const ns = instance.namespace || instance.metadata?.namespace || ''
      await apiDelete(
        `${basePath}/${encodeURIComponent(name)}${
          ns ? `?namespace=${encodeURIComponent(ns)}` : ''
        }`,
      )
      setConfirmDelete(false)
      setInstance(null)
      void queryClient.invalidateQueries({ queryKey: ['crd-instances', clusterId, group, version, plural] })
    } catch (e: any) {
      setErr(e?.message || 'Delete failed')
      setConfirmDelete(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <PageHeader title={t('crds.title')} subtitle={t('crds.subtitle')} />
      <label className="block max-w-md space-y-1">
        <span className="hud-label">Filter</span>
        <input
          className="hud-field"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="name, group or kind"
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-3 font-display text-sm tracking-[0.12em]">
            DEFINITIONS ({crds.length})
          </div>
          <HudTableScroll maxHeightClass="max-h-[60vh]">
            <HudTable>
              <thead>
                <tr>
                  <th>{t('common.name')}</th>
                  <th>Group</th>
                  <th>Scope</th>
                </tr>
              </thead>
              <tbody>
                {crds.map((c) => {
                  const name = crdName(c)
                  const active = selected ? crdName(selected) === name : false
                  return (
                    <tr
                      key={name}
                      className={active ? 'bg-cyan/10' : 'cursor-pointer'}
                      onClick={() => setSelected(c)}
                    >
                      <td className="font-semibold text-cyan">{name}</td>
                      <td>{crdGroup(c) || '-'}</td>
                      <td>
                        <Badge tone="neutral">{crdScope(c)}</Badge>
                      </td>
                    </tr>
                  )
                })}
                {!crdsQ.isLoading && !crds.length ? (
                  <tr>
                    <td colSpan={3}>
                      <EmptyState>No CRDs found.</EmptyState>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </HudTable>
          </HudTableScroll>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="font-display text-sm tracking-[0.12em]">
              INSTANCES {selected ? `· ${plural || crdName(selected)}` : ''}
            </div>
            {selected && canWrite ? (
              <Button
                type="button"
                variant="outline"
                className="px-3 py-1.5 text-xs"
                onClick={openCreate}
              >
                Create YAML
              </Button>
            ) : null}
          </div>
          {!selected ? (
            <EmptyState>{t('crds.selectHint')}</EmptyState>
          ) : (
            <HudTableScroll maxHeightClass="max-h-[60vh]">
            <HudTable>
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('common.namespace')}</th>
                  </tr>
                </thead>
                <tbody>
                  {instances.map((item) => {
                    const name = item.name || item.metadata?.name
                    const ns = item.namespace || item.metadata?.namespace || '-'
                    return (
                      <tr
                        key={`${ns}/${name}`}
                        className="cursor-pointer hover:bg-cyan/5"
                        onClick={() => void openInstance(item)}
                      >
                        <td className="font-semibold text-cyan">{name}</td>
                        <td>{ns}</td>
                      </tr>
                    )
                  })}
                  {!instancesQ.isLoading && !instances.length ? (
                    <tr>
                      <td colSpan={2}>
                        <EmptyState>
                          {instancesQ.isError
                            ? 'Failed to load instances.'
                            : 'No custom resources.'}
                        </EmptyState>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </HudTable>
            </HudTableScroll>
          )}
        </Card>
      </div>

      <Modal
        open={Boolean(instance) || creating}
        wide
        title={creating ? `CREATE ${kind}` : `CR · ${instance?.name || instance?.metadata?.name || ''}`}
        subtitle={
          creating
            ? `${group}/${version}/${plural}`
            : `${instance?.namespace || instance?.metadata?.namespace || 'cluster'} · ${kind}`
        }
        onClose={() => {
          setInstance(null)
          setCreating(false)
          setEditing(false)
        }}
      >
        <div className="flex flex-col">
          {err ? (
            <div className="border-b border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
              {err}
            </div>
          ) : null}
          <div className="flex justify-end gap-2 border-b border-line px-4 py-2">
            {canWrite ? (
              editing ? (
                <>
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-xs"
                    type="button"
                    onClick={() => {
                      if (creating) {
                        setCreating(false)
                      } else {
                        setEditing(false)
                        if (instance) setDraft(instanceToYaml(instance))
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="px-3 py-1.5 text-xs"
                    type="button"
                    onClick={() => setConfirmApply(true)}
                  >
                    {creating ? 'Create' : 'Apply'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="px-3 py-1.5 text-xs"
                    type="button"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    className="px-3 py-1.5 text-xs"
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete
                  </Button>
                </>
              )
            ) : null}
          </div>
          {editing ? (
            <textarea
              className="m-0 h-[55vh] w-full resize-none term-surface px-4 py-3 font-mono text-[12px] outline-none"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <pre className="m-0 h-[55vh] overflow-auto term-surface px-4 py-3 font-mono text-[12px] whitespace-pre">
              {draft}
            </pre>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmApply}
        title={creating ? 'CREATE CUSTOM RESOURCE' : 'APPLY YAML'}
        danger={false}
        confirmLabel={creating ? 'Create' : 'Apply'}
        busy={busy}
        description="Apply YAML to the custom resource?"
        onClose={() => setConfirmApply(false)}
        onConfirm={apply}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete custom resource"
        confirmText={instance?.name || instance?.metadata?.name}
        confirmLabel="Delete"
        busy={busy}
        description="Permanently delete this custom resource instance."
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
    </div>
  )
}
