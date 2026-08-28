import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { listNamespaces } from '@/api/cluster'
import { getMyAccess } from '@/api/environment'
import { useCluster } from './cluster'

/** Empty string = all namespaces (cluster-wide list). */
export const ALL_NAMESPACES = ''

type NamespaceContextValue = {
  namespaces: string[]
  namespace: string
  setNamespace: (ns: string) => void
  loading: boolean
  isAllNamespaces: boolean
}

const NamespaceContext = createContext<NamespaceContextValue | null>(null)
const STORAGE_KEY = 'cilikube_namespace'

export function NamespaceProvider({ children }: { children: ReactNode }) {
  const { clusterId } = useCluster()
  const [namespace, setNamespaceState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === null) return 'default'
    // Stored empty string means All namespaces
    return saved
  })

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['namespaces', clusterId],
    queryFn: listNamespaces,
    enabled: Boolean(clusterId),
  })
  const accessQ = useQuery({
    queryKey: ['me-access'],
    queryFn: getMyAccess,
  })
  const data = (() => {
    const snap = accessQ.data
    if (!snap || snap.unrestricted || !clusterId) return raw
    const allowed = new Set(
      snap.grants.filter((g) => g.cluster_id === clusterId).map((g) => g.namespace),
    )
    if (snap.grants.some((g) => g.cluster_id === clusterId && !g.namespace)) return raw
    return raw.filter((ns) => allowed.has(ns))
  })()

  useEffect(() => {
    if (!data.length) return
    // Keep All namespaces selection
    if (namespace === ALL_NAMESPACES) return
    if (!data.includes(namespace)) {
      const next = data.includes('default') ? 'default' : data[0]
      setNamespaceState(next)
      localStorage.setItem(STORAGE_KEY, next)
    }
  }, [data, namespace])

  const setNamespace = useCallback((ns: string) => {
    setNamespaceState(ns)
    localStorage.setItem(STORAGE_KEY, ns)
  }, [])

  const value = useMemo(
    () => ({
      namespaces: data,
      namespace,
      setNamespace,
      loading: isLoading,
      isAllNamespaces: namespace === ALL_NAMESPACES,
    }),
    [data, namespace, setNamespace, isLoading],
  )

  return <NamespaceContext.Provider value={value}>{children}</NamespaceContext.Provider>
}

export function useNamespace() {
  const ctx = useContext(NamespaceContext)
  if (!ctx) throw new Error('useNamespace must be used within NamespaceProvider')
  return ctx
}
