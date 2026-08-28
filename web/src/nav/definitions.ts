import {
  Activity,
  AppWindow,
  Boxes,
  CalendarClock,
  Cloud,
  Database,
  FileCode2,
  Gauge,
  HardDrive,
  History,
  KeyRound,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  Network,
  Package,
  ScrollText,
  Server,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  UserRound,
  Waypoints,
  Workflow,
} from 'lucide-react'

/**
 * Nav identity: an item is identified by its `to` path and a group by its
 * `titleKey`. Both are already unique and stable, and persisted nav
 * preferences/policies key off them — renaming either is a breaking change.
 */
export type NavItem = {
  to: string
  labelKey: string
  icon: typeof Server
  /** Page narrows its data by the active namespace, so it needs the namespace picker. */
  namespaced?: boolean
  /** Set false for pages that ignore the active cluster (admin, audit, environments). */
  clusterScoped?: boolean
  resource?: string
  /** Match this path exactly, so a parent entry stays inactive on child routes. */
  exact?: boolean
}
export type NavGroup = { titleKey: string; icon: typeof Server; items: NavItem[] }

export type NavSectionId = 'ai' | 'console' | 'marketplace'

/** Top-level destinations in the topbar switcher. Console entry lands on Fleet. */
export const SECTIONS = [
  { id: 'ai', to: '/ai', labelKey: 'nav.sectionAi', icon: Sparkles },
  { id: 'console', to: '/fleet', labelKey: 'nav.sectionConsole', icon: Terminal },
  { id: 'marketplace', to: '/marketplace', labelKey: 'nav.marketplace', icon: Package },
] as const

/** Marketplace is its own section: its sidebar never shows console resources. */
export const marketplaceNavGroups: NavGroup[] = [
  {
    titleKey: 'nav.marketplace',
    icon: Package,
    items: [
      { to: '/marketplace', labelKey: 'marketplace.tab.discover', icon: Package, exact: true },
      { to: '/marketplace/installed', labelKey: 'marketplace.tab.installed', icon: Boxes, namespaced: true },
      { to: '/marketplace/repos', labelKey: 'marketplace.tab.repos', icon: Database },
    ],
  },
]

export const consoleNavGroups: NavGroup[] = [
  {
    titleKey: 'nav.cluster',
    icon: Cloud,
    items: [
      { to: '/fleet', labelKey: 'nav.fleet', icon: LayoutGrid },
      { to: '/overview', labelKey: 'nav.overview', icon: LayoutDashboard },
      { to: '/nodes', labelKey: 'nav.nodes', icon: Server, resource: 'nodes' },
      { to: '/namespaces', labelKey: 'nav.namespaces', icon: Layers, resource: 'namespaces' },
      { to: '/events', labelKey: 'nav.events', icon: Activity, namespaced: true },
      { to: '/leases', labelKey: 'nav.leases', icon: History, namespaced: true, resource: 'leases' },
      { to: '/clusters', labelKey: 'nav.clusters', icon: Cloud, resource: 'clusters' },
      { to: '/environments', labelKey: 'nav.environments', icon: Layers, clusterScoped: false },
      { to: '/crds', labelKey: 'nav.crds', icon: FileCode2 },
    ],
  },
  {
    titleKey: 'nav.workloads',
    icon: Boxes,
    items: [
      { to: '/applications', labelKey: 'nav.applications', icon: AppWindow, namespaced: true, resource: 'deployments' },
      { to: '/pods', labelKey: 'nav.pods', icon: Boxes, namespaced: true, resource: 'pods' },
      { to: '/deployments', labelKey: 'nav.deployments', icon: Boxes, namespaced: true, resource: 'deployments' },
      { to: '/statefulsets', labelKey: 'nav.statefulsets', icon: Boxes, namespaced: true, resource: 'statefulsets' },
      { to: '/daemonsets', labelKey: 'nav.daemonsets', icon: Boxes, namespaced: true, resource: 'daemonsets' },
      { to: '/replicasets', labelKey: 'nav.replicasets', icon: Boxes, namespaced: true, resource: 'replicasets' },
      {
        to: '/replicationcontrollers',
        labelKey: 'nav.replicationcontrollers',
        icon: Boxes,
        namespaced: true,
        resource: 'replicationcontrollers',
      },
      {
        to: '/podtemplates',
        labelKey: 'nav.podtemplates',
        icon: FileCode2,
        namespaced: true,
        resource: 'podtemplates',
      },
      { to: '/jobs', labelKey: 'nav.jobs', icon: Workflow, namespaced: true, resource: 'jobs' },
      { to: '/cronjobs', labelKey: 'nav.cronjobs', icon: CalendarClock, namespaced: true, resource: 'cronjobs' },
      {
        to: '/horizontalpodautoscalers',
        labelKey: 'nav.hpa',
        icon: Gauge,
        namespaced: true,
        resource: 'horizontalpodautoscalers',
      },
      {
        to: '/poddisruptionbudgets',
        labelKey: 'nav.pdb',
        icon: Shield,
        namespaced: true,
        resource: 'poddisruptionbudgets',
      },
    ],
  },
  {
    titleKey: 'nav.network',
    icon: Network,
    items: [
      { to: '/services', labelKey: 'nav.services', icon: Network, namespaced: true, resource: 'services' },
      {
        to: '/endpointslices',
        labelKey: 'nav.endpointslices',
        icon: Network,
        namespaced: true,
        resource: 'endpointslices',
      },
      { to: '/endpoints', labelKey: 'nav.endpoints', icon: Network, namespaced: true, resource: 'endpoints' },
      { to: '/ingresses', labelKey: 'nav.ingress', icon: Network, namespaced: true, resource: 'ingresses' },
      { to: '/ingressclasses', labelKey: 'nav.ingressclasses', icon: Layers, resource: 'ingressclasses' },
      { to: '/servicecidrs', labelKey: 'nav.servicecidrs', icon: Network, resource: 'servicecidrs' },
      { to: '/gatewayclasses', labelKey: 'nav.gatewayclasses', icon: Layers, resource: 'gatewayclasses' },
      { to: '/gateways', labelKey: 'nav.gateways', icon: Workflow, namespaced: true, resource: 'gateways' },
      { to: '/httproutes', labelKey: 'nav.httproutes', icon: Network, namespaced: true, resource: 'httproutes' },
      { to: '/networkpolicies', labelKey: 'nav.networkpolicies', icon: Shield, namespaced: true, resource: 'networkpolicies' },
    ],
  },
  {
    titleKey: 'nav.config',
    icon: Database,
    items: [
      { to: '/configmaps', labelKey: 'nav.configmaps', icon: Database, namespaced: true, resource: 'configmaps' },
      { to: '/secrets', labelKey: 'nav.secrets', icon: KeyRound, namespaced: true, resource: 'secrets' },
      { to: '/serviceaccounts', labelKey: 'nav.serviceaccounts', icon: UserRound, namespaced: true, resource: 'serviceaccounts' },
      {
        to: '/resourcequotas',
        labelKey: 'nav.resourcequotas',
        icon: Database,
        namespaced: true,
        resource: 'resourcequotas',
      },
      {
        to: '/limitranges',
        labelKey: 'nav.limitranges',
        icon: Gauge,
        namespaced: true,
        resource: 'limitranges',
      },
    ],
  },
  {
    titleKey: 'nav.storage',
    icon: HardDrive,
    items: [
      { to: '/persistentvolumes', labelKey: 'nav.pv', icon: HardDrive, resource: 'persistentvolumes' },
      {
        to: '/persistentvolumeclaims',
        labelKey: 'nav.pvc',
        icon: HardDrive,
        namespaced: true,
        resource: 'persistentvolumeclaims',
      },
      { to: '/storageclasses', labelKey: 'nav.storageclass', icon: HardDrive, resource: 'storageclasses' },
      {
        to: '/volumeattachments',
        labelKey: 'nav.volumeattachments',
        icon: HardDrive,
        resource: 'volumeattachments',
      },
      { to: '/csidrivers', labelKey: 'nav.csidrivers', icon: HardDrive, resource: 'csidrivers' },
      { to: '/csinodes', labelKey: 'nav.csinodes', icon: Server, resource: 'csinodes' },
    ],
  },
  {
    titleKey: 'nav.scheduling',
    icon: Gauge,
    items: [
      {
        to: '/priorityclasses',
        labelKey: 'nav.priorityclasses',
        icon: Gauge,
        resource: 'priorityclasses',
      },
      {
        to: '/runtimeclasses',
        labelKey: 'nav.runtimeclasses',
        icon: Settings,
        resource: 'runtimeclasses',
      },
      {
        to: '/mutatingwebhookconfigurations',
        labelKey: 'nav.mutatingwebhooks',
        icon: Shield,
        resource: 'mutatingwebhookconfigurations',
      },
      {
        to: '/validatingwebhookconfigurations',
        labelKey: 'nav.validatingwebhooks',
        icon: Shield,
        resource: 'validatingwebhookconfigurations',
      },
    ],
  },
  {
    titleKey: 'nav.access',
    icon: Shield,
    items: [
      { to: '/roles', labelKey: 'nav.roles', icon: Lock, namespaced: true, resource: 'roles' },
      { to: '/rolebindings', labelKey: 'nav.rolebindings', icon: Lock, namespaced: true, resource: 'rolebindings' },
      { to: '/clusterroles', labelKey: 'nav.clusterroles', icon: Shield, resource: 'clusterroles' },
      { to: '/clusterrolebindings', labelKey: 'nav.clusterrolebindings', icon: Shield, resource: 'clusterrolebindings' },
    ],
  },
  {
    titleKey: 'nav.observe',
    icon: Activity,
    items: [
      { to: '/monitoring', labelKey: 'nav.monitoring', icon: Activity },
      { to: '/topology', labelKey: 'nav.topology', icon: Waypoints, namespaced: true },
      { to: '/timeline', labelKey: 'nav.timeline', icon: History, namespaced: true },
      { to: '/audit', labelKey: 'nav.audit', icon: ScrollText, clusterScoped: false },
      { to: '/proxy', labelKey: 'nav.proxy', icon: Terminal },
    ],
  },
  {
    titleKey: 'nav.admin',
    icon: Settings,
    items: [
      { to: '/admin/users', labelKey: 'nav.users', icon: UserRound, clusterScoped: false },
      { to: '/admin/roles', labelKey: 'nav.adminRoles', icon: Shield, clusterScoped: false },
      { to: '/admin/settings', labelKey: 'nav.settings', icon: Settings, clusterScoped: false },
    ],
  },
]

export function navGroupsForSection(section: NavSectionId): NavGroup[] {
  return section === 'marketplace' ? marketplaceNavGroups : consoleNavGroups
}

/** Every customizable group, across sections — used by the prefs and policy editors. */
export const allNavGroups: NavGroup[] = [...marketplaceNavGroups, ...consoleNavGroups]

export function pathInGroup(pathname: string, group: NavGroup): boolean {
  return group.items.some(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
  )
}

/**
 * Longest-prefix match of a pathname to a nav item, so detail routes such as
 * `/pods/default/nginx` resolve to their list entry. `exact` items only ever
 * match themselves, keeping `/marketplace` from swallowing its children.
 */
export function findNavItem(pathname: string): NavItem | undefined {
  let best: NavItem | undefined
  for (const group of allNavGroups) {
    for (const item of group.items) {
      if (pathname === item.to) return item
      if (item.exact || !pathname.startsWith(`${item.to}/`)) continue
      if (!best || item.to.length > best.to.length) best = item
    }
  }
  return best
}

/** Which scope pickers a route needs above its content. */
export type ContextScope = { cluster: boolean; namespace: boolean }

/** Routes reachable without a sidebar entry, where the default would be wrong. */
const OFF_NAV_SCOPES: Record<string, ContextScope> = {
  '/profile': { cluster: false, namespace: false },
  '/search': { cluster: true, namespace: true },
}

/** Same, for routes carrying path params. Chart detail pre-fills its install form
 *  from the active namespace, but `/marketplace` is `exact` so it matches nothing. */
const OFF_NAV_PREFIX_SCOPES: [string, ContextScope][] = [
  ['/marketplace/chart/', { cluster: true, namespace: true }],
]

/**
 * Detail routes such as `/pods/default/nginx` resolve through `findNavItem`'s
 * prefix match, and the handful of genuinely unlisted routes are tabled above.
 * So a pathname that matches nothing is a dead link — show no scope pickers,
 * since there is no page for them to scope.
 */
export function contextScopeForPath(pathname: string): ContextScope {
  const off = OFF_NAV_SCOPES[pathname]
  if (off) return off

  const prefixed = OFF_NAV_PREFIX_SCOPES.find(([prefix]) => pathname.startsWith(prefix))
  if (prefixed) return prefixed[1]

  const item = findNavItem(pathname)
  if (!item) return { cluster: false, namespace: false }

  const cluster = item.clusterScoped !== false
  return { cluster, namespace: cluster && item.namespaced === true }
}
