import { useSyncExternalStore } from 'react'
import type { NavGroup } from './definitions'

const NAV_PREFS_STORAGE_KEY = 'cilikube_nav_prefs'

/**
 * Personal sidebar layout, per browser. Group ids are `titleKey`s and item ids
 * are `to` paths. Orders are sparse on purpose: anything absent (a menu added
 * by a later release) keeps its natural position at the end of its group rather
 * than vanishing.
 */
export type NavPrefs = {
  groupOrder: string[]
  itemOrder: Record<string, string[]>
  hiddenGroups: string[]
  hiddenItems: string[]
}

export const EMPTY_NAV_PREFS: NavPrefs = {
  groupOrder: [],
  itemOrder: {},
  hiddenGroups: [],
  hiddenItems: [],
}

const listeners = new Set<() => void>()

/**
 * useSyncExternalStore demands a referentially stable snapshot, so the parsed
 * value is cached and only rebuilt when it actually changes.
 */
let cached: NavPrefs | null = null

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

function parse(raw: string | null): NavPrefs {
  if (!raw) return EMPTY_NAV_PREFS
  try {
    const parsed = JSON.parse(raw) as Partial<NavPrefs>
    const itemOrder: Record<string, string[]> = {}
    if (parsed.itemOrder && typeof parsed.itemOrder === 'object') {
      for (const [group, order] of Object.entries(parsed.itemOrder)) {
        const list = strings(order)
        if (list.length) itemOrder[group] = list
      }
    }
    return {
      groupOrder: strings(parsed.groupOrder),
      itemOrder,
      hiddenGroups: strings(parsed.hiddenGroups),
      hiddenItems: strings(parsed.hiddenItems),
    }
  } catch {
    return EMPTY_NAV_PREFS
  }
}

export function getNavPrefs(): NavPrefs {
  if (cached) return cached
  try {
    cached = parse(localStorage.getItem(NAV_PREFS_STORAGE_KEY))
  } catch {
    cached = EMPTY_NAV_PREFS
  }
  return cached
}

function emit(next: NavPrefs): void {
  cached = next
  listeners.forEach((l) => l())
}

export function setNavPrefs(patch: Partial<NavPrefs>): void {
  const next: NavPrefs = { ...getNavPrefs(), ...patch }
  try {
    localStorage.setItem(NAV_PREFS_STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  emit(next)
}

export function resetNavPrefs(): void {
  try {
    localStorage.removeItem(NAV_PREFS_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  emit(EMPTY_NAV_PREFS)
}

export function subscribeNavPrefs(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

if (typeof window !== 'undefined') {
  // Keep other tabs of the same browser in sync.
  window.addEventListener('storage', (e) => {
    if (e.key !== NAV_PREFS_STORAGE_KEY) return
    emit(parse(e.newValue))
  })
}

export function useNavPrefs(): NavPrefs {
  return useSyncExternalStore(subscribeNavPrefs, getNavPrefs, () => EMPTY_NAV_PREFS)
}

/**
 * Sort `list` by `order`, appending anything `order` does not mention so new
 * entries stay reachable instead of being dropped.
 */
function applyOrder<T>(list: T[], order: string[], idOf: (item: T) => string): T[] {
  if (!order.length) return list
  const rank = new Map(order.map((id, i) => [id, i]))
  const known: T[] = []
  const unknown: T[] = []
  for (const item of list) {
    if (rank.has(idOf(item))) known.push(item)
    else unknown.push(item)
  }
  known.sort((a, b) => (rank.get(idOf(a)) ?? 0) - (rank.get(idOf(b)) ?? 0))
  return [...known, ...unknown]
}

/**
 * Apply only the personal ordering, keeping hidden entries in place. The
 * customizer needs this so a hidden menu is still listed and can be restored.
 */
export function orderNavGroups(groups: NavGroup[], prefs: NavPrefs): NavGroup[] {
  const ordered = groups.map((group) => ({
    ...group,
    items: applyOrder(group.items, prefs.itemOrder[group.titleKey] ?? [], (item) => item.to),
  }))
  return applyOrder(ordered, prefs.groupOrder, (group) => group.titleKey)
}

/** Apply personal ordering and hiding on top of already-authorized groups. */
export function applyNavPrefs(groups: NavGroup[], prefs: NavPrefs): NavGroup[] {
  const hiddenGroups = new Set(prefs.hiddenGroups)
  const hiddenItems = new Set(prefs.hiddenItems)

  const shaped = groups
    .filter((group) => !hiddenGroups.has(group.titleKey))
    .map((group) => ({
      ...group,
      items: applyOrder(
        group.items.filter((item) => !hiddenItems.has(item.to)),
        prefs.itemOrder[group.titleKey] ?? [],
        (item) => item.to,
      ),
    }))
    .filter((group) => group.items.length > 0)

  return applyOrder(shaped, prefs.groupOrder, (group) => group.titleKey)
}
