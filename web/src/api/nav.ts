import { apiGet, apiPut } from '@/lib/api'

/**
 * Per-role sidebar blocklist. Purely cosmetic: hiding a menu does not restrict
 * the route or the API, which stay governed by role permissions.
 */
export type NavPolicy = {
  role_name?: string
  hidden_groups: string[]
  hidden_items: string[]
}

export const EMPTY_NAV_POLICY: NavPolicy = { hidden_groups: [], hidden_items: [] }

function normalize(policy: NavPolicy | null | undefined): NavPolicy {
  return {
    role_name: policy?.role_name,
    hidden_groups: policy?.hidden_groups ?? [],
    hidden_items: policy?.hidden_items ?? [],
  }
}

/** The merged policy for the signed-in user's roles. */
export async function getMyNavPolicy(): Promise<NavPolicy> {
  return normalize(await apiGet<NavPolicy>('/api/v1/nav/policy'))
}

export async function listNavPolicies(): Promise<NavPolicy[]> {
  const list = await apiGet<NavPolicy[]>('/api/v1/admin/nav/policies')
  return (list ?? []).map(normalize)
}

export async function setNavPolicy(
  roleName: string,
  hiddenGroups: string[],
  hiddenItems: string[],
): Promise<NavPolicy> {
  return normalize(
    await apiPut<NavPolicy>(`/api/v1/admin/nav/policies/${encodeURIComponent(roleName)}`, {
      hidden_groups: hiddenGroups,
      hidden_items: hiddenItems,
    }),
  )
}
