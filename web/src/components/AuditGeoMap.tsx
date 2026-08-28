import { useTranslation } from 'react-i18next'
import { HudTable, HudTableScroll } from '@/components/HudTableScroll'
import { regionLabel } from '@/lib/geoRegion'
import { cn } from '@/lib/utils'

export type GeoBucket = {
  country?: string
  province?: string
  city?: string
  label?: string
  hits: number
  visitors: number
}

export type GeoIPRow = {
  ip: string
  hits: number
  region?: string
  region_kind?: string
  country?: string
  province?: string
  city?: string
  isp?: string
  last_seen?: string
}

export type GeoStats = {
  total_hits?: number
  total_visitors?: number
  unknown_hits?: number
  countries?: GeoBucket[]
  provinces?: GeoBucket[]
  cities?: GeoBucket[]
  ips?: GeoIPRow[]
}

type Props = {
  stats?: GeoStats | null
  loading?: boolean
}

function formatTime(raw?: string): string {
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleString(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function RankCard({
  title,
  items,
  empty,
  metricLabel,
}: {
  title: string
  items: GeoBucket[]
  empty: string
  metricLabel: string
}) {
  const max = Math.max(1, ...items.map((i) => i.hits || 0))
  return (
    <div className="min-w-0 rounded border border-border/60 bg-bg/40 p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div className="hud-label">{title}</div>
        <span className="text-[10px] uppercase tracking-[0.12em] text-text-dim">{metricLabel}</span>
      </div>
      {!items.length ? (
        <p className="py-4 text-center text-xs text-text-dim">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.slice(0, 12).map((item, idx) => {
            const value = item.hits || 0
            const pct = Math.round((value / max) * 100)
            const name = item.label || item.city || item.province || item.country || '—'
            return (
              <li key={`${title}-${name}-${idx}`} className="min-w-0">
                <div className="mb-0.5 flex items-baseline justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate font-medium text-text">
                    <span className="mr-1.5 inline-block w-4 text-right tabular-nums text-text-dim">
                      {idx + 1}
                    </span>
                    {name}
                  </span>
                  <span className="shrink-0 tabular-nums text-cyan">
                    {value}
                    {item.visitors > 0 && item.visitors !== value ? (
                      <span className="ml-1 text-[10px] text-text-dim">· {item.visitors} IP</span>
                    ) : null}
                  </span>
                </div>
                <div className="ml-5 h-1 overflow-hidden rounded-full bg-border/50">
                  <div
                    className="h-full rounded-full bg-cyan/75"
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function AuditGeoMap({ stats, loading }: Props) {
  const { t } = useTranslation()
  const ips = stats?.ips || []

  return (
    <div className={cn('space-y-4', loading && 'opacity-70')}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="hud-label">{t('audit.geoTitle')}</div>
          <p className="mt-0.5 text-xs text-text-dim">{t('audit.geoHint')}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-text-dim">
          <span>
            {t('audit.uniqueIps')}:{' '}
            <strong className="text-text">{loading ? '…' : (stats?.total_visitors ?? 0)}</strong>
          </span>
          <span>
            {t('audit.hits')}:{' '}
            <strong className="text-text">{loading ? '…' : (stats?.total_hits ?? 0)}</strong>
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <RankCard
          title={t('audit.topProvinces')}
          items={stats?.provinces || []}
          empty={t('audit.geoEmpty')}
          metricLabel={t('audit.hits')}
        />
        <RankCard
          title={t('audit.topCities')}
          items={stats?.cities || []}
          empty={t('audit.geoEmpty')}
          metricLabel={t('audit.hits')}
        />
        <RankCard
          title={t('audit.topCountries')}
          items={stats?.countries || []}
          empty={t('audit.geoEmpty')}
          metricLabel={t('audit.hits')}
        />
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <div className="hud-label">{t('audit.ipTable')}</div>
          <span className="text-[10px] text-text-dim">{t('audit.ipTableHint')}</span>
        </div>
        {!ips.length && !loading ? (
          <p className="rounded border border-border/50 px-3 py-6 text-center text-xs text-text-dim">
            {t('audit.geoEmpty')}
          </p>
        ) : (
          <HudTableScroll>
            <HudTable className="min-w-[720px]">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>{t('audit.colIp')}</th>
                  <th>{t('audit.colRegion')}</th>
                  <th>{t('audit.colIsp')}</th>
                  <th className="text-right">{t('audit.hits')}</th>
                  <th>{t('audit.colLastSeen')}</th>
                </tr>
              </thead>
              <tbody>
                {ips.map((row, idx) => {
                  const region = regionLabel(row, t)
                  return (
                    <tr key={row.ip}>
                      <td className="tabular-nums text-text-dim">{idx + 1}</td>
                      <td className="font-mono text-xs text-cyan">{row.ip}</td>
                      <td>
                        <div className="text-xs">{region}</div>
                      </td>
                      <td className="text-xs text-text-dim">{row.isp || '—'}</td>
                      <td className="text-right tabular-nums font-semibold text-text">{row.hits}</td>
                      <td className="whitespace-nowrap text-xs text-text-dim">
                        {formatTime(row.last_seen)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </HudTable>
          </HudTableScroll>
        )}
      </div>
    </div>
  )
}
