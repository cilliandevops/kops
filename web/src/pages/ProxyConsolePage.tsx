import { useState } from 'react'
import { api, getClusterId } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Button, Card, HudSelect, PageHeader } from '@/components/ui'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useTranslation } from 'react-i18next'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export function ProxyConsolePage() {
  const { t } = useTranslation()
  const { canEdit } = useAuth()
  const [path, setPath] = useState('/api/v1/namespaces')
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [body, setBody] = useState('{\n  \n}')
  const [out, setOut] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const run = async () => {
    setBusy(true)
    setOut('')
    try {
      const clean = path.startsWith('/') ? path : `/${path}`
      const url = `/api/v1/proxy${clean}`
      const params = { clusterId: getClusterId() }
      let res
      if (method === 'GET') {
        res = await api.get(url, { params, validateStatus: () => true })
      } else if (method === 'DELETE') {
        res = await api.delete(url, { params, validateStatus: () => true })
      } else {
        let payload: unknown = body
        const trimmed = body.trim()
        if (trimmed) {
          try {
            payload = JSON.parse(trimmed)
          } catch {
            payload = body
          }
        } else {
          payload = undefined
        }
        if (method === 'POST') {
          res = await api.post(url, payload, { params, validateStatus: () => true })
        } else if (method === 'PUT') {
          res = await api.put(url, payload, { params, validateStatus: () => true })
        } else {
          res = await api.patch(url, payload, { params, validateStatus: () => true })
        }
      }
      const data = res.data
      setOut(typeof data === 'string' ? data : JSON.stringify(data, null, 2))
      if (res.status >= 400) {
        setOut((prev) => `# HTTP ${res.status}\n${prev}`)
      } else {
        setOut((prev) => `# HTTP ${res.status} ${method}\n${prev}`)
      }
    } catch (e: any) {
      setOut(e?.message || t('proxy.requestFailed'))
    } finally {
      setBusy(false)
      setConfirmOpen(false)
    }
  }

  const onSubmit = () => {
    if (method === 'GET') {
      void run()
      return
    }
    setConfirmOpen(true)
  }

  if (!canEdit) {
    return (
      <div className="rounded border border-warn/40 bg-warn/10 px-5 py-8 text-sm text-warn">
        {t('proxy.editorRequired')}
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <PageHeader
        title={t('proxy.title')}
        subtitle={t('proxy.subtitle')}
      />
      <Card className="space-y-3 p-5">
        <div className="flex flex-wrap gap-3">
          <label className="block space-y-1">
            <span className="hud-label">{t('proxy.method')}</span>
            <HudSelect
              aria-label={t('proxy.method')}
              className="w-auto min-w-[120px]"
              value={method}
              onChange={(v) => setMethod(v as HttpMethod)}
              searchableWhen={99}
              options={(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => ({
                value: m,
                label: m,
              }))}
            />
          </label>
          <label className="min-w-0 flex-1 space-y-1">
            <span className="hud-label">{t('proxy.path')}</span>
            <input
              className="hud-field font-mono text-xs"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/api/v1/namespaces"
            />
          </label>
        </div>
        {method !== 'GET' ? (
          <label className="block space-y-1">
            <span className="hud-label">{t('proxy.body')}</span>
            <textarea
              className="hud-field min-h-[140px] font-mono text-xs"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
            />
          </label>
        ) : null}
        <Button type="button" disabled={busy} onClick={onSubmit}>
          {busy ? t('proxy.calling') : t('proxy.sendVia', { method })}
        </Button>
        <pre className="max-h-[50vh] overflow-auto rounded border border-line term-surface px-3 py-3 font-mono text-[11px] whitespace-pre-wrap">
          {out || t('proxy.responsePlaceholder')}
        </pre>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title={t('proxy.confirmTitle', { method })}
        danger={method === 'DELETE'}
        confirmLabel={t('proxy.confirmLabel', { method })}
        cancelLabel={t('common.cancel')}
        busy={busy}
        description={<span>{t('proxy.confirmBody', { method, path })}</span>}
        onClose={() => setConfirmOpen(false)}
        onConfirm={run}
      />
    </div>
  )
}
