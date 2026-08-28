import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getNamespacedResource, metaName, metaNamespace, updateNamespacedResource } from '@/api/resources'
import { Badge, Button, HudSelect, Modal } from '@/components/ui'
import { useAuth } from '@/store/auth'
import { useCluster } from '@/store/cluster'

const EDITABLE = ['ClusterIP', 'NodePort', 'LoadBalancer'] as const
type ServiceType = (typeof EDITABLE)[number]

const NODEPORT_MIN = 30000
const NODEPORT_MAX = 32767

type PortRow = {
  name: string
  port: number
  protocol: string
  nodePort?: number
}

function currentType(item: any): string {
  return item?.spec?.type || 'ClusterIP'
}

function servicePorts(item: any): PortRow[] {
  return (item?.spec?.ports || []).map((p: any, i: number) => ({
    name: p.name || `port-${i + 1}`,
    port: Number(p.port) || 0,
    protocol: p.protocol || 'TCP',
    nodePort: p.nodePort ? Number(p.nodePort) : undefined,
  }))
}

function isHeadless(item: any) {
  return item?.spec?.clusterIP === 'None'
}

function needsNodePortDialog(next: ServiceType) {
  return next === 'NodePort' || next === 'LoadBalancer'
}

export function applyServiceTypeSpec(
  live: any,
  type: ServiceType,
  nodePorts?: Array<number | undefined>,
) {
  const clone = structuredClone(live)
  delete clone.status
  if (clone.metadata) delete clone.metadata.managedFields
  clone.spec = clone.spec || {}
  clone.spec.type = type
  const ports = Array.isArray(clone.spec.ports) ? clone.spec.ports : []
  for (let i = 0; i < ports.length; i++) {
    const port = ports[i]
    if (!port || typeof port !== 'object') continue
    if (type === 'ClusterIP') {
      delete port.nodePort
      continue
    }
    const assigned = nodePorts?.[i]
    if (assigned && assigned >= NODEPORT_MIN && assigned <= NODEPORT_MAX) {
      port.nodePort = assigned
    } else {
      delete port.nodePort
    }
  }
  return clone
}

export function ServiceTypeControl({ item }: { item: any }) {
  const { t } = useTranslation()
  const { canMutate } = useAuth()
  const { clusterId } = useCluster()
  const qc = useQueryClient()
  const type = currentType(item)
  const editable = canMutate('services') && EDITABLE.includes(type as ServiceType) && !isHeadless(item)
  const [pending, setPending] = useState<ServiceType | null>(null)
  const [mode, setMode] = useState<'random' | 'custom'>('random')
  const [customPorts, setCustomPorts] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const ports = useMemo(() => servicePorts(item), [item])

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['services', clusterId] })

  const apply = async (next: ServiceType, nodePorts?: Array<number | undefined>) => {
    const ns = metaNamespace(item)
    const name = metaName(item)
    setBusy(true)
    setErr('')
    try {
      const live = await getNamespacedResource(ns, 'services', name)
      const body = applyServiceTypeSpec(live, next, nodePorts)
      await updateNamespacedResource(ns, 'services', name, body)
      await invalidate()
      setPending(null)
    } catch (e: any) {
      setErr(e?.message || t('resources.serviceTypeFailed'))
    } finally {
      setBusy(false)
    }
  }

  const openPortDialog = (next: ServiceType) => {
    setMode('random')
    setCustomPorts(ports.map((p) => (p.nodePort ? String(p.nodePort) : '')))
    setErr('')
    setPending(next)
  }

  const onTypeChange = (value: string) => {
    const next = value as ServiceType
    if (next === type || busy) return
    if (next === 'ClusterIP') {
      void apply('ClusterIP')
      return
    }
    if (needsNodePortDialog(next)) openPortDialog(next)
  }

  const confirmPending = () => {
    if (!pending) return
    if (mode === 'random') {
      void apply(pending)
      return
    }
    const parsed = customPorts.map((raw) => {
      const n = Number(raw)
      return Number.isInteger(n) ? n : undefined
    })
    const invalid = parsed.some((n) => n === undefined || n < NODEPORT_MIN || n > NODEPORT_MAX)
    if (invalid) {
      setErr(t('resources.serviceNodePortRange', { min: NODEPORT_MIN, max: NODEPORT_MAX }))
      return
    }
    void apply(pending, parsed)
  }

  if (!editable) {
    return (
      <Badge tone="accent">
        {type}
        {isHeadless(item) ? ' · None' : ''}
      </Badge>
    )
  }

  return (
    <>
      <HudSelect
        aria-label={t('resources.serviceType')}
        className="min-w-[8.5rem]"
        disabled={busy}
        value={type}
        onChange={onTypeChange}
        options={EDITABLE.map((value) => ({ value, label: value }))}
      />
      <Modal
        open={Boolean(pending)}
        title={t('resources.serviceTypeChange')}
        subtitle={`${metaNamespace(item)}/${metaName(item)} → ${pending || ''}`}
        onClose={() => {
          if (!busy) setPending(null)
        }}
      >
        <div className="space-y-4 px-5 py-4">
          <p className="text-sm text-text-dim">{t('resources.serviceNodePortHint')}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === 'random' ? 'primary' : 'outline'}
              className="px-3 py-1.5 text-xs"
              onClick={() => setMode('random')}
            >
              {t('resources.servicePortRandom')}
            </Button>
            <Button
              type="button"
              variant={mode === 'custom' ? 'primary' : 'outline'}
              className="px-3 py-1.5 text-xs"
              onClick={() => setMode('custom')}
            >
              {t('resources.servicePortCustom')}
            </Button>
          </div>
          {mode === 'custom' ? (
            <div className="space-y-2">
              {ports.length === 0 ? (
                <p className="text-sm text-warn">{t('resources.serviceNoPorts')}</p>
              ) : (
                ports.map((p, i) => (
                  <label key={`${p.name}-${p.port}-${p.protocol}`} className="block space-y-1">
                    <span className="hud-label">
                      {p.name} · {p.port}/{p.protocol}
                    </span>
                    <input
                      type="number"
                      min={NODEPORT_MIN}
                      max={NODEPORT_MAX}
                      className="hud-field"
                      placeholder={`${NODEPORT_MIN}–${NODEPORT_MAX}`}
                      value={customPorts[i] ?? ''}
                      onChange={(e) => {
                        const next = [...customPorts]
                        next[i] = e.target.value
                        setCustomPorts(next)
                      }}
                    />
                  </label>
                ))
              )}
            </div>
          ) : (
            <p className="text-sm text-text-dim">{t('resources.servicePortRandomHint')}</p>
          )}
          {err ? <p className="text-sm text-danger">{err}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" disabled={busy} onClick={() => setPending(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              type="button"
              disabled={busy || (mode === 'custom' && ports.length === 0)}
              onClick={confirmPending}
            >
              {busy ? t('resources.serviceTypeApplying') : t('common.apply')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
