import { useLocation } from 'react-router-dom'
import { ClusterNamespaceControls } from '@/components/ClusterNamespaceControls'
import { contextScopeForPath } from '@/nav/definitions'

/**
 * Scope strip above the page content: which cluster — and where it matters,
 * which namespace — the page is reading. Pages that answer to neither (admin,
 * audit, environments, profile) render no strip at all.
 */
export function ContextBar() {
  const { pathname } = useLocation()
  const scope = contextScopeForPath(pathname)

  if (!scope.cluster) return null

  return (
    <div className="app-context-bar">
      <ClusterNamespaceControls showNamespace={scope.namespace} />
    </div>
  )
}
