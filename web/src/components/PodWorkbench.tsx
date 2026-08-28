import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dump as yamlDump, load as yamlLoad } from 'js-yaml'
import {
  FileCode2,
  Network,
  Pencil,
  Save,
  ScrollText,
  TerminalSquare,
  Trash2,
  X,
} from 'lucide-react'
import {
  deleteNamespacedResource,
  getNamespacedResource,
  metaName,
  metaNamespace,
  podContainers,
  updateNamespacedResource,
} from '@/api/resources'
import { useAuth } from '@/store/auth'
import { useCluster } from '@/store/cluster'
import { Badge, Button, Modal } from '@/components/ui'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PodLogs } from '@/components/PodLogs'
import { PodTerminal } from '@/components/PodTerminal'
import { PodPortForward } from '@/components/PodPortForward'

type Tab = 'logs' | 'exec' | 'attach' | 'yaml'

type Props = {
  pod: any | null
  open: boolean
  initialTab?: Tab
  onClose: () => void
  onDeleted?: () => void
}

export function PodWorkbench({ pod, open, initialTab = 'logs', onClose, onDeleted }: Props) {
  const { clusterId } = useCluster()
  const queryClient = useQueryClient()
  const { canDelete, canMutate, canExec, checkPermission } = useAuth()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmApply, setConfirmApply] = useState(false)
  const [portForwardOpen, setPortForwardOpen] = useState(false)

  const namespace = metaNamespace(pod)
  const name = metaName(pod)
  const canRemove = canDelete('pods')
  const canWrite = canMutate('pods')
  const canReadSecretsBlocked = checkPermission('pods', 'read')

  useEffect(() => {
    if (open) {
      const next =
        (initialTab === 'exec' || initialTab === 'attach') && !canExec ? 'logs' : initialTab
      setTab(next)
      setErr('')
      setEditing(false)
      setConfirmDelete(false)
      setConfirmApply(false)
      setPortForwardOpen(false)
    }
  }, [open, initialTab, pod, canExec])

  const detailQ = useQuery({
    queryKey: ['pod-detail', clusterId, namespace, name],
    queryFn: () => getNamespacedResource(namespace, 'pods', name),
    enabled: open && canReadSecretsBlocked && Boolean(namespace && name && name !== '-'),
  })

  const livePod = detailQ.data || pod
  const containers = useMemo(() => podContainers(livePod), [livePod])

  const yamlText = useMemo(() => {
    if (!livePod) return ''
    try {
      const clone = structuredClone(livePod)
      if (clone.metadata) delete clone.metadata.managedFields
      return yamlDump(clone, { lineWidth: 120, noRefs: true })
    } catch {
      return JSON.stringify(livePod, null, 2)
    }
  }, [livePod])

  useEffect(() => {
    if (!editing) setDraft(yamlText)
  }, [yamlText, editing])

  const tabs: Array<{ id: Tab; label: string; icon: typeof ScrollText; hidden?: boolean }> = [
    { id: 'logs', label: 'Logs', icon: ScrollText },
    { id: 'exec', label: 'Exec', icon: TerminalSquare, hidden: !canExec },
    { id: 'attach', label: 'Attach', icon: TerminalSquare, hidden: !canExec },
    { id: 'yaml', label: 'YAML', icon: FileCode2 },
  ]

  const handleDelete = async () => {
    setBusy(true)
    setErr('')
    try {
      await deleteNamespacedResource(namespace, 'pods', name)
      onDeleted?.()
      void queryClient.invalidateQueries({ queryKey: ['pods'] })
      setConfirmDelete(false)
      onClose()
    } catch (e: any) {
      setErr(e?.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  const applyYaml = async () => {
    setBusy(true)
    setErr('')
    try {
      const parsed = yamlLoad(draft) as any
      if (!parsed || typeof parsed !== 'object') throw new Error('YAML must be an object')
      if (parsed?.metadata?.name && parsed.metadata.name !== name) {
        throw new Error(`metadata.name must remain "${name}"`)
      }
      if (parsed?.metadata?.namespace && parsed.metadata.namespace !== namespace) {
        throw new Error(`metadata.namespace must remain "${namespace}"`)
      }
      if (livePod?.metadata?.resourceVersion) {
        parsed.metadata = parsed.metadata || {}
        parsed.metadata.resourceVersion = livePod.metadata.resourceVersion
        parsed.metadata.name = name
        parsed.metadata.namespace = namespace
      }
      await updateNamespacedResource(namespace, 'pods', name, parsed)
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

  return (
    <>
      <Modal
        open={open}
        wide
        title={name}
        subtitle={`${namespace} · pod workbench`}
        onClose={onClose}
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-2">
          {tabs
            .filter((t) => !t.hidden)
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id)
                  setEditing(false)
                }}
                className={
                  tab === t.id
                    ? 'inline-flex items-center gap-1.5 rounded border border-cyan/40 bg-cyan/15 px-3 py-1.5 text-xs font-semibold text-cyan'
                    : 'inline-flex items-center gap-1.5 rounded border border-transparent px-3 py-1.5 text-xs font-semibold text-text-dim hover:border-line hover:text-text'
                }
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          <div className="ml-auto flex items-center gap-2">
            <Badge tone="accent">{livePod?.status?.phase || '-'}</Badge>
            {canExec ? (
              <Button
                variant="outline"
                className="px-3 py-1.5 text-xs"
                type="button"
                onClick={() => setPortForwardOpen(true)}
              >
                <Network className="h-3.5 w-3.5" />
                Port Forward
              </Button>
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
        </div>
        {err ? (
          <div className="border-b border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{err}</div>
        ) : null}
        {tab === 'logs' ? (
          <PodLogs namespace={namespace} podName={name} containers={containers} />
        ) : null}
        {tab === 'exec' && canExec ? (
          <PodTerminal namespace={namespace} podName={name} containers={containers} mode="exec" />
        ) : null}
        {tab === 'attach' && canExec ? (
          <PodTerminal namespace={namespace} podName={name} containers={containers} mode="attach" />
        ) : null}
        {tab === 'yaml' ? (
          <div className="flex h-[min(62vh,70dvh)] min-h-[240px] flex-col sm:min-h-[360px]">
            <div className="flex flex-wrap justify-end gap-2 border-b border-line px-4 py-2">
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
            </div>
            {editing ? (
              <textarea
                className="m-0 min-h-0 flex-1 resize-none border-0 term-surface px-4 py-3 font-mono text-[12px] leading-5 outline-none"
                value={draft}
                spellCheck={false}
                onChange={(e) => setDraft(e.target.value)}
              />
            ) : (
              <pre className="m-0 min-h-0 flex-1 overflow-auto term-surface px-4 py-3 font-mono text-[12px] leading-5 whitespace-pre">
                {detailQ.isLoading ? '# loading…' : yamlText || '# empty'}
              </pre>
            )}
          </div>
        ) : null}
      </Modal>

      <PodPortForward
        open={portForwardOpen}
        namespace={namespace}
        podName={name}
        onClose={() => setPortForwardOpen(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete pod"
        confirmText={name}
        confirmLabel="Delete pod"
        busy={busy}
        description={
          <span>
            Delete pod <span className="font-semibold text-text">{namespace}/{name}</span>? Type the
            pod name to confirm.
          </span>
        }
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={confirmApply}
        title="Apply pod YAML"
        danger={false}
        confirmLabel="Apply changes"
        busy={busy}
        description="Apply YAML changes to this pod? Many pod fields are immutable and may be rejected."
        onClose={() => setConfirmApply(false)}
        onConfirm={applyYaml}
      />
    </>
  )
}
