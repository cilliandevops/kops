import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import { listEvents } from '@/api/cluster'
import { useCluster } from '@/store/cluster'
import { ALL_NAMESPACES, useNamespace } from '@/store/namespace'
import { Badge, Card, EmptyState, HudSelect, PageHeader } from '@/components/ui'
import { shouldSkipEnterAnim } from '@/lib/motionPrefs'
import { useTranslation } from 'react-i18next'

export function EventsPage() {
  const { t } = useTranslation()
  const { clusterId } = useCluster()
  const { namespace } = useNamespace()
  const [type, setType] = useState('')

  const scoped = namespace === ALL_NAMESPACES ? undefined : namespace

  const eventsQ = useQuery({
    queryKey: ['events', clusterId, namespace],
    queryFn: () => listEvents({ namespace: scoped, limit: 100 }),
    enabled: Boolean(clusterId),
    refetchInterval: 30_000,
  })

  const events = (eventsQ.data?.events || []).filter((e: any) =>
    type ? e.type === type : true,
  )

  return (
    <div>
      <PageHeader
        title={t('events.title')}
        subtitle={t('events.subtitle')}
        action={<Badge tone="neutral">{t('events.count', { count: events.length })}</Badge>}
      />

      <Card className="mb-4 flex flex-wrap gap-3 p-4">
        {/* Namespace comes from the scope strip; only the type filter is page-local.
            Normal/Warning stay untranslated — they are the API's own type values. */}
        <HudSelect
          aria-label={t('events.typeFilter')}
          className="w-auto min-w-[140px]"
          value={type}
          onChange={setType}
          searchableWhen={99}
          options={[
            { value: '', label: t('events.allTypes') },
            { value: 'Normal', label: 'Normal' },
            { value: 'Warning', label: 'Warning' },
          ]}
        />
      </Card>

      <div className="space-y-3">
        {events.map((event: any, index: number) => (
          <motion.div
            key={event.id || `${event.name}-${index}`}
            initial={shouldSkipEnterAnim() ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: shouldSkipEnterAnim() ? 0 : Math.min(index, 10) * 0.03 }}
          >
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={event.type === 'Warning' ? 'warn' : 'ok'}>
                    {event.type || 'Normal'}
                  </Badge>
                  <span className="font-semibold text-cyan">{event.reason}</span>
                  <span className="text-xs text-text-dim">
                    {event.objectKind}/{event.object || event.name}
                  </span>
                </div>
                <span className="text-xs text-text-dim">
                  {event.lastTime
                    ? dayjs(event.lastTime).format('YYYY-MM-DD HH:mm:ss')
                    : '-'}
                </span>
              </div>
              <p className="mt-2 text-sm text-text-dim">{event.message}</p>
              <div className="mt-2 text-xs text-text-dim">
                ns: {event.namespace || '-'} · count: {event.count ?? 1}
              </div>
            </Card>
          </motion.div>
        ))}
        {!eventsQ.isLoading && !events.length ? (
          <Card>
            <EmptyState>{t('events.empty')}</EmptyState>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
