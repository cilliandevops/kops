import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { load as yamlLoad } from 'js-yaml'
import { createClusterScopedResource, createNamespacedResource } from '@/api/resources'
import { yamlTemplate } from '@/lib/yamlTemplates'
import { useAuth } from '@/store/auth'
import { useNamespace } from '@/store/namespace'
import { Button, Modal } from '@/components/ui'
import { ConfirmDialog } from '@/components/ConfirmDialog'

type Props = {
  open: boolean
  resource: string
  namespaced?: boolean
  onClose: () => void
}

export function ResourceCreateModal({ open, resource, namespaced = true, onClose }: Props) {
  const { namespace } = useNamespace()
  const { canMutate } = useAuth()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const canWrite = canMutate(resource)
  // Create always needs a concrete namespace; fall back when "All" is selected
  const createNs = namespace || 'default'

  useEffect(() => {
    if (open) {
      setDraft(yamlTemplate(resource, namespaced ? createNs : undefined))
      setErr('')
      setConfirm(false)
    }
  }, [open, resource, createNs, namespaced])

  const create = async () => {
    if (!canWrite) return
    setBusy(true)
    setErr('')
    try {
      const parsed = yamlLoad(draft) as any
      if (!parsed?.metadata?.name) throw new Error('metadata.name is required')
      if (namespaced) {
        parsed.metadata.namespace = parsed.metadata.namespace || createNs
        if (!parsed.metadata.namespace) {
          throw new Error('metadata.namespace is required (select a namespace or set it in YAML)')
        }
        await createNamespacedResource(parsed.metadata.namespace, resource, parsed)
      } else {
        await createClusterScopedResource(resource, parsed)
      }
      void queryClient.invalidateQueries({ queryKey: [resource] })
      setConfirm(false)
      onClose()
    } catch (e: any) {
      setErr(e?.message || 'Create failed')
      setConfirm(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Modal
        open={open}
        wide
        title={`CREATE ${resource.toUpperCase()}`}
        subtitle={namespaced ? `Namespace default: ${namespace}` : 'Cluster-scoped'}
        onClose={onClose}
      >
        <div className="flex flex-col">
          {err ? (
            <div className="border-b border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
              {err}
            </div>
          ) : null}
          <div className="flex justify-end gap-2 border-b border-line px-4 py-2">
            <Button variant="ghost" className="px-3 py-1.5 text-xs" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="px-3 py-1.5 text-xs"
              type="button"
              disabled={!canWrite || busy}
              onClick={() => setConfirm(true)}
            >
              Create
            </Button>
          </div>
          <textarea
            className="m-0 h-[55vh] w-full resize-none term-surface px-4 py-3 font-mono text-[12px] outline-none"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
          />
        </div>
      </Modal>
      <ConfirmDialog
        open={confirm}
        title="Create resource"
        danger={false}
        confirmLabel="Create"
        busy={busy}
        description={`Create ${resource} from YAML?`}
        onClose={() => setConfirm(false)}
        onConfirm={create}
      />
    </>
  )
}
