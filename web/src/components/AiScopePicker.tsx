import { useTranslation } from 'react-i18next'
import { HudSelect } from '@/components/ui'
import { useCluster } from '@/store/cluster'
import { ALL_NAMESPACES, useNamespace } from '@/store/namespace'

/**
 * Cluster + namespace pickers sized for the AI composer bar. The AI route has no
 * ContextBar (it is not a cluster-scoped page), yet every prompt is answered
 * against this scope — so it has to be changeable without leaving the chat.
 */
export function AiScopePicker({ disabled }: { disabled?: boolean }) {
  const { t } = useTranslation()
  const { clusters, clusterId, setClusterId, switching } = useCluster()
  const { namespace, setNamespace, namespaces } = useNamespace()

  return (
    <div className="ai-ops-scope">
      <HudSelect
        aria-label={t('context.cluster')}
        className="ai-ops-scope-select"
        value={clusterId}
        onChange={setClusterId}
        disabled={disabled || switching || !clusters.length}
        options={clusters.map((c) => ({ value: c.id || c.name, label: c.name || c.id }))}
        menuMinWidth={320}
      />
      <span className="ai-ops-scope-sep" aria-hidden>
        /
      </span>
      <HudSelect
        aria-label={t('context.namespace')}
        className="ai-ops-scope-select"
        value={namespace}
        onChange={setNamespace}
        disabled={disabled}
        searchableWhen={0}
        options={[
          { value: ALL_NAMESPACES, label: t('common.allNamespaces') },
          ...namespaces.map((n) => ({ value: n, label: n })),
        ]}
        menuMinWidth={180}
      />
    </div>
  )
}
