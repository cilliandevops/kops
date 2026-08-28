import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Ban, Play, Plus, Tag, Trash2, Waves } from 'lucide-react'
import { Badge, Button, Modal } from '@/components/ui'
import { HudSelect } from '@/components/HudSelect'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'
import { nodeIsCordoned } from '@/lib/nodeStatus'
import {
  cordonNode,
  drainNode,
  uncordonNode,
  updateNodeTaints,
  type DrainResult,
  type NodeTaint,
} from '@/api/nodeOps'

const EFFECTS: NodeTaint['effect'][] = ['NoSchedule', 'PreferNoSchedule', 'NoExecute']

/** Cordon / uncordon / drain / taints for one node. */
export function NodeOpsControls({ node, compact = false }: { node: any; compact?: boolean }) {
  const { t } = useTranslation()
  const { canMutate } = useAuth()
  const queryClient = useQueryClient()
  const name = node?.metadata?.name || ''
  const cordoned = nodeIsCordoned(node)

  const [busy, setBusy] = useState<'cordon' | 'drain' | 'taints' | null>(null)
  const [err, setErr] = useState('')
  const [drainOpen, setDrainOpen] = useState(false)
  const [taintsOpen, setTaintsOpen] = useState(false)

  const [ignoreDaemonSets, setIgnoreDaemonSets] = useState(true)
  const [deleteEmptyDirData, setDeleteEmptyDirData] = useState(false)
  const [force, setForce] = useState(false)
  const [grace, setGrace] = useState('30')
  const [result, setResult] = useState<DrainResult | null>(null)

  const [taints, setTaints] = useState<NodeTaint[]>([])

  if (!canMutate('nodes')) return null

  // Nodes list and the generic detail page cache under different keys.
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['nodes'] })
    void queryClient.invalidateQueries({ queryKey: ['detail'] })
  }

  const toggleCordon = async () => {
    setBusy('cordon')
    setErr('')
    try {
      if (cordoned) await uncordonNode(name)
      else await cordonNode(name)
      refresh()
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(null)
    }
  }

  const runDrain = async (dryRun: boolean) => {
    setBusy('drain')
    setErr('')
    setResult(null)
    try {
      const res = await drainNode(name, {
        ignoreDaemonSets,
        deleteEmptyDirData,
        force,
        gracePeriodSeconds: Number(grace) || 0,
        dryRun,
      })
      setResult(res)
      if (!dryRun) refresh()
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(null)
    }
  }

  const openTaints = () => {
    setTaints(
      ((node?.spec?.taints || []) as any[]).map((tt) => ({
        key: tt.key || '',
        value: tt.value || '',
        effect: (tt.effect || 'NoSchedule') as NodeTaint['effect'],
      })),
    )
    setErr('')
    setTaintsOpen(true)
  }

  const saveTaints = async () => {
    setBusy('taints')
    setErr('')
    try {
      await updateNodeTaints(
        name,
        taints
          .filter((tt) => tt.key.trim())
          .map((tt) => ({ key: tt.key.trim(), value: tt.value?.trim() || undefined, effect: tt.effect })),
      )
      refresh()
      setTaintsOpen(false)
    } catch (e: any) {
      setErr(e?.message || String(e))
    } finally {
      setBusy(null)
    }
  }

  // In table rows the Actions column is narrow, so labels would wrap each button
  // onto its own line and triple the row height — use icon-only there.
  const btn = compact
    ? 'min-h-7 w-7 shrink-0 px-0 py-0'
    : 'min-h-9 shrink-0 whitespace-nowrap px-3 py-1.5 text-xs'
  const taintCount = (node?.spec?.taints || []).length

  return (
    <div className="flex flex-nowrap items-center gap-1">
      <Button
        type="button"
        variant={cordoned ? 'primary' : 'outline'}
        className={btn}
        disabled={busy === 'cordon'}
        onClick={toggleCordon}
        title={cordoned ? t('nodeOps.uncordonHint') : t('nodeOps.cordonHint')}
        aria-label={cordoned ? t('nodeOps.uncordon') : t('nodeOps.cordon')}
      >
        {cordoned ? <Play className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
        {compact ? null : cordoned ? t('nodeOps.uncordon') : t('nodeOps.cordon')}
      </Button>

      <Button
        type="button"
        variant="outline"
        className={btn}
        onClick={() => {
          setResult(null)
          setErr('')
          setDrainOpen(true)
        }}
        title={t('nodeOps.drainHint')}
        aria-label={t('nodeOps.drain')}
      >
        <Waves className="h-3.5 w-3.5" />
        {compact ? null : t('nodeOps.drain')}
      </Button>

      <Button
        type="button"
        variant="outline"
        className={cn(btn, compact && taintCount ? 'w-auto px-1.5' : '')}
        onClick={openTaints}
        title={t('nodeOps.taints')}
        aria-label={t('nodeOps.taints')}
      >
        <Tag className="h-3.5 w-3.5" />
        {compact ? (taintCount ? <span className="text-[11px]">{taintCount}</span> : null) : t('nodeOps.taints')}
        {!compact && taintCount ? <Badge tone="accent">{taintCount}</Badge> : null}
      </Button>

      {err && !drainOpen && !taintsOpen ? (
        <span className="truncate text-[11px] text-danger" title={err}>
          {err}
        </span>
      ) : null}

      <Modal
        open={drainOpen}
        title={`${t('nodeOps.drain')} · ${name}`}
        subtitle={t('nodeOps.drainSubtitle')}
        onClose={() => setDrainOpen(false)}
      >
        <div className="space-y-3 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Checkbox
              label={t('nodeOps.ignoreDaemonSets')}
              checked={ignoreDaemonSets}
              onChange={setIgnoreDaemonSets}
            />
            <Checkbox
              label={t('nodeOps.deleteEmptyDirData')}
              checked={deleteEmptyDirData}
              onChange={setDeleteEmptyDirData}
            />
            <Checkbox label={t('nodeOps.force')} checked={force} onChange={setForce} />
            <label className="flex items-center gap-2 text-xs text-text-dim">
              <span className="shrink-0">{t('nodeOps.gracePeriod')}</span>
              <input
                className="hud-field !w-16 shrink-0 font-mono text-xs"
                value={grace}
                inputMode="numeric"
                onChange={(e) => setGrace(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </label>
          </div>

          {err ? <p className="text-xs text-danger">{err}</p> : null}

          {result ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {result.dryRun ? <Badge tone="accent">{t('nodeOps.dryRun')}</Badge> : null}
                <Badge tone="ok">
                  {t('nodeOps.evicted')} {result.evicted}
                </Badge>
                <Badge tone="neutral">
                  {t('nodeOps.skipped')} {result.skipped}
                </Badge>
                {result.failed ? (
                  <Badge tone="danger">
                    {t('nodeOps.failed')} {result.failed}
                  </Badge>
                ) : null}
              </div>
              <div className="max-h-56 overflow-auto rounded border border-line">
                <table className="w-full text-left text-xs">
                  <tbody>
                    {result.pods.map((p) => (
                      <tr key={`${p.namespace}/${p.name}`} className="border-b border-line/60 last:border-0">
                        <td className="px-2 py-1 font-mono">
                          {p.namespace}/{p.name}
                        </td>
                        <td className="px-2 py-1">
                          <Badge
                            tone={
                              p.action === 'evicted' ? 'ok' : p.action === 'failed' ? 'danger' : 'neutral'
                            }
                          >
                            {p.action}
                          </Badge>
                        </td>
                        <td className="px-2 py-1 text-text-dim" title={p.reason || ''}>
                          {p.reason || ''}
                        </td>
                      </tr>
                    ))}
                    {!result.pods.length ? (
                      <tr>
                        <td className="px-2 py-3 text-text-dim" colSpan={3}>
                          {t('nodeOps.noPods')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-9 px-3 py-1.5 text-xs"
              disabled={busy === 'drain'}
              onClick={() => runDrain(true)}
            >
              {t('nodeOps.preview')}
            </Button>
            <Button
              type="button"
              variant="danger"
              className="min-h-9 px-3 py-1.5 text-xs"
              disabled={busy === 'drain'}
              onClick={() => runDrain(false)}
            >
              {busy === 'drain' ? t('nodeOps.draining') : t('nodeOps.drainConfirm')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={taintsOpen}
        title={`${t('nodeOps.taints')} · ${name}`}
        subtitle={t('nodeOps.taintsSubtitle')}
        onClose={() => setTaintsOpen(false)}
      >
        <div className="space-y-3 p-4">
          {taints.map((tt, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                className="hud-field min-w-0 flex-1 font-mono text-xs"
                placeholder="key"
                value={tt.key}
                onChange={(e) =>
                  setTaints((prev) => prev.map((p, j) => (j === i ? { ...p, key: e.target.value } : p)))
                }
              />
              <input
                className="hud-field min-w-0 flex-1 font-mono text-xs"
                placeholder="value"
                value={tt.value || ''}
                onChange={(e) =>
                  setTaints((prev) => prev.map((p, j) => (j === i ? { ...p, value: e.target.value } : p)))
                }
              />
              <HudSelect
                className="w-40"
                value={tt.effect}
                onChange={(v) =>
                  setTaints((prev) =>
                    prev.map((p, j) => (j === i ? { ...p, effect: v as NodeTaint['effect'] } : p)),
                  )
                }
                options={EFFECTS.map((e) => ({ value: e, label: e }))}
              />
              <button
                type="button"
                className="ai-ops-icon-btn"
                aria-label={t('common.delete')}
                onClick={() => setTaints((prev) => prev.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {!taints.length ? <p className="text-xs text-text-dim">{t('nodeOps.noTaints')}</p> : null}

          <Button
            type="button"
            variant="outline"
            className="min-h-9 px-3 py-1.5 text-xs"
            onClick={() => setTaints((prev) => [...prev, { key: '', value: '', effect: 'NoSchedule' }])}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('nodeOps.addTaint')}
          </Button>

          {err ? <p className="text-xs text-danger">{err}</p> : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-9 px-3 py-1.5 text-xs"
              onClick={() => setTaintsOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              className="min-h-9 px-3 py-1.5 text-xs"
              disabled={busy === 'taints'}
              onClick={saveTaints}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-text-dim">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}
