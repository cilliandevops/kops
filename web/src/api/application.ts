import { apiGet } from '@/lib/api'

export type ApplicationRef = { kind: string; name: string }

export type ApplicationItem = {
  name: string
  namespace: string
  status: string
  reason?: string
  images: string[]
  replicas: number
  readyReplicas: number
  deployments: ApplicationRef[]
  services: ApplicationRef[]
  ingresses: ApplicationRef[]
}

export function listApplications(namespace?: string) {
  return apiGet<ApplicationItem[]>('/api/v1/applications', namespace ? { namespace } : undefined)
}

export function getApplication(namespace: string, name: string) {
  return apiGet<ApplicationItem>(`/api/v1/applications/${namespace}/${name}`)
}
