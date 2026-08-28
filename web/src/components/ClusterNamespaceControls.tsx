import { useTranslation } from 'react-i18next'
import { HudSelect } from '@/components/ui'
import { useCluster } from '@/store/cluster'
import { ALL_NAMESPACES, useNamespace } from '@/store/namespace'
import { cn } from '@/lib/utils'

type Props = {
  /** Cluster-scoped pages ignore the namespace, so they drop that picker. */
  showNamespace?: boolean
  className?: string
}

/**
 * Cluster + namespace pickers. Rendered by `ContextBar` above the page content
 * rather than in the topbar, so the topbar stays identical across sections.
 * One responsive row: side by side on phones, left-aligned and compact above.
 */
export function ClusterNamespaceControls({ showNamespace = true, className }: Props) {
  const { t } = useTranslation()
  const { clusters, clusterId, setClusterId, switching } = useCluster()
  const { namespace, setNamespace, namespaces } = useNamespace()

  const clusterLabel = t('context.cluster')
  const nsLabel = t('context.namespace')

  const clusterOptions = clusters.map((c) => ({
    value: c.id || c.name,
    label: c.name || c.id,
  }))
  const nsOptions = [
    { value: ALL_NAMESPACES, label: t('common.allNamespaces') },
    ...namespaces.map((n) => ({ value: n, label: n })),
  ]

  return (
    <div className={cn('app-context-fields', className)}>
      <div className="app-context-field is-cluster">
        {/* The select carries the same text as aria-label, so this is decorative. */}
        <span className="hud-label app-context-label" aria-hidden>
          {clusterLabel}
        </span>
        <HudSelect
          aria-label={clusterLabel}
          className="app-context-select"
          value={clusterId}
          onChange={setClusterId}
          disabled={switching || !clusters.length}
          options={clusterOptions}
          menuMinWidth={340}
        />
      </div>

      {showNamespace ? (
        <div className="app-context-field is-ns">
          <span className="hud-label app-context-label" aria-hidden>
            {nsLabel}
          </span>
          <HudSelect
            aria-label={nsLabel}
            className="app-context-select"
            value={namespace}
            onChange={setNamespace}
            searchableWhen={0}
            options={nsOptions}
            menuMinWidth={180}
          />
        </div>
      ) : null}
    </div>
  )
}
