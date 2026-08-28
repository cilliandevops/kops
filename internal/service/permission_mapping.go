package service

// casbinPolicy represents a Casbin policy object/action pair.
type casbinPolicy struct {
	Object string
	Action string
}

// logicalPermissionMap maps UI-facing logical permission names to Casbin policies.
var logicalPermissionMap = map[string][]casbinPolicy{
	"read:clusters":    {{Object: "/api/v1/clusters/*", Action: "GET"}},
	"write:clusters":   {{Object: "/api/v1/clusters/*", Action: "*"}},
	"read:nodes":       {{Object: "/api/v1/nodes/*", Action: "GET"}},
	"write:nodes":      {{Object: "/api/v1/nodes/*", Action: "*"}},
	"read:pods":        {{Object: "/api/v1/pods/*", Action: "GET"}, {Object: "/api/v1/namespaces/*/pods/*", Action: "GET"}},
	"write:pods":       {{Object: "/api/v1/pods/*", Action: "*"}, {Object: "/api/v1/namespaces/*/pods/*", Action: "*"}},
	"exec:pods":        {{Object: "/api/v1/namespaces/*/pods/*/exec", Action: "*"}},
	"read:deployments": {{Object: "/api/v1/deployments/*", Action: "GET"}, {Object: "/api/v1/namespaces/*/deployments/*", Action: "GET"}},
	"write:deployments": {
		{Object: "/api/v1/deployments/*", Action: "*"},
		{Object: "/api/v1/namespaces/*/deployments/*", Action: "*"},
	},
	"read:services":  {{Object: "/api/v1/services/*", Action: "GET"}, {Object: "/api/v1/namespaces/*/services/*", Action: "GET"}},
	"write:services": {{Object: "/api/v1/services/*", Action: "*"}, {Object: "/api/v1/namespaces/*/services/*", Action: "*"}},
	"read:ingress":   {{Object: "/api/v1/ingresses/*", Action: "GET"}, {Object: "/api/v1/namespaces/*/ingresses/*", Action: "GET"}},
	"write:ingress":  {{Object: "/api/v1/ingresses/*", Action: "*"}, {Object: "/api/v1/namespaces/*/ingresses/*", Action: "*"}},
	"read:gateway": {
		{Object: "/api/v1/gatewayclasses/*", Action: "GET"},
		{Object: "/api/v1/gateways/*", Action: "GET"},
		{Object: "/api/v1/namespaces/*/gateways/*", Action: "GET"},
		{Object: "/api/v1/httproutes/*", Action: "GET"},
		{Object: "/api/v1/namespaces/*/httproutes/*", Action: "GET"},
	},
	"write:gateway": {
		{Object: "/api/v1/gatewayclasses/*", Action: "*"},
		{Object: "/api/v1/gateways/*", Action: "*"},
		{Object: "/api/v1/namespaces/*/gateways/*", Action: "*"},
		{Object: "/api/v1/httproutes/*", Action: "*"},
		{Object: "/api/v1/namespaces/*/httproutes/*", Action: "*"},
	},
	"read:configmaps": {
		{Object: "/api/v1/configmaps/*", Action: "GET"},
		{Object: "/api/v1/namespaces/*/configmaps/*", Action: "GET"},
	},
	"write:configmaps": {
		{Object: "/api/v1/configmaps/*", Action: "*"},
		{Object: "/api/v1/namespaces/*/configmaps/*", Action: "*"},
	},
	"read:secrets": {
		{Object: "/api/v1/secrets/*", Action: "GET"},
		{Object: "/api/v1/namespaces/*/secrets/*", Action: "GET"},
	},
	"write:secrets": {
		{Object: "/api/v1/secrets/*", Action: "*"},
		{Object: "/api/v1/namespaces/*/secrets/*", Action: "*"},
	},
	"read:pv": {
		{Object: "/api/v1/persistentvolumes/*", Action: "GET"},
		{Object: "/api/v1/persistentvolumeclaims/*", Action: "GET"},
		{Object: "/api/v1/namespaces/*/persistentvolumeclaims/*", Action: "GET"},
	},
	"write:pv": {
		{Object: "/api/v1/persistentvolumes/*", Action: "*"},
		{Object: "/api/v1/persistentvolumeclaims/*", Action: "*"},
		{Object: "/api/v1/namespaces/*/persistentvolumeclaims/*", Action: "*"},
	},
	"read:storageclasses":  {{Object: "/api/v1/storageclasses/*", Action: "GET"}},
	"write:storageclasses": {{Object: "/api/v1/storageclasses/*", Action: "*"}},
	"read:rbac": {
		{Object: "/api/v1/serviceaccounts/*", Action: "GET"},
		{Object: "/api/v1/namespaces/*/serviceaccounts/*", Action: "GET"},
		{Object: "/api/v1/roles/*", Action: "GET"},
		{Object: "/api/v1/namespaces/*/roles/*", Action: "GET"},
		{Object: "/api/v1/rolebindings/*", Action: "GET"},
		{Object: "/api/v1/namespaces/*/rolebindings/*", Action: "GET"},
		{Object: "/api/v1/clusterroles/*", Action: "GET"},
		{Object: "/api/v1/clusterrolebindings/*", Action: "GET"},
	},
	"write:rbac": {
		{Object: "/api/v1/serviceaccounts/*", Action: "*"},
		{Object: "/api/v1/namespaces/*/serviceaccounts/*", Action: "*"},
		{Object: "/api/v1/roles/*", Action: "*"},
		{Object: "/api/v1/namespaces/*/roles/*", Action: "*"},
		{Object: "/api/v1/rolebindings/*", Action: "*"},
		{Object: "/api/v1/namespaces/*/rolebindings/*", Action: "*"},
		{Object: "/api/v1/clusterroles/*", Action: "*"},
		{Object: "/api/v1/clusterrolebindings/*", Action: "*"},
	},
	"admin:users":  {{Object: "/api/v1/users/*", Action: "*"}, {Object: "/api/v1/admin/users/*", Action: "*"}},
	"admin:roles":  {{Object: "/api/v1/roles/*", Action: "*"}, {Object: "/api/v1/admin/roles/*", Action: "*"}, {Object: "/api/v1/admin/permissions/*", Action: "*"}},
	"admin:system": {{Object: "/api/v1/settings/*", Action: "*"}},
	"admin:audit":  {{Object: "/api/v1/audit/*", Action: "GET"}},
	"read:topology": {
		{Object: "/api/v1/topology", Action: "GET"},
		{Object: "/api/v1/topology/*", Action: "GET"},
	},
	"read:timeline": {
		{Object: "/api/v1/timeline", Action: "GET"},
		{Object: "/api/v1/timeline/*", Action: "GET"},
	},
	"read:environments":  {{Object: "/api/v1/environments/*", Action: "GET"}},
	"write:environments": {{Object: "/api/v1/environments/*", Action: "*"}},
	"read:applications": {
		{Object: "/api/v1/applications", Action: "GET"},
		{Object: "/api/v1/applications/*", Action: "GET"},
	},
}

// KnownLogicalPermissions returns all logical permission names in stable order.
func KnownLogicalPermissions() []string {
	order := []string{
		"read:clusters", "write:clusters", "read:nodes", "write:nodes",
		"read:pods", "write:pods", "exec:pods",
		"read:deployments", "write:deployments",
		"read:services", "write:services", "read:ingress", "write:ingress",
		"read:gateway", "write:gateway",
		"read:configmaps", "write:configmaps", "read:secrets", "write:secrets",
		"read:pv", "write:pv",
		"read:storageclasses", "write:storageclasses",
		"read:rbac", "write:rbac",
		"admin:users", "admin:roles", "admin:system", "admin:audit",
		"read:topology", "read:timeline",
		"read:environments", "write:environments", "read:applications",
	}
	return order
}

func policiesForLogicalPermission(name string) ([]casbinPolicy, bool) {
	policies, ok := logicalPermissionMap[name]
	return policies, ok
}

// logicalPermissionsFromPolicies converts Casbin policies into logical permission names.
func logicalPermissionsFromPolicies(policies [][]string) []string {
	if hasFullAccess(policies) {
		return KnownLogicalPermissions()
	}

	matched := make(map[string]bool)
	for logical, required := range logicalPermissionMap {
		if policiesContainAll(policies, required) {
			matched[logical] = true
		}
	}

	result := make([]string, 0, len(matched))
	for _, name := range KnownLogicalPermissions() {
		if matched[name] {
			result = append(result, name)
		}
	}
	return result
}

func hasFullAccess(policies [][]string) bool {
	for _, p := range policies {
		if len(p) < 3 {
			continue
		}
		obj, act := p[1], p[2]
		if (obj == "/api/v1/*" || obj == "*") && (act == "*" || act == "ALL") {
			return true
		}
	}
	return false
}

func policiesContainAll(existing [][]string, required []casbinPolicy) bool {
	for _, req := range required {
		found := false
		for _, p := range existing {
			if len(p) < 3 {
				continue
			}
			obj, act := p[1], p[2]
			if obj == req.Object && (act == req.Action || act == "*") {
				found = true
				break
			}
			// Broad wildcard covers specific object/action
			if (obj == "/api/v1/*" || obj == "*") && (act == "*" || act == req.Action) {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	return true
}
