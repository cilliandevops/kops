import { useEffect, useState } from 'react'
import { Button, Modal } from '@/components/ui'

type Props = {
  open: boolean
  resourceName: string
  current: number
  busy?: boolean
  onClose: () => void
  onConfirm: (replicas: number) => void | Promise<void>
}

export function ScaleDialog({ open, resourceName, current, busy, onClose, onConfirm }: Props) {
  const [replicas, setReplicas] = useState(current)

  useEffect(() => {
    if (open) setReplicas(current)
  }, [open, current])

  const valid = Number.isFinite(replicas) && replicas >= 0 && replicas !== current

  return (
    <Modal open={open} title="Scale resource" subtitle={resourceName} onClose={onClose}>
      <div className="space-y-4 px-5 py-4">
        <p className="text-sm text-text-dim">
          Current replicas: <span className="font-semibold text-text">{current}</span>
        </p>
        <label className="block space-y-2">
          <span className="hud-label">Desired replicas</span>
          <input
            type="number"
            min={0}
            className="hud-field"
            value={replicas}
            onChange={(e) => setReplicas(Number(e.target.value))}
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            disabled={!valid || busy}
            onClick={() => void onConfirm(replicas)}
          >
            {busy ? 'Scaling…' : 'Apply scale'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
