import { apiDelete, apiGet, apiPost } from '@/lib/api'

export type HelmRepo = {
  name: string
  url: string
}

export type HelmChartSummary = {
  ref: string
  repo: string
  name: string
  version: string
  appVersion?: string
  description?: string
}

export type HelmChartDetail = HelmChartSummary & {
  icon?: string
  home?: string
  deprecated?: boolean
  keywords?: string[]
  sources?: string[]
  readme?: string
  values?: string
  versions?: string[]
}

export type HelmRelease = {
  name: string
  namespace: string
  revision?: string
  updated?: string
  status?: string
  chart?: string
  app_version?: string
}

export type HelmInstallPayload = {
  name: string
  namespace: string
  chart: string
  version?: string
  values?: string
  createNamespace?: boolean
}

export async function listHelmRepos() {
  return apiGet<HelmRepo[]>('/api/v1/helm/repos')
}

export async function addHelmRepo(name: string, url: string) {
  return apiPost<{ name: string }>('/api/v1/helm/repos', { name, url })
}

export async function removeHelmRepo(name: string) {
  return apiDelete<{ name: string }>(`/api/v1/helm/repos/${encodeURIComponent(name)}`)
}

export async function updateHelmRepos() {
  return apiPost<{ updated: boolean }>('/api/v1/helm/repos/update')
}

export async function listHelmCharts(refresh = false) {
  return apiGet<HelmChartSummary[]>('/api/v1/helm/charts', refresh ? { refresh: '1' } : undefined)
}

export async function getHelmChart(ref: string, version?: string) {
  return apiGet<HelmChartDetail>('/api/v1/helm/chart', { ref, version: version || undefined })
}

export async function listHelmReleases(namespace?: string) {
  return apiGet<HelmRelease[]>('/api/v1/helm/releases', { namespace: namespace || undefined })
}

export async function installHelmRelease(payload: HelmInstallPayload) {
  return apiPost<{ output: string }>('/api/v1/helm/releases', payload)
}

export async function uninstallHelmRelease(namespace: string, name: string) {
  return apiDelete<{ output: string }>(
    `/api/v1/helm/releases/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
  )
}

export async function rollbackHelmRelease(namespace: string, name: string, revision?: string) {
  return apiPost<{ output: string }>(
    `/api/v1/helm/releases/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/rollback`,
    revision ? { revision } : {},
  )
}
