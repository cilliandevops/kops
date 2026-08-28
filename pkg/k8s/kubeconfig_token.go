package k8s

import (
	"encoding/base64"
	"fmt"
	"strings"

	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

// TokenClusterInput is the minimum needed to synthesize a kubeconfig.
type TokenClusterInput struct {
	Name     string
	Server   string
	Token    string
	CAData   string // optional raw or base64 PEM
	Insecure bool
}

// BuildKubeconfigFromToken writes a single-context kubeconfig (server + bearer token).
func BuildKubeconfigFromToken(in TokenClusterInput) ([]byte, error) {
	server := strings.TrimSpace(in.Server)
	token := strings.TrimSpace(in.Token)
	if server == "" {
		return nil, fmt.Errorf("server URL is required")
	}
	if token == "" {
		return nil, fmt.Errorf("bearer token is required")
	}
	name := strings.TrimSpace(in.Name)
	if name == "" {
		name = "cluster"
	}
	cluster := &clientcmdapi.Cluster{
		Server:                server,
		InsecureSkipTLSVerify: in.Insecure,
	}
	if ca := strings.TrimSpace(in.CAData); ca != "" && !in.Insecure {
		if decoded, err := base64.StdEncoding.DecodeString(ca); err == nil && len(decoded) > 0 && decoded[0] == '-' {
			cluster.CertificateAuthorityData = decoded
		} else {
			cluster.CertificateAuthorityData = []byte(ca)
		}
	}
	cfg := clientcmdapi.NewConfig()
	cfg.Clusters[name] = cluster
	cfg.AuthInfos[name] = &clientcmdapi.AuthInfo{Token: token}
	cfg.Contexts[name] = &clientcmdapi.Context{Cluster: name, AuthInfo: name}
	cfg.CurrentContext = name
	return clientcmd.Write(*cfg)
}
