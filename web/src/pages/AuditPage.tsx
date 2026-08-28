import { Fragment, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { AuditGeoMap, type GeoStats } from '@/components/AuditGeoMap'
import { regionLabel } from '@/lib/geoRegion'
import { Badge, Button, Card, EmptyState, PageHeader, StatCard } from '@/components/ui'
import { HudTable, HudTableScroll } from '@/components/HudTableScroll'
import { cn } from '@/lib/utils'

/** Format Date as datetime-local value (local timezone, minute precision). */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultRange(hours: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date(end.getTime() - hours * 3_600_000)
  return { start: toLocalInput(start), end: toLocalInput(end) }
}

function toRFC3339(localValue: string, role: 'start' | 'end' = 'start'): string {
  if (!localValue) return ''
  const d = new Date(localValue)
  if (Number.isNaN(d.getTime())) return ''
  // datetime-local is minute-precision; make the end inclusive through that minute
  // so "1h" / current-minute events are not dropped from report/metrics/geo.
  if (role === 'end') {
    d.setSeconds(59, 999)
  } else {
    d.setSeconds(0, 0)
  }
  return d.toISOString()
}

/** Go-safe duration only (hours), never Nd. */
function periodFromRange(start: string, end: string): string {
  const a = new Date(start).getTime()
  const b = new Date(end).getTime()
  if (!a || !b || b <= a) return '24h'
  const hours = Math.max(1, Math.round((b - a) / 3_600_000))
  return `${hours}h`
}

function formatLocalWindow(startLocal: string, endLocal: string): string {
  const a = new Date(startLocal)
  const b = new Date(endLocal)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return ''
  const opts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return `${a.toLocaleString(undefined, opts)} → ${b.toLocaleString(undefined, opts)}`
}

function formatTime(raw: string | undefined): string {
  if (!raw) return '-'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function parseDetails(log: any): Record<string, unknown> | null {
  let details = log?.details
  if (typeof details === 'string' && details) {
    try {
      details = JSON.parse(details)
    } catch {
      return null
    }
  }
  if (details && typeof details === 'object') return details as Record<string, unknown>
  return null
}

function shortUA(ua: string): string {
  if (!ua) return '-'
  // Keep browser / OS hints readable without dumping the full UA string.
  const chrome = ua.match(/Chrome\/([\d.]+)/)
  const firefox = ua.match(/Firefox\/([\d.]+)/)
  const safari = !chrome && ua.match(/Version\/([\d.]+).*Safari/)
  const edge = ua.match(/Edg\/([\d.]+)/)
  const browser = edge
    ? `Edge ${edge[1]}`
    : chrome
      ? `Chrome ${chrome[1]}`
      : firefox
        ? `Firefox ${firefox[1]}`
        : safari
          ? `Safari ${safari[1]}`
          : ua.slice(0, 48)
  const os = ua.includes('Windows')
    ? 'Windows'
    : ua.includes('Mac OS')
      ? 'macOS'
      : ua.includes('Android')
        ? 'Android'
        : ua.includes('iPhone') || ua.includes('iPad')
          ? 'iOS'
          : ua.includes('Linux')
            ? 'Linux'
            : ''
  return os ? `${browser} · ${os}` : browser
}

function resultTone(result: string, status?: number): 'ok' | 'danger' | 'warn' | 'accent' {
  const r = (result || '').toLowerCase()
  if (r === 'success' || r === 'ok' || (status != null && status >= 200 && status < 400)) return 'ok'
  if (r === 'failed' || r === 'failure' || r === 'denied' || (status != null && status >= 400)) return 'danger'
  if (status != null) return 'warn'
  return 'accent'
}

/** Result tokens the backend emits that have a localized label. */
const RESULT_LABELS = ['success', 'ok', 'failed', 'failure', 'denied', 'allowed']

const PRESETS: { label: string; hours: number }[] = [
  { label: '1h', hours: 1 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 24 * 7 },
  { label: '30d', hours: 24 * 30 },
]

const COL_COUNT = 9

export function AuditPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const [action, setAction] = useState('')
  const [userId, setUserId] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const initial = useMemo(() => defaultRange(24), [])
  const [startLocal, setStartLocal] = useState(initial.start)
  const [endLocal, setEndLocal] = useState(initial.end)

  const startTime = toRFC3339(startLocal, 'start')
  const endTime = toRFC3339(endLocal, 'end')
  const timesReady = Boolean(startTime && endTime && new Date(endTime) >= new Date(startTime))

  const applyPreset = (hours: number) => {
    const range = defaultRange(hours)
    setStartLocal(range.start)
    setEndLocal(range.end)
    setPage(1)
  }

  const logsQ = useQuery({
    queryKey: ['audit-logs', page, action, userId, startTime, endTime],
    enabled: isAdmin,
    refetchInterval: 8_000,
    refetchOnWindowFocus: true,
    queryFn: () => {
      const params: Record<string, unknown> = {
        page,
        page_size: 50,
      }
      if (action.trim()) params.action = action.trim()
      if (userId.trim()) params.user_id = Number(userId.trim()) || userId.trim()
      if (startTime) params.start_time = startTime
      if (endTime) params.end_time = endTime
      return apiGet<{ logs?: any[]; items?: any[]; total?: number; page?: number; page_size?: number }>(
        '/api/v1/audit/logs',
        params,
      )
    },
  })

  const reportQ = useQuery({
    queryKey: ['audit-report', startTime, endTime, userId],
    enabled: isAdmin && timesReady,
    queryFn: () => {
      const params: Record<string, unknown> = {
        start_time: startTime,
        end_time: endTime,
      }
      if (userId.trim()) params.user_id = Number(userId.trim()) || userId.trim()
      return apiGet<any>('/api/v1/audit/report', params)
    },
  })

  const metricsQ = useQuery({
    queryKey: ['audit-metrics', startTime, endTime],
    enabled: isAdmin && timesReady,
    queryFn: () =>
      apiGet<any>('/api/v1/audit/metrics', {
        period: periodFromRange(startTime, endTime),
        start_time: startTime,
        end_time: endTime,
      }),
  })

  const geoQ = useQuery({
    queryKey: ['audit-geo', startTime, endTime],
    enabled: isAdmin && timesReady,
    refetchInterval: 30_000,
    queryFn: () =>
      apiGet<GeoStats>('/api/v1/audit/geo', {
        start_time: startTime,
        end_time: endTime,
      }),
  })

  const logs = logsQ.data?.logs || logsQ.data?.items || (Array.isArray(logsQ.data) ? logsQ.data : [])
  const total = logsQ.data?.total ?? (logs as any[]).length
  const pageSize = logsQ.data?.page_size || 50
  const totalPages = Math.max(1, Math.ceil(Number(total) / pageSize))

  const topActions = useMemo(() => {
    const summary = reportQ.data?.action_summary || {}
    return Object.entries(summary)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 5)
  }, [reportQ.data])

  const resultLabel = (raw: string) => {
    const key = raw.toLowerCase()
    return RESULT_LABELS.includes(key) ? t(`audit.resultValue.${key}`) : raw
  }

  if (!isAdmin) {
    return (
      <div className="rounded border border-warn/40 bg-warn/10 px-5 py-8 text-sm text-warn">
        {t('audit.adminRequired')}
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <PageHeader title={t('audit.title')} subtitle={t('audit.subtitle')} />

      <Card className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="hud-label">{t('audit.range')}</span>
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              type="button"
              variant="outline"
              className="px-2.5 py-1 text-xs tracking-[0.12em] uppercase"
              onClick={() => applyPreset(p.hours)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block space-y-1">
            <span className="hud-label">{t('audit.colAction')}</span>
            <input
              className="hud-field w-40"
              value={action}
              onChange={(e) => {
                setPage(1)
                setAction(e.target.value)
              }}
              placeholder="login / api_request"
            />
          </label>
          <label className="block space-y-1">
            <span className="hud-label">{t('audit.filterUserId')}</span>
            <input
              className="hud-field w-28"
              value={userId}
              onChange={(e) => {
                setPage(1)
                setUserId(e.target.value)
              }}
              placeholder="1"
            />
          </label>
          <label className="block space-y-1">
            <span className="hud-label">{t('audit.startTime')}</span>
            <input
              type="datetime-local"
              lang="en"
              step={60}
              className="hud-field"
              value={startLocal}
              onChange={(e) => {
                setPage(1)
                setStartLocal(e.target.value)
              }}
            />
          </label>
          <label className="block space-y-1">
            <span className="hud-label">{t('audit.endTime')}</span>
            <input
              type="datetime-local"
              lang="en"
              step={60}
              className="hud-field"
              value={endLocal}
              onChange={(e) => {
                setPage(1)
                setEndLocal(e.target.value)
              }}
            />
          </label>
          <label className="block space-y-1">
            <span className="hud-label">{t('audit.page')}</span>
            <input
              type="number"
              min={1}
              className="hud-field w-20"
              value={page}
              onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
          <Button
            variant="outline"
            className="px-3 py-1.5 text-xs"
            type="button"
            onClick={() => {
              void logsQ.refetch()
              if (timesReady) {
                void reportQ.refetch()
                void metricsQ.refetch()
                void geoQ.refetch()
              }
            }}
          >
            {t('common.refresh')}
          </Button>
        </div>
        {timesReady ? (
          <p className="text-xs text-text-dim">
            {t('audit.windowLocal', { window: formatLocalWindow(startLocal, endLocal) })}
          </p>
        ) : (
          <p className="text-xs text-warn">{t('audit.rangeInvalid')}</p>
        )}
      </Card>

      {timesReady ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t('audit.totalEvents')} value={reportQ.data?.total_events ?? '—'} />
          <StatCard label={t('audit.loginAttempts')} value={reportQ.data?.login_attempts ?? '—'} />
          <StatCard
            label={t('audit.failedLogins')}
            value={metricsQ.data?.failed_logins ?? reportQ.data?.failed_logins ?? '—'}
          />
          <StatCard
            label={t('audit.permissionDenials')}
            value={metricsQ.data?.permission_denials ?? reportQ.data?.permission_denials ?? '—'}
          />
        </div>
      ) : null}

      {timesReady ? (
        <Card className="p-5">
          <AuditGeoMap stats={geoQ.data} loading={geoQ.isLoading || geoQ.isFetching} />
          {geoQ.isError ? (
            <p className="mt-3 text-xs text-warn">{t('audit.geoLoadFailed')}</p>
          ) : null}
        </Card>
      ) : null}

      {timesReady && topActions.length ? (
        <Card className="p-5">
          <div className="hud-label mb-2">{t('audit.topActions')}</div>
          <div className="flex flex-wrap gap-2">
            {topActions.map(([name, count]) => (
              <Badge key={name} tone="accent">
                {name}: {String(count)}
              </Badge>
            ))}
          </div>
          {metricsQ.data ? (
            <p className="mt-3 text-xs text-text-dim">
              {t('audit.metricsLine', {
                rate: Number(metricsQ.data.events_per_hour || 0).toFixed(1),
                violations: metricsQ.data.security_violations ?? 0,
              })}
            </p>
          ) : null}
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <HudTableScroll wide>
          <HudTable className="min-w-[1100px]">
            <thead>
              <tr>
                <th className="w-10" />
                <th>{t('audit.colTime')}</th>
                <th>{t('audit.colUser')}</th>
                <th>{t('audit.colAction')}</th>
                <th>{t('audit.colResource')}</th>
                <th>{t('audit.colResult')}</th>
                <th>{t('audit.colIp')}</th>
                <th>{t('audit.colRegion')}</th>
                <th>{t('audit.colClient')}</th>
              </tr>
            </thead>
            <tbody>
              {(logs as any[]).map((log: any, i: number) => {
                const details = parseDetails(log)
                const key = String(log.id ?? i)
                const open = Boolean(expanded[key])
                const username =
                  log.username ||
                  (details?.username as string | undefined) ||
                  (log.user_id != null ? `#${log.user_id}` : '-')
                const ua = log.user_agent || (details?.user_agent as string | undefined) || ''
                const ip = log.ip_address || log.ip || (details?.ip as string | undefined) || '-'
                const region = regionLabel(log, t, '-')
                const resourceBits = [log.resource || log.path, log.resource_id].filter(Boolean)
                const resourceLabel = resourceBits.length ? resourceBits.join(' / ') : '-'
                const status =
                  log.status_code ??
                  (typeof details?.status_code === 'number' ? details.status_code : undefined)
                const result =
                  (log.result as string | undefined) ||
                  (details?.result as string | undefined) ||
                  (status != null ? String(status) : '')
                const path =
                  (log.path as string | undefined) || (details?.path as string | undefined) || ''
                const method =
                  (log.method as string | undefined) || (details?.method as string | undefined) || ''
                const duration =
                  log.duration_ms ??
                  (typeof details?.duration_ms === 'number' ? details.duration_ms : undefined)

                return (
                  <Fragment key={key}>
                    <tr
                      className="cursor-pointer hover:bg-panel/80"
                      onClick={() => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))}
                    >
                      <td className="!overflow-visible text-center text-text-dim">{open ? '▾' : '▸'}</td>
                      <td className="font-mono text-[11px] text-text-dim">
                        {formatTime(log.created_at || log.timestamp)}
                      </td>
                      <td className="font-mono text-xs">{username}</td>
                      <td>
                        <Badge tone="accent">{log.action || '-'}</Badge>
                        {log.action === 'api_request' && log.resource_id ? (
                          <span className="ml-1 font-mono text-[10px] text-text-dim">
                            {log.resource_id}
                          </span>
                        ) : null}
                      </td>
                      <td
                        className="audit-cell-wrap max-w-[16rem] font-mono text-[11px]"
                        title={resourceLabel}
                      >
                        {resourceLabel}
                      </td>
                      <td>
                        {result ? (
                          <Badge tone={resultTone(String(result), status as number | undefined)}>
                            {resultLabel(String(result))}
                          </Badge>
                        ) : (
                          <span className="text-text-dim">-</span>
                        )}
                      </td>
                      <td className="font-mono text-xs text-cyan">{ip}</td>
                      <td
                        className="audit-cell-wrap max-w-[12rem] text-xs text-text"
                        title={[region, log.isp].filter(Boolean).join(' · ')}
                      >
                        {region}
                        {log.isp ? (
                          <span className="mt-0.5 block text-[10px] text-text-dim">{log.isp}</span>
                        ) : null}
                      </td>
                      <td className="audit-cell-wrap max-w-[12rem] text-[11px] text-text-dim" title={ua}>
                        {shortUA(ua)}
                      </td>
                    </tr>
                    {open ? (
                      <tr className="bg-panel/40">
                        <td
                          colSpan={COL_COUNT}
                          className={cn('audit-cell-wrap px-4 py-3')}
                        >
                          <div className="grid gap-3 text-xs md:grid-cols-2">
                            <div className="space-y-1">
                              <div className="hud-label">{t('audit.request')}</div>
                              <div className="font-mono text-[11px] text-text break-all">
                                {[method, path || resourceLabel].filter(Boolean).join(' ') || '-'}
                              </div>
                              {duration != null ? (
                                <div className="text-text-dim">
                                  {t('audit.duration', { ms: Number(duration).toFixed(1) })}
                                </div>
                              ) : null}
                              {status != null ? (
                                <div className="text-text-dim">
                                  {t('audit.httpStatus', { status: String(status) })}
                                </div>
                              ) : null}
                              <div className="text-text-dim break-all">
                                IP: {ip}
                                {region !== '-' ? ` · ${region}` : ''}
                                {log.isp ? ` · ${log.isp}` : ''}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="hud-label">User-Agent</div>
                              <div className="break-all text-[11px] text-text-dim">{ua || '-'}</div>
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <div className="hud-label">{t('audit.detailsJson')}</div>
                              <pre className="max-h-56 overflow-auto rounded border border-line bg-panel-solid p-3 font-mono text-[11px] leading-relaxed text-text whitespace-pre-wrap break-all">
                                {details
                                  ? JSON.stringify(details, null, 2)
                                  : log.details
                                    ? String(log.details)
                                    : t('audit.detailsEmpty')}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
              {!logsQ.isLoading && !(logs as any[]).length ? (
                <tr>
                  <td colSpan={COL_COUNT}>
                    <EmptyState>
                      {logsQ.isError ? t('audit.loadFailed') : t('audit.empty')}
                    </EmptyState>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </HudTable>
        </HudTableScroll>
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-text-dim">
          <span>{t('audit.pageInfo', { page, pages: totalPages, total })}</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="px-2 py-1 text-xs"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t('audit.prev')}
            </Button>
            <Button
              variant="ghost"
              className="px-2 py-1 text-xs"
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('audit.next')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
