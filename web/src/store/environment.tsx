import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { listEnvironments, type EnvironmentItem } from '@/api/environment'
import { useCluster } from './cluster'
import { useNamespace } from './namespace'

type EnvironmentContextValue = {
  environments: EnvironmentItem[]
  environmentId: string
  setEnvironmentId: (id: string) => void
  applyEnvironment: (env: EnvironmentItem) => void
  loading: boolean
  active?: EnvironmentItem
}

const EnvironmentContext = createContext<EnvironmentContextValue | null>(null)
const STORAGE_KEY = 'cilikube_environment'

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const { setClusterId } = useCluster()
  const { setNamespace } = useNamespace()
  const [environmentId, setEnvironmentState] = useState(() => localStorage.getItem(STORAGE_KEY) || '')

  const { data = [], isLoading } = useQuery({
    queryKey: ['environments'],
    queryFn: listEnvironments,
  })

  const applyEnvironment = useCallback(
    (env: EnvironmentItem) => {
      setEnvironmentState(env.id)
      localStorage.setItem(STORAGE_KEY, env.id)
      setClusterId(env.cluster_id)
      setNamespace(env.namespace)
    },
    [setClusterId, setNamespace],
  )

  const setEnvironmentId = useCallback(
    (id: string) => {
      if (!id) {
        setEnvironmentState('')
        localStorage.removeItem(STORAGE_KEY)
        return
      }
      const env = data.find((e) => e.id === id)
      if (env) applyEnvironment(env)
    },
    [data, applyEnvironment],
  )

  const active = data.find((e) => e.id === environmentId)

  const value = useMemo(
    () => ({
      environments: data,
      environmentId,
      setEnvironmentId,
      applyEnvironment,
      loading: isLoading,
      active,
    }),
    [data, environmentId, setEnvironmentId, applyEnvironment, isLoading, active],
  )

  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>
}

export function useEnvironment() {
  const ctx = useContext(EnvironmentContext)
  if (!ctx) throw new Error('useEnvironment must be used within EnvironmentProvider')
  return ctx
}
