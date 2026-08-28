import { apiPost, apiPut } from '@/lib/api'

export type NodeTaint = {
  key: string
  value?: string
  effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute'
}

export type DrainOptions = {
  gracePeriodSeconds?: number
  deleteEmptyDirData?: boolean
  ignoreDaemonSets?: boolean
  force?: boolean
  timeoutSeconds?: number
  dryRun?: boolean
}

export type DrainPodResult = {
  namespace: string
  name: string
  action: 'evicted' | 'skipped' | 'failed'
  reason?: string
}

export type DrainResult = {
  node: string
  cordoned: boolean
  evicted: number
  skipped: number
  failed: number
  dryRun: boolean
  pods: DrainPodResult[]
}

function base(name: string) {
  return `/api/v1/nodes/${encodeURIComponent(name)}`
}

export async function cordonNode(name: string) {
  return apiPost<any>(`${base(name)}/cordon`)
}

export async function uncordonNode(name: string) {
  return apiPost<any>(`${base(name)}/uncordon`)
}

export async function drainNode(name: string, opts: DrainOptions) {
  return apiPost<DrainResult>(`${base(name)}/drain`, opts)
}

export async function updateNodeTaints(name: string, taints: NodeTaint[]) {
  return apiPut<any>(`${base(name)}/taints`, { taints })
}

export async function updateNodeMeta(
  name: string,
  payload: {
    labels?: Record<string, string>
    removeLabels?: string[]
    annotations?: Record<string, string>
    removeAnnotations?: string[]
  },
) {
  return apiPut<any>(`${base(name)}/meta`, payload)
}
