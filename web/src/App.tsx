import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/store/auth'
import { ClusterProvider } from '@/store/cluster'
import { NamespaceProvider } from '@/store/namespace'
import { EnvironmentProvider } from '@/store/environment'
import { lazy, Suspense, useState, type ReactNode } from 'react'
import { BootScreen, shouldShowBootScreen } from '@/components/BootScreen'

// Lazy shell — keep /login free of AppShell + framer-motion + lucide nav icons.
const AppShell = lazy(() =>
  import('@/components/AppShell').then((m) => ({ default: m.AppShell })),
)
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const OAuthCallbackPage = lazy(() =>
  import('@/pages/OAuthCallbackPage').then((m) => ({ default: m.OAuthCallbackPage })),
)
const OverviewPage = lazy(() =>
  import('@/pages/OverviewPage').then((m) => ({ default: m.OverviewPage })),
)
const FleetPage = lazy(() => import('@/pages/FleetPage').then((m) => ({ default: m.FleetPage })))
const NodesPage = lazy(() => import('@/pages/NodesPage').then((m) => ({ default: m.NodesPage })))
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)
const EventsPage = lazy(() => import('@/pages/EventsPage').then((m) => ({ default: m.EventsPage })))
const MonitoringPage = lazy(() =>
  import('@/pages/MonitoringPage').then((m) => ({ default: m.MonitoringPage })),
)
const TopologyPage = lazy(() =>
  import('@/pages/TopologyPage').then((m) => ({ default: m.TopologyPage })),
)
const TimelinePage = lazy(() =>
  import('@/pages/TimelinePage').then((m) => ({ default: m.TimelinePage })),
)
const ResourceDetailPage = lazy(() =>
  import('@/pages/ResourceDetailPage').then((m) => ({ default: m.ResourceDetailPage })),
)
const ClustersPage = lazy(() =>
  import('@/pages/ClustersPage').then((m) => ({ default: m.ClustersPage })),
)
const EnvironmentsPage = lazy(() =>
  import('@/pages/EnvironmentsPage').then((m) => ({ default: m.EnvironmentsPage })),
)
const ApplicationsPage = lazy(() =>
  import('@/pages/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage })),
)
const ApplicationDetailPage = lazy(() =>
  import('@/pages/ApplicationsPage').then((m) => ({ default: m.ApplicationDetailPage })),
)
const AdminUsersPage = lazy(() =>
  import('@/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
)
const AdminRolesPage = lazy(() =>
  import('@/pages/AdminRolesPage').then((m) => ({ default: m.AdminRolesPage })),
)
const CrdsPage = lazy(() => import('@/pages/CrdsPage').then((m) => ({ default: m.CrdsPage })))
const AuditPage = lazy(() => import('@/pages/AuditPage').then((m) => ({ default: m.AuditPage })))
const GlobalSearchPage = lazy(() =>
  import('@/pages/GlobalSearchPage').then((m) => ({ default: m.GlobalSearchPage })),
)
const MarketplacePage = lazy(() =>
  import('@/pages/MarketplacePage').then((m) => ({ default: m.MarketplacePage })),
)
const ChartDetailPage = lazy(() =>
  import('@/pages/ChartDetailPage').then((m) => ({ default: m.ChartDetailPage })),
)
const ProxyConsolePage = lazy(() =>
  import('@/pages/ProxyConsolePage').then((m) => ({ default: m.ProxyConsolePage })),
)
const AiChatPage = lazy(() => import('@/pages/AiChatPage').then((m) => ({ default: m.AiChatPage })))
const ProfilePage = lazy(() =>
  import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const AdminSettingsPage = lazy(() =>
  import('@/pages/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })),
)
const ForcePasswordChangePage = lazy(() =>
  import('@/pages/ForcePasswordChangePage').then((m) => ({ default: m.ForcePasswordChangePage })),
)

const ClusterRoleBindingsPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.ClusterRoleBindingsPage })),
)
const ClusterRolesPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.ClusterRolesPage })),
)
const ConfigMapsPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.ConfigMapsPage })),
)
const CronJobsPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.CronJobsPage })),
)
const DaemonSetsPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.DaemonSetsPage })),
)
const DeploymentsPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.DeploymentsPage })),
)
const HPAPage = lazy(() => import('@/pages/resources').then((m) => ({ default: m.HPAPage })))
const IngressPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.IngressPage })),
)
const GatewayClassesPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.GatewayClassesPage })),
)
const GatewaysPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.GatewaysPage })),
)
const HTTPRoutesPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.HTTPRoutesPage })),
)
const JobsPage = lazy(() => import('@/pages/resources').then((m) => ({ default: m.JobsPage })))
const LimitRangesPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.LimitRangesPage })),
)
const NamespacesPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.NamespacesPage })),
)
const NetworkPoliciesPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.NetworkPoliciesPage })),
)
const PDBPage = lazy(() => import('@/pages/resources').then((m) => ({ default: m.PDBPage })))
const PodsPage = lazy(() => import('@/pages/resources').then((m) => ({ default: m.PodsPage })))
const PVPage = lazy(() => import('@/pages/resources').then((m) => ({ default: m.PVPage })))
const PVCPage = lazy(() => import('@/pages/resources').then((m) => ({ default: m.PVCPage })))
const ResourceQuotasPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.ResourceQuotasPage })),
)
const RoleBindingsPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.RoleBindingsPage })),
)
const RolesPage = lazy(() => import('@/pages/resources').then((m) => ({ default: m.RolesPage })))
const SecretsPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.SecretsPage })),
)
const ServiceAccountsPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.ServiceAccountsPage })),
)
const ServicesPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.ServicesPage })),
)
const StatefulSetsPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.StatefulSetsPage })),
)
const StorageClassPage = lazy(() =>
  import('@/pages/resources').then((m) => ({ default: m.StorageClassPage })),
)

const ReplicaSetsPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.ReplicaSetsPage })),
)
const ReplicationControllersPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.ReplicationControllersPage })),
)
const PodTemplatesPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.PodTemplatesPage })),
)
const EndpointsPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.EndpointsPage })),
)
const EndpointSlicesPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.EndpointSlicesPage })),
)
const IngressClassesPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.IngressClassesPage })),
)
const ServiceCIDRsPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.ServiceCIDRsPage })),
)
const PriorityClassesPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.PriorityClassesPage })),
)
const RuntimeClassesPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.RuntimeClassesPage })),
)
const LeasesPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.LeasesPage })),
)
const MutatingWebhooksPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.MutatingWebhooksPage })),
)
const ValidatingWebhooksPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.ValidatingWebhooksPage })),
)
const VolumeAttachmentsPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.VolumeAttachmentsPage })),
)
const CSIDriversPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.CSIDriversPage })),
)
const CSINodesPage = lazy(() =>
  import('@/pages/resourcesExtra').then((m) => ({ default: m.CSINodesPage })),
)

function Detail({ resource, namespaced = true }: { resource: string; namespaced?: boolean }) {
  return <ResourceDetailPage resource={resource} namespaced={namespaced} />
}

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="hud-label tracking-[0.2em]">LOADING MODULE…</div>
    </div>
  )
}

function BootGate({ children }: { children: ReactNode }) {
  const [booting, setBooting] = useState(() => shouldShowBootScreen())
  if (booting) return <BootScreen onDone={() => setBooting(false)} />
  return children
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function Protected({ children }: { children: ReactNode }) {
  const { isAuthenticated, mustChangePassword, pendingOldPassword } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (mustChangePassword) {
    return <ForcePasswordChangePage defaultOldPassword={pendingOldPassword} />
  }
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BootGate>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/login/oauth/callback" element={<OAuthCallbackPage />} />
                <Route
                  path="/"
                  element={
                    <Protected>
                      <ClusterProvider>
                        <NamespaceProvider>
                          <EnvironmentProvider>
                            <AppShell />
                          </EnvironmentProvider>
                        </NamespaceProvider>
                      </ClusterProvider>
                    </Protected>
                  }
                >
                  <Route index element={<Navigate to="/ai" replace />} />
                  <Route path="fleet" element={<FleetPage />} />
                  <Route path="overview" element={<OverviewPage />} />
                  <Route path="topology" element={<TopologyPage />} />
                  <Route path="timeline" element={<TimelinePage />} />
                  <Route path="nodes" element={<NodesPage />} />
                  <Route path="namespaces" element={<NamespacesPage />} />
                  <Route path="events" element={<EventsPage />} />
                  <Route path="pods" element={<PodsPage />} />
                  <Route path="pods/:namespace/:name" element={<Detail resource="pods" />} />
                  <Route path="workloads" element={<Navigate to="/pods" replace />} />
                  <Route path="deployments" element={<DeploymentsPage />} />
                  <Route path="deployments/:namespace/:name" element={<Detail resource="deployments" />} />
                  <Route path="statefulsets" element={<StatefulSetsPage />} />
                  <Route
                    path="statefulsets/:namespace/:name"
                    element={<Detail resource="statefulsets" />}
                  />
                  <Route path="daemonsets" element={<DaemonSetsPage />} />
                  <Route path="daemonsets/:namespace/:name" element={<Detail resource="daemonsets" />} />
                  <Route path="jobs" element={<JobsPage />} />
                  <Route path="jobs/:namespace/:name" element={<Detail resource="jobs" />} />
                  <Route path="cronjobs" element={<CronJobsPage />} />
                  <Route path="cronjobs/:namespace/:name" element={<Detail resource="cronjobs" />} />
                  <Route path="horizontalpodautoscalers" element={<HPAPage />} />
                  <Route
                    path="horizontalpodautoscalers/:namespace/:name"
                    element={<Detail resource="horizontalpodautoscalers" />}
                  />
                  <Route path="poddisruptionbudgets" element={<PDBPage />} />
                  <Route
                    path="poddisruptionbudgets/:namespace/:name"
                    element={<Detail resource="poddisruptionbudgets" />}
                  />
                  <Route path="services" element={<ServicesPage />} />
                  <Route path="services/:namespace/:name" element={<Detail resource="services" />} />
                  <Route path="ingresses" element={<IngressPage />} />
                  <Route path="ingresses/:namespace/:name" element={<Detail resource="ingresses" />} />
                  <Route path="gatewayclasses" element={<GatewayClassesPage />} />
                  <Route
                    path="gatewayclasses/:name"
                    element={<Detail resource="gatewayclasses" namespaced={false} />}
                  />
                  <Route path="gateways" element={<GatewaysPage />} />
                  <Route path="gateways/:namespace/:name" element={<Detail resource="gateways" />} />
                  <Route path="httproutes" element={<HTTPRoutesPage />} />
                  <Route path="httproutes/:namespace/:name" element={<Detail resource="httproutes" />} />
                  <Route path="networkpolicies" element={<NetworkPoliciesPage />} />
                  <Route
                    path="networkpolicies/:namespace/:name"
                    element={<Detail resource="networkpolicies" />}
                  />
                  <Route path="configmaps" element={<ConfigMapsPage />} />
                  <Route path="configmaps/:namespace/:name" element={<Detail resource="configmaps" />} />
                  <Route path="secrets" element={<SecretsPage />} />
                  <Route path="secrets/:namespace/:name" element={<Detail resource="secrets" />} />
                  <Route path="serviceaccounts" element={<ServiceAccountsPage />} />
                  <Route
                    path="serviceaccounts/:namespace/:name"
                    element={<Detail resource="serviceaccounts" />}
                  />
                  <Route path="resourcequotas" element={<ResourceQuotasPage />} />
                  <Route
                    path="resourcequotas/:namespace/:name"
                    element={<Detail resource="resourcequotas" />}
                  />
                  <Route path="limitranges" element={<LimitRangesPage />} />
                  <Route
                    path="limitranges/:namespace/:name"
                    element={<Detail resource="limitranges" />}
                  />
                  <Route path="persistentvolumes" element={<PVPage />} />
                  <Route
                    path="persistentvolumes/:name"
                    element={<Detail resource="persistentvolumes" namespaced={false} />}
                  />
                  <Route path="persistentvolumeclaims" element={<PVCPage />} />
                  <Route
                    path="persistentvolumeclaims/:namespace/:name"
                    element={<Detail resource="persistentvolumeclaims" />}
                  />
                  <Route path="storageclasses" element={<StorageClassPage />} />
                  <Route
                    path="storageclasses/:name"
                    element={<Detail resource="storageclasses" namespaced={false} />}
                  />
                  <Route path="roles" element={<RolesPage />} />
                  <Route path="roles/:namespace/:name" element={<Detail resource="roles" />} />
                  <Route path="rolebindings" element={<RoleBindingsPage />} />
                  <Route
                    path="rolebindings/:namespace/:name"
                    element={<Detail resource="rolebindings" />}
                  />
                  <Route path="clusterroles" element={<ClusterRolesPage />} />
                  <Route
                    path="clusterroles/:name"
                    element={<Detail resource="clusterroles" namespaced={false} />}
                  />
                  <Route path="clusterrolebindings" element={<ClusterRoleBindingsPage />} />
                  <Route
                    path="clusterrolebindings/:name"
                    element={<Detail resource="clusterrolebindings" namespaced={false} />}
                  />
                  <Route path="nodes/:name" element={<Detail resource="nodes" namespaced={false} />} />
                  <Route path="namespaces/:name" element={<Detail resource="namespaces" namespaced={false} />} />
                  <Route path="replicasets" element={<ReplicaSetsPage />} />
                  <Route path="replicasets/:namespace/:name" element={<Detail resource="replicasets" />} />
                  <Route path="replicationcontrollers" element={<ReplicationControllersPage />} />
                  <Route
                    path="replicationcontrollers/:namespace/:name"
                    element={<Detail resource="replicationcontrollers" />}
                  />
                  <Route path="podtemplates" element={<PodTemplatesPage />} />
                  <Route
                    path="podtemplates/:namespace/:name"
                    element={<Detail resource="podtemplates" />}
                  />
                  <Route path="endpoints" element={<EndpointsPage />} />
                  <Route path="endpoints/:namespace/:name" element={<Detail resource="endpoints" />} />
                  <Route path="endpointslices" element={<EndpointSlicesPage />} />
                  <Route
                    path="endpointslices/:namespace/:name"
                    element={<Detail resource="endpointslices" />}
                  />
                  <Route path="leases" element={<LeasesPage />} />
                  <Route path="leases/:namespace/:name" element={<Detail resource="leases" />} />
                  <Route path="ingressclasses" element={<IngressClassesPage />} />
                  <Route
                    path="ingressclasses/:name"
                    element={<Detail resource="ingressclasses" namespaced={false} />}
                  />
                  <Route path="servicecidrs" element={<ServiceCIDRsPage />} />
                  <Route
                    path="servicecidrs/:name"
                    element={<Detail resource="servicecidrs" namespaced={false} />}
                  />
                  <Route path="priorityclasses" element={<PriorityClassesPage />} />
                  <Route
                    path="priorityclasses/:name"
                    element={<Detail resource="priorityclasses" namespaced={false} />}
                  />
                  <Route path="runtimeclasses" element={<RuntimeClassesPage />} />
                  <Route
                    path="runtimeclasses/:name"
                    element={<Detail resource="runtimeclasses" namespaced={false} />}
                  />
                  <Route path="mutatingwebhookconfigurations" element={<MutatingWebhooksPage />} />
                  <Route
                    path="mutatingwebhookconfigurations/:name"
                    element={<Detail resource="mutatingwebhookconfigurations" namespaced={false} />}
                  />
                  <Route path="validatingwebhookconfigurations" element={<ValidatingWebhooksPage />} />
                  <Route
                    path="validatingwebhookconfigurations/:name"
                    element={<Detail resource="validatingwebhookconfigurations" namespaced={false} />}
                  />
                  <Route path="volumeattachments" element={<VolumeAttachmentsPage />} />
                  <Route
                    path="volumeattachments/:name"
                    element={<Detail resource="volumeattachments" namespaced={false} />}
                  />
                  <Route path="csidrivers" element={<CSIDriversPage />} />
                  <Route
                    path="csidrivers/:name"
                    element={<Detail resource="csidrivers" namespaced={false} />}
                  />
                  <Route path="csinodes" element={<CSINodesPage />} />
                  <Route
                    path="csinodes/:name"
                    element={<Detail resource="csinodes" namespaced={false} />}
                  />
                  <Route path="monitoring" element={<MonitoringPage />} />
                  <Route path="clusters" element={<ClustersPage />} />
                  <Route path="environments" element={<EnvironmentsPage />} />
                  <Route path="applications" element={<ApplicationsPage />} />
                  <Route path="applications/:namespace/:name" element={<ApplicationDetailPage />} />
                  <Route path="admin/users" element={<AdminUsersPage />} />
                  <Route path="admin/roles" element={<AdminRolesPage />} />
                  <Route path="admin/settings" element={<AdminSettingsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="crds" element={<CrdsPage />} />
                  <Route path="audit" element={<AuditPage />} />
                  <Route path="search" element={<GlobalSearchPage />} />
                  <Route path="marketplace" element={<MarketplacePage />} />
                  <Route path="marketplace/installed" element={<MarketplacePage />} />
                  <Route path="marketplace/repos" element={<MarketplacePage />} />
                  <Route path="marketplace/chart/:repo/:chart" element={<ChartDetailPage />} />
                  {/* Helm moved into the marketplace's Installed tab. */}
                  <Route path="helm" element={<Navigate to="/marketplace/installed" replace />} />
                  <Route path="proxy" element={<ProxyConsolePage />} />
                  <Route path="ai" element={<AiChatPage />} />
                  {/* Inside the shell so a dead link keeps its nav instead of vanishing. */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </BootGate>
      </AuthProvider>
    </QueryClientProvider>
  )
}
