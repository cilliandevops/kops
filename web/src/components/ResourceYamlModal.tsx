import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dump as yamlDump, load as yamlLoad } from 'js-yaml'
import { Pencil, Save, Trash2, X } from 'lucide-react'
import {
  deleteClusterScopedResource,
  deleteNamespacedResource,
  getClusterScopedResource,
  getNamespacedResource,
  metaName,
  metaNamespace,
  updateClusterScopedResource,
  updateNamespacedResource,
} from '@/api/resources'
import { useAuth } from '@/store/auth'
import { useCluster } from '@/store/cluster'
import { Button, Modal } from '@/components/ui'
import { ConfirmDialog } from '@/components/ConfirmDialog'

type Props = {
  open: boolean
  resource: string
  item: any | null
  namespaced?: boolean
  onClose: () => void
}

function toYaml(obj: any): string {
  if (!obj) return ''
  try {
    const clone = structuredClone(obj)
    if (clone.metadata) {
      delete clone.metadata.managedFields
    }
    return yamlDump(clone, { lineWidth: 120, noRefs: true })
  } catch {
    return JSON.stringify(obj, null, 2)
  }
}

export function ResourceYamlModal({ open, resource, item, namespaced = true, onClose }: Props) {
  const { clusterId } = useCluster()
  const { canMutate, canDelete, checkPermission } = useAuth()
  const queryClient = useQueryClient()
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmApply, setConfirmApply] = useState(false)

  const namespace = metaNamespace(item)
  const name = metaName(item)
  const canWrite = canMutate(resource)
  const canRemove = canDelete(resource)
  const canRead = checkPermission(resource, 'read')

  const detailQ = useQuery({
    queryKey: ['resource-detail', clusterId, resource, namespace, name],
    queryFn: () =>
      namespaced
        ? getNamespacedResource(namespace, resource, name)
        : getClusterScopedResource(resource, name),
    enabled: open && canRead && Boolean(name && name !== '-'),
  })

  const yamlText = useMemo(() => toYaml(detailQ.data || item), [detailQ.data, item])

  useEffect(() => {
    if (open) {
      setEditing(false)
      setErr('')
      setDraft(yamlText)
      setConfirmDelete(false)
      setConfirmApply(false)
    }
  }, [open, name, resource])

  useEffect(() => {
    if (!editing) setDraft(yamlText)
  }, [yamlText, editing])

  const applyYaml = async () => {
    setBusy(true)
    setErr('')
    try {
      const parsed = yamlLoad(draft) as any
      if (!parsed || typeof parsed !== 'object') throw new Error('YAML must be an object')
      const parsedName = parsed?.metadata?.name
      if (parsedName && parsedName !== name) {
        throw new Error(`metadata.name must remain "${name}"`)
      }
      if (namespaced) {
        const parsedNs = parsed?.metadata?.namespace
        if (parsedNs && parsedNs !== namespace) {
          throw new Error(`metadata.namespace must remain "${namespace}"`)
        }
      }
      // Keep server resourceVersion for optimistic concurrency
      const live = detailQ.data || item
      if (live?.metadata?.resourceVersion) {
        parsed.metadata = parsed.metadata || {}
        parsed.metadata.resourceVersion = live.metadata.resourceVersion
        parsed.metadata.name = name
        if (namespaced) parsed.metadata.namespace = namespace
      }
      if (namespaced) await updateNamespacedResource(namespace, resource, name, parsed)
      else await updateClusterScopedResource(resource, name, parsed)
      await detailQ.refetch()
      void queryClient.invalidateQueries({ queryKey: [resource] })
      setEditing(false)
      setConfirmApply(false)
    } catch (e: any) {
      setErr(e?.message || 'Apply failed')
      setConfirmApply(false)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    setErr('')
    try {
      if (namespaced) await deleteNamespacedResource(namespace, resource, name)
      else await deleteClusterScopedResource(resource, name)
      void queryClient.invalidateQueries({ queryKey: [resource] })
      setConfirmDelete(false)
      onClose()
    } catch (e: any) {
      setErr(e?.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  if (open && !canRead) {
    return (
      <Modal open={open} title={name} subtitle={resource} onClose={onClose}>
        <div className="px-5 py-8 text-sm text-warn">You do not have permission to view this resource.</div>
      </Modal>
    )
  }

  return (
    <>
      <Modal
        open={open}
        wide
        title={name}
        subtitle={namespaced ? `${namespace} · ${resource}` : resource}
        onClose={onClose}
      >
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-line px-4 py-2">
          <Button
            variant="outline"
            className="px-3 py-1.5 text-xs"
            type="button"
            onClick={() => void navigator.clipboard.writeText(editing ? draft : yamlText)}
          >
            Copy
          </Button>
          {canWrite ? (
            editing ? (
              <>
                <Button
                  variant="ghost"
                  className="px-3 py-1.5 text-xs"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setEditing(false)
                    setDraft(yamlText)
                    setErr('')
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel edit
                </Button>
                <Button
                  variant="primary"
                  className="px-3 py-1.5 text-xs"
                  type="button"
                  disabled={busy || draft === yamlText}
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
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )
          ) : null}
          {canRemove ? (
            <Button
              variant="danger"
              className="px-3 py-1.5 text-xs"
              type="button"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          ) : null}
        </div>
        {err ? (
          <div className="border-b border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{err}</div>
        ) : null}
        {editing ? (
          <textarea
            className="m-0 h-[min(62vh,55dvh)] min-h-[220px] w-full resize-none border-0 term-surface px-3 py-3 font-mono text-[12px] leading-5 outline-none sm:h-[62vh] sm:min-h-[360px] sm:px-4"
            value={draft}
            spellCheck={false}
            onChange={(e) => setDraft(e.target.value)}
          />
        ) : (
          <pre className="m-0 h-[min(62vh,55dvh)] min-h-[220px] overflow-auto term-surface px-3 py-3 font-mono text-[12px] leading-5 whitespace-pre sm:h-[62vh] sm:min-h-[360px] sm:px-4">
            {detailQ.isLoading ? '# loading…' : yamlText || '# empty'}
          </pre>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete resource"
        confirmText={name}
        confirmLabel="Delete permanently"
        busy={busy}
        description={
          <span>
            This will permanently delete{' '}
            <span className="font-semibold text-text">
              {namespaced ? `${namespace}/${name}` : name}
            </span>{' '}
            ({resource}). This action cannot be undone from the UI.
          </span>
        }
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={confirmApply}
        title="Apply YAML"
        danger={false}
        confirmLabel="Apply changes"
        busy={busy}
        description={
          <span>
            Apply edited YAML to{' '}
            <span className="font-semibold text-text">
              {namespaced ? `${namespace}/${name}` : name}
            </span>
            ? Invalid fields may be rejected by the API server.
          </span>
        }
        onClose={() => setConfirmApply(false)}
        onConfirm={applyYaml}
      />
    </>
  )
}
