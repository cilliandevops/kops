package k8s

import (
	"testing"

	"k8s.io/client-go/tools/clientcmd"
)

func TestBuildKubeconfigFromToken(t *testing.T) {
	raw, err := BuildKubeconfigFromToken(TokenClusterInput{
		Name:     "lab",
		Server:   "https://127.0.0.1:6443",
		Token:    "sha256.example",
		Insecure: true,
	})
	if err != nil {
		t.Fatalf("build: %v", err)
	}
	cfg, err := clientcmd.RESTConfigFromKubeConfig(raw)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if cfg.Host != "https://127.0.0.1:6443" {
		t.Fatalf("host %q", cfg.Host)
	}
	if cfg.BearerToken != "sha256.example" {
		t.Fatalf("token %q", cfg.BearerToken)
	}
	if !cfg.TLSClientConfig.Insecure {
		t.Fatal("expected insecure skip TLS")
	}
}

func TestBuildKubeconfigFromTokenRequiresFields(t *testing.T) {
	if _, err := BuildKubeconfigFromToken(TokenClusterInput{Server: "https://x", Token: ""}); err == nil {
		t.Fatal("expected error for empty token")
	}
	if _, err := BuildKubeconfigFromToken(TokenClusterInput{Server: "", Token: "t"}); err == nil {
		t.Fatal("expected error for empty server")
	}
}
