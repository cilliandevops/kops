package service

import (
	"testing"

	"github.com/ciliverse/cilikube/internal/store"
)

func TestAccessDecisionUnrestricted(t *testing.T) {
	d := AccessDecision{Unrestricted: true}
	if !d.AllowsCluster("c1") || !d.AllowsNamespace("c1", "default") {
		t.Fatal("unrestricted should allow all")
	}
}

func TestAccessDecisionScoped(t *testing.T) {
	d := AccessDecision{
		Grants: []store.AccessGrant{
			{ClusterID: "c1", Namespace: "app"},
			{ClusterID: "c2", Namespace: ""},
		},
	}
	if !d.AllowsCluster("c1") || !d.AllowsCluster("c2") {
		t.Fatal("should allow granted clusters")
	}
	if d.AllowsCluster("c3") {
		t.Fatal("should deny unknown cluster")
	}
	if !d.AllowsNamespace("c1", "app") || d.AllowsNamespace("c1", "kube-system") {
		t.Fatal("c1 should be app-only")
	}
	if !d.AllowsNamespace("c2", "kube-system") {
		t.Fatal("empty ns grant is cluster-wide")
	}
	got := d.FilterNamespaces("c1", []string{"app", "kube-system", "default"})
	if len(got) != 1 || got[0] != "app" {
		t.Fatalf("filter: %#v", got)
	}
}
