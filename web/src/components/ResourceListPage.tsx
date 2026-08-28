import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useCluster } from '@/store/cluster'
import { useNamespace } from '@/store/namespace'
import { useAuth } from '@/store/auth'
import { Badge, Button, EmptyState, PageHeader } from '@/components/ui'
import { HudTable, HudTablePanel, ListPageFrame } from '@/components/HudTableScroll'
import { ResourceCreateModal } from '@/components/ResourceCreateModal'
import { AgeCell, CreatedCell } from '@/components/AgeCell'
import { metaCreated } from '@/api/resources'
import { shouldSkipEnterAnim } from '@/lib/motionPrefs'

export type ResourceColumn = {
  key: string
  /** Literal header. Prefer `headerKey` — column arrays are plain data with no `t` in scope. */
  header?: string
  /** i18n key for the header, translated here by the renderer. */
  headerKey?: string
  /** Hover hint — useful for abbreviated headers like %CPU/R */
  title?: string
  /** i18n key for the hover hint. */
  titleKey?: string
  render: (item: any) => ReactNode
}

export function ResourceListPage({
  title,
  titleKey,
  subtitle,
  subtitleKey,
  resourceKey,
  namespaced,
  queryFn,
  columns,
  extraAction,
  actions,
  creatable = true,
  pinFirstColumn: _pinFirstColumn = false,
}: {
  title?: string
  /** i18n key for the page title; wins over `title`. */
  titleKey?: string
  subtitle?: string
  /** i18n key for the subtitle; wins over `subtitle`. */
  subtitleKey?: string
  resourceKey: string
  namespaced?: boolean
  queryFn: () => Promise<any[]>
  columns: ResourceColumn[]
  extraAction?: ReactNode
  actions?: (item: any, helpers: { refetch: () => void }) => ReactNode
  /** Show Create YAML button when user can mutate this resource */
  creatable?: boolean
  /** Kept for call-site compatibility; lists always pin Name + scroll wide on mobile */
  pinFirstColumn?: boolean
}) {
  void _pinFirstColumn
  const { t } = useTranslation()
  const { clusterId } = useCluster()
  const { namespace, isAllNamespaces } = useNamespace()
  const { canMutate } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const showCreate = creatable && canMutate(resourceKey)

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: [resourceKey, clusterId, namespaced ? (namespace || '__all__') : 'cluster'],
    queryFn,
    enabled: Boolean(clusterId) && (!namespaced || namespace !== undefined),
  })

  const cols: ResourceColumn[] = actions
    ? [
        ...columns,
        {
          key: '_actions',
          headerKey: 'common.actions',
          render: (item: any) => actions(item, { refetch: () => void refetch() }),
        },
      ]
    : columns

  const scopeSubtitle = namespaced
    ? isAllNamespaces
      ? t('common.allNamespaces')
      : // `ns` is reserved by i18next (it selects a translation namespace).
        t('resourceList.namespaceScope', { namespace })
    : t('resourceList.clusterScoped')

  return (
    <ListPageFrame>
      <PageHeader
        title={titleKey ? t(titleKey) : title || ''}
        subtitle={subtitleKey ? t(subtitleKey) : subtitle || scopeSubtitle}
        action={
          <>
            {showCreate ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-9 px-3 py-1.5 text-xs"
                onClick={() => setCreateOpen(true)}
              >
                {t('resourceList.createYaml')}
              </Button>
            ) : null}
            {extraAction}
            <Badge tone="accent">{data.length}</Badge>
          </>
        }
      />

      <ResourceCreateModal
        open={createOpen}
        resource={resourceKey}
        namespaced={namespaced}
        onClose={() => setCreateOpen(false)}
      />

      <HudTablePanel pinFirst wide>
        <HudTable pinFirst wide>
          <thead>
            <tr>
              {cols.map((col) => (
                <th
                  key={col.key}
                  title={col.titleKey ? t(col.titleKey) : col.title}
                >
                  {col.headerKey ? t(col.headerKey) : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item: any, index: number) => (
              <motion.tr
                key={item?.metadata?.uid || item?.metadata?.name || index}
                initial={shouldSkipEnterAnim() ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: shouldSkipEnterAnim() ? 0 : Math.min(index, 12) * 0.02 }}
              >
                {cols.map((col) => (
                  <td key={col.key}>{col.render(item)}</td>
                ))}
              </motion.tr>
            ))}
            {!isLoading && !data.length ? (
              <tr>
                <td colSpan={cols.length}>
                  <EmptyState>
                    {/* resourceKey stays as-is: it is the Kubernetes plural, not prose. */}
                    {namespaced
                      ? isAllNamespaces
                        ? t('resourceList.emptyAll', { resource: resourceKey })
                        : t('resourceList.emptyNs', { resource: resourceKey, namespace })
                      : t('resourceList.emptyCluster', { resource: resourceKey })}
                  </EmptyState>
                </td>
              </tr>
            ) : null}
          </tbody>
        </HudTable>
      </HudTablePanel>
    </ListPageFrame>
  )
}

/** Age column — relative (k9s style). */
export function ageCell(item: any) {
  return <AgeCell value={metaCreated(item)} />
}

/** Created column — absolute local time. */
export function createdCell(item: any) {
  return <CreatedCell value={metaCreated(item)} />
}

/** @deprecated use ageCell + createdCell; kept for call sites that only need age */
export function ageCellFrom(value: unknown) {
  return <AgeCell value={value} />
}

/** Pair of columns: Age then Created — drop into ResourceListPage columns arrays. */
export const ageAndCreatedColumns: ResourceColumn[] = [
  { key: 'age', headerKey: 'common.age', render: ageCell },
  { key: 'created', headerKey: 'common.created', render: createdCell },
]
