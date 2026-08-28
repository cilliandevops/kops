import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api'

export type EnvironmentItem = {
  id: string
  name: string
  cluster_id: string
  namespace: string
  purpose: 'test' | 'staging' | 'prod' | 'other' | string
  description?: string
}

export type AccessGrant = {
  id: number
  user_id: number
  cluster_id: string
  namespace: string
}

export type AccessSnapshot = {
  unrestricted: boolean
  grants: AccessGrant[]
}

export type EnvironmentPayload = {
  name: string
  cluster_id: string
  namespace: string
  purpose: string
  description?: string
}

export function listEnvironments() {
  return apiGet<EnvironmentItem[]>('/api/v1/environments')
}

export function createEnvironment(body: EnvironmentPayload) {
  return apiPost<EnvironmentItem>('/api/v1/environments', body)
}

export function updateEnvironment(id: string, body: EnvironmentPayload) {
  return apiPut<EnvironmentItem>(`/api/v1/environments/${id}`, body)
}

export function deleteEnvironment(id: string) {
  return apiDelete(`/api/v1/environments/${id}`)
}

export function getMyAccess() {
  return apiGet<AccessSnapshot>('/api/v1/me/access')
}

export function listAccessGrants(userId?: number) {
  return apiGet<AccessGrant[]>('/api/v1/admin/access-grants', userId ? { userId } : undefined)
}

export function createAccessGrant(body: { user_id: number; cluster_id: string; namespace?: string }) {
  return apiPost<AccessGrant>('/api/v1/admin/access-grants', body)
}

export function deleteAccessGrant(id: number) {
  return apiDelete(`/api/v1/admin/access-grants/${id}`)
}
