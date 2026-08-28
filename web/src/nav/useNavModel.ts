import { useQuery } from '@tanstack/react-query'
import { EMPTY_NAV_POLICY, getMyNavPolicy, type NavPolicy } from '@/api/nav'
import { useAuth } from '@/store/auth'
import {
  allNavGroups,
  navGroupsForSection,
  type NavGroup,
  type NavSectionId,
} from './definitions'
import { applyNavPrefs, useNavPrefs, type NavPrefs } from './prefs'

export type NavModel = {
  /**
   * Everything this user is allowed to see, across all sections, before their
   * personal hiding is applied — this is the menu the customizer offers.
   */
  authorized: NavGroup[]
  /** What the sidebar renders for the current section. */
  visible: NavGroup[]
  prefs: NavPrefs
  policy: NavPolicy
}

/** Drop the sidebar entries an admin has hidden for this user's roles. */
export function applyPolicy(groups: NavGroup[], policy: NavPolicy): NavGroup[] {
  const hiddenGroups = new Set(policy.hidden_groups)
  const hiddenItems = new Set(policy.hidden_items)
  return groups
    .filter((group) => !hiddenGroups.has(group.titleKey))
    .map((group) => ({ ...group, items: group.items.filter((item) => !hiddenItems.has(item.to)) }))
    .filter((group) => group.items.length > 0)
}

/**
 * Resolves the sidebar in three layers, narrowest first:
 * role permissions (the real gate) → the admin's per-role menu policy →
 * the user's personal order and hiding.
 */
export function useNavModel(section: NavSectionId): NavModel {
  const { isAuthenticated, checkPermission, isViewerOnly, isAdmin } = useAuth()
  const prefs = useNavPrefs()

  const policyQ = useQuery({
    queryKey: ['nav-policy'],
    queryFn: getMyNavPolicy,
    enabled: isAuthenticated,
    staleTime: 60_000,
  })
  const policy = policyQ.data ?? EMPTY_NAV_POLICY

  const permitted = (groups: NavGroup[]): NavGroup[] =>
    groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (item.to.startsWith('/admin') || item.to === '/audit') return isAdmin
          if (item.to === '/proxy') return !isViewerOnly
          if (item.resource) return checkPermission(item.resource, 'read')
          return true
        }),
      }))
      .filter((group) => group.items.length > 0)

  const authorize = (groups: NavGroup[]): NavGroup[] => applyPolicy(permitted(groups), policy)

  return {
    authorized: authorize(allNavGroups),
    visible: applyNavPrefs(authorize(navGroupsForSection(section)), prefs),
    prefs,
    policy,
  }
}
