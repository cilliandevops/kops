import type { TFunction } from 'i18next'
import { cn } from '@/lib/utils'
import type { PodMetricsItem } from '@/api/cluster'
import type { ResourceColumn } from '@/components/ResourceListPage'

function toneForRatio(ratio?: number): string {
  if (ratio == null || !Number.isFinite(ratio) || ratio <= 0) return 'text-text-dim'
  if (ratio >= 1) return 'text-danger'
  if (ratio >= 0.8) return 'text-warn'
  return 'text-text'
}

function MetricValue({
  value,
  title,
  ratio,
}: {
  value?: string
  title?: string
  ratio?: number
}) {
  const text = value && value !== '' ? value : '-'
  return (
    <span
      className={cn('font-mono text-[12px] tabular-nums', toneForRatio(ratio))}
      title={title}
    >
      {text}
    </span>
  )
}

/** Compact k9s-style percent cell (%CPU/R, %MEM/L, …). */
export function PercentCell({
  percent,
  ratio,
  hint,
}: {
  percent?: string
  ratio?: number
  hint?: string
}) {
  return <MetricValue value={percent} ratio={ratio} title={hint} />
}

/**
 * Headers stay in kubectl's own vocabulary (CPU, %CPU/R) — only the hover hints
 * are prose, so `t` is passed in rather than read from a hook.
 */
export function podMetricColumns(
  get: (item: any) => PodMetricsItem | undefined,
  t: TFunction,
): ResourceColumn[] {
  return [
    {
      key: 'cpu',
      header: 'CPU',
      titleKey: 'metrics.cpu',
      render: (item: any) => {
        const m = get(item)
        return (
          <MetricValue
            value={m?.cpu}
            title={m ? `req ${m.cpuRequest || '-'} / lim ${m.cpuLimit || '-'}` : undefined}
          />
        )
      },
    },
    {
      key: 'cpuR',
      header: '%CPU/R',
      titleKey: 'metrics.cpuRequest',
      render: (item: any) => {
        const m = get(item)
        return (
          <PercentCell
            percent={m?.cpuRequestPercent}
            ratio={m?.cpuRequestRatio}
            hint={m?.cpuRequest ? `request ${m.cpuRequest}` : t('metrics.noCpuRequest')}
          />
        )
      },
    },
    {
      key: 'cpuL',
      header: '%CPU/L',
      titleKey: 'metrics.cpuLimit',
      render: (item: any) => {
        const m = get(item)
        return (
          <PercentCell
            percent={m?.cpuLimitPercent}
            ratio={m?.cpuLimitRatio}
            hint={m?.cpuLimit ? `limit ${m.cpuLimit}` : t('metrics.noCpuLimit')}
          />
        )
      },
    },
    {
      key: 'mem',
      header: 'MEM',
      titleKey: 'metrics.mem',
      render: (item: any) => {
        const m = get(item)
        return (
          <MetricValue
            value={m?.memory}
            title={m ? `req ${m.memoryRequest || '-'} / lim ${m.memoryLimit || '-'}` : undefined}
          />
        )
      },
    },
    {
      key: 'memR',
      header: '%MEM/R',
      titleKey: 'metrics.memRequest',
      render: (item: any) => {
        const m = get(item)
        return (
          <PercentCell
            percent={m?.memoryRequestPercent}
            ratio={m?.memoryRequestRatio}
            hint={m?.memoryRequest ? `request ${m.memoryRequest}` : t('metrics.noMemRequest')}
          />
        )
      },
    },
    {
      key: 'memL',
      header: '%MEM/L',
      titleKey: 'metrics.memLimit',
      render: (item: any) => {
        const m = get(item)
        return (
          <PercentCell
            percent={m?.memoryLimitPercent}
            ratio={m?.memoryLimitRatio}
            hint={m?.memoryLimit ? `limit ${m.memoryLimit}` : t('metrics.noMemLimit')}
          />
        )
      },
    },
  ]
}
