import { useEffect, useRef, useState } from 'react'
import { buildPodWsUrl } from '@/api/resources'
import { Badge, Button, Modal } from '@/components/ui'

type Props = {
  open: boolean
  namespace: string
  podName: string
  onClose: () => void
}

type StatusMsg = {
  type?: string
  ports?: string[]
  message?: string
}

export function PodPortForward({ open, namespace, podName, onClose }: Props) {
  const [localPort, setLocalPort] = useState('8080')
  const [remotePort, setRemotePort] = useState('80')
  const [status, setStatus] = useState<'idle' | 'connecting' | 'ready' | 'error' | 'closed'>('idle')
  const [messages, setMessages] = useState<StatusMsg[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  const disconnect = () => {
    wsRef.current?.close(1000, 'user')
    wsRef.current = null
  }

  useEffect(() => {
    if (!open) {
      disconnect()
      setStatus('idle')
      setMessages([])
    }
    return () => disconnect()
  }, [open])

  const pushMsg = (msg: StatusMsg) => {
    setMessages((prev) => [...prev.slice(-49), msg])
  }

  const connect = () => {
    if (!namespace || !podName) return
    const local = localPort.trim()
    const remote = remotePort.trim()
    if (!local || !remote) return
    disconnect()
    setMessages([])
    setStatus('connecting')

    const ports = `${local}:${remote}`
    const url = buildPodWsUrl('portforward', namespace, podName, { ports })
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      pushMsg({ type: 'connecting', message: `Opening port-forward ${ports}…` })
    }
    ws.onmessage = (event) => {
      let msg: StatusMsg
      try {
        msg = typeof event.data === 'string' ? JSON.parse(event.data) : { type: 'log', message: String(event.data) }
      } catch {
        msg = { type: 'log', message: String(event.data) }
      }
      pushMsg(msg)
      if (msg.type === 'ready') setStatus('ready')
      else if (msg.type === 'error') setStatus('error')
      else if (msg.type === 'closed') setStatus('closed')
    }
    ws.onerror = () => {
      setStatus('error')
      pushMsg({ type: 'error', message: 'WebSocket error' })
    }
    ws.onclose = (event) => {
      setStatus((prev) => (prev === 'error' ? prev : 'closed'))
      pushMsg({ type: 'closed', message: event.reason || `code ${event.code}` })
      wsRef.current = null
    }
  }

  const statusTone =
    status === 'ready' ? 'ok' : status === 'connecting' ? 'warn' : status === 'error' ? 'danger' : 'neutral'

  return (
    <Modal
      open={open}
      title="Port forward"
      subtitle={`${namespace}/${podName}`}
      onClose={() => {
        disconnect()
        onClose()
      }}
    >
      <div className="space-y-4 px-5 py-4">
        <div className="space-y-2 rounded border border-line bg-mist/40 px-3 py-2 text-sm text-text-dim">
          <p>
            Port-forward listens on <span className="font-mono text-cyan">127.0.0.1</span> of the{' '}
            <strong className="text-text">CiliKube API host</strong>, not your browser machine.
          </p>
          <p>
            Use this when the API runs locally, or tunnel that host port via SSH. Closing this dialog
            stops the forward.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block space-y-1">
            <span className="hud-label">Local port</span>
            <input
              className="hud-field w-28 font-mono"
              value={localPort}
              disabled={status === 'connecting' || status === 'ready'}
              onChange={(e) => setLocalPort(e.target.value)}
            />
          </label>
          <span className="pb-2 text-text-dim">→</span>
          <label className="block space-y-1">
            <span className="hud-label">Remote port</span>
            <input
              className="hud-field w-28 font-mono"
              value={remotePort}
              disabled={status === 'connecting' || status === 'ready'}
              onChange={(e) => setRemotePort(e.target.value)}
            />
          </label>
          {status === 'ready' || status === 'connecting' ? (
            <Button
              variant="danger"
              className="px-3 py-1.5 text-xs"
              type="button"
              onClick={() => {
                disconnect()
                setStatus('closed')
              }}
            >
              Disconnect
            </Button>
          ) : (
            <Button
              variant="primary"
              className="px-3 py-1.5 text-xs"
              type="button"
              disabled={!localPort.trim() || !remotePort.trim()}
              onClick={connect}
            >
              Connect
            </Button>
          )}
          <div className="ml-auto">
            <Badge tone={statusTone}>{status}</Badge>
          </div>
        </div>
        {status === 'ready' ? (
          <p className="rounded border border-cyan/30 bg-cyan/10 px-3 py-2 font-mono text-xs text-cyan">
            Listening on API host 127.0.0.1:{localPort.trim()} → pod :{remotePort.trim()}
          </p>
        ) : null}
        <pre className="max-h-[40vh] overflow-auto rounded border border-line term-surface px-3 py-3 font-mono text-[11px] whitespace-pre-wrap">
          {messages.length
            ? messages.map((m) => JSON.stringify(m)).join('\n')
            : '# status messages will appear here'}
        </pre>
      </div>
    </Modal>
  )
}
