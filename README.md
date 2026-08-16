<div align="center">
  <img alt="CiliKube Logo" width="200" height="200" src="docs/logo.png">
  <h1>CiliKube</h1>
  <span>English | <a href="./README.zh-CN.md">中文</a></span>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Release-v1.0.1-green?style=flat-square" alt="Release v1.0.1">
  <img src="https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat-square&logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/Frontend-TypeScript%207-blue?style=flat-square&logo=typescript" alt="TypeScript 7">
  <img src="https://img.shields.io/badge/Frontend-Vite%208-blue?style=flat-square&logo=vite" alt="Vite 8">
  <img src="https://img.shields.io/badge/Frontend-Tailwind%204-38BDF8?style=flat-square&logo=tailwindcss" alt="Tailwind 4">
  <img src="https://img.shields.io/badge/Backend-Go%201.26+-blue?style=flat-square&logo=go" alt="Go 1.26+">
  <img src="https://img.shields.io/badge/Backend-Gin-blue?style=flat-square&logo=gin" alt="Gin">
  <img src="https://img.shields.io/badge/Kubernetes-1.36.2-blue?style=flat-square&logo=kubernetes" alt="Kubernetes 1.36.2">
  <img src="https://img.shields.io/badge/License-AGPL--3.0-red?style=flat-square" alt="License: AGPL-3.0">
  <img src="https://img.shields.io/github/stars/ciliverse/cilikube?style=social" alt="GitHub Stars">
  <img src="https://img.shields.io/github/forks/ciliverse/cilikube?style=social" alt="GitHub Forks">
</div>

## 🌟 Project Support

We appreciate your interest in CiliKube. If you find this project valuable for your Kubernetes management needs, please consider starring the repository ⭐. Community support drives continuous development and improvement.

Stay updated with the latest releases and technical insights by following our WeChat Official Account **希里安**.

## 🤝 Contributors

<a href="https://github.com/ciliverse/cilikube/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ciliverse/cilikube" />
</a>

We extend our gratitude to all contributors who have helped improve CiliKube through code contributions, bug reports, and feature suggestions.

## 🏢 Sponsorship

This project's CDN acceleration and security protection services are generously sponsored by Tencent EdgeOne.

<a href="https://edgeone.ai/zh?from=github">
  <img src="https://edgeone.ai/media/34fe3a45-492d-4ea4-ae5d-ea1087ca7b4b.png" alt="EdgeOne" width="350" height="50">
</a>

## 📖 Overview

CiliKube is an open-source Kubernetes multi-cluster management platform built with React, TypeScript, Go, and Gin.  
**From v1.0, login lands on the AI workspace first; the resource console is still there — just no longer the only door.**

In one line:

**AI is the navigator / read-only investigator; the console remains the source of truth.**

Ask “how is it now / what’s broken,” follow resource clues into detail, logs, or a terminal — AI stays read-only by default and does not mutate the cluster for you.

### v1.0.1 (current)

- **Topology** (Observe): Ingress → Service → Workload → Pod graph, Traffic mode with RPS flow (incl. fan-out to pods)
- **Timeline** (Observe): status segments + live Event markers; Showcase backfills demo history
- Nav UX: collapsible sidebar groups; reliable detail Back / browser history with Logs console
- Showcase: kube-dns ↔ coredns wiring so Topology Traffic demos cleanly

### v1.0.0

Highlights vs earlier releases:

- **AI workspace**: home after login, Skills (Featured / Inspect / Troubleshoot / Navigate + `/` menu + custom prompts), **Investigate with AI** from resources
- **Fleet overview**: multi-cluster health cards, per-card / fleet inspect
- **Resource console**: workloads / networking (incl. Gateway API) / config / storage / RBAC, logs & web terminal
- **Monitoring**: metrics-server snapshots + Prometheus series (Showcase curves on the public demo)
- **Desktop apps**: Windows / macOS / Linux with embedded backend reading local kubeconfig
- **Themes**: tron / paper / matrix / amber / nord / sakura / midnight-violet / solarized

<div align="center">
  <img src="docs/v1.0.1/01-ai-landing.png" alt="AI landing" width="100%">
  <p><strong>AI landing · Skills · Ask first then change</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/05-topology.png" alt="Topology Traffic" width="100%">
  <p><strong>Topology · Traffic mode with RPS flow (Service → Workload → Pod)</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/06-timeline.png" alt="Timeline" width="100%">
  <p><strong>Timeline · status scatter + event stream</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/04-fleet-overview.png" alt="Fleet overview" width="100%">
  <p><strong>Fleet · multi-cluster health cards</strong></p>
</div>

<details>
<summary>More screenshots (login · chat · monitoring · pods · themes)</summary>

<br>

<div align="center">
  <img src="docs/v1.0.1/00-login.png" alt="Login" width="100%">
  <p><strong>Login · Showcase one-click demo accounts</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/02-ai-skill-slash.png" alt="Skill menu" width="100%">
  <p><strong>Type <code>/</code> for Skills</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/03-ai-chat-clues.png" alt="AI chat with resource clues" width="100%">
  <p><strong>AI chat · resource clues into the console</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/07-monitoring.png" alt="Monitoring" width="100%">
  <p><strong>Monitoring · Showcase Prometheus series</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/08-pods-investigate.png" alt="Pods list" width="100%">
  <p><strong>Pods list · Investigate with AI</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/09-pod-detail.png" alt="Pod detail" width="100%">
  <p><strong>Pod detail</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/10-themes-overview-collage.png" alt="Eight themes" width="100%">
  <p><strong>Eight themes</strong></p>
</div>

</details>

## ✨ Key Differentiators

1. **Triage first, deep dive second**: land on AI after login; console in the top bar; resource pages and fleet cards can throw context back to the investigator
2. **See the path, then the history**: Topology (Traffic) for Service → Workload → Pod flow; Timeline for status segments and event markers
3. **Clear read-only boundary**: default agent is the cluster investigator; writes, approvals, and backups still go through the console and your existing process
4. **Browser + desktop**: same UI; desktop reads local kubeconfig without standing up a web stack first

## 🎯 Target Audience

- **Cloud-native / DevOps**: lightweight, customizable multi-cluster UI with ask-first workflows
- **Frontend developers**: hands-on **React + TypeScript + Tailwind**
- **Backend developers**: **Go + Gin** and **client-go** integration
- **Learners**: understand Kubernetes resource models and troubleshooting paths by using them

## 💡 Project Genesis

CiliKube started as a full-stack learning project that grew into a product you can actually open.  
v1.0 adds an entry that matches how people troubleshoot — ask first, then change.

## 🌐 Online Demo

- Demo: https://cilikube.cillian.website  
  (Public demo is a Showcase **fake fleet**; login can fill demo accounts in one click — not a production ops console)

## 📚 Documentation

- Demo / product site: [cilikube.cillian.website](https://cilikube.cillian.website)
- Intro post: [CiliKube 1.0.0](https://www.cillian.website/en/post/20260730/)

## 🚀 Technology Stack

**System Requirements**:
- Node.js >= 20.0.0 (developed and tested with v24.14.1)
- Go >= 1.26.0 (developed and tested with v1.26.4)
- PNPM >= 10.x
- Kubernetes / kubectl 1.36.2 (client-go aligned)

**Frontend Architecture**:
- **Core**: `React 19` `TypeScript 7` `Vite 8` `Tailwind CSS 4`
- **Data / Routing**: `TanStack Query` `React Router`
- **Motion / Charts**: `Framer Motion` `Recharts`
- **HTTP Client**: `Axios`
- The previous Vue UI remains in [cilikube-web](https://github.com/ciliverse/cilikube-web)

**Backend Architecture**:
- **Framework**: `Go` `Gin`
- **Kubernetes Integration**: `client-go`
- **Authentication**: `JWT`
- **Real-time Communication**: `Gorilla WebSocket`
- **Configuration**: `Viper`
- **Logging**: `Zap Logger`
- **AI**: mock / OpenAI-compatible SSE (read-only tool calls)

## ✨ Current Features

- **AI workspace**: home after login, SSE chat, read-only tools, Skills (`/` + custom), Investigate-with-AI, session history, jump into console
- **Fleet overview**: multi-cluster health cards, env tags, per-card / fleet AI inspect
- **Auth & RBAC**: JWT login, optional GitHub OAuth, Casbin roles; user / role / settings admin; security audit log
- **Multi-cluster**: import and switch clusters, local kubeconfig context import
- **Overview & search**: global resource search, Events stream
- **Cluster resources**:
  - Nodes / Namespaces / CRDs
  - Workloads: Pods (logs / web terminal), Deployments, StatefulSets, DaemonSets, Jobs, CronJobs, HPA, PDB
  - Network: Services, Ingress, GatewayClasses, Gateways, HTTPRoutes, NetworkPolicies
  - Config: ConfigMaps, Secrets, ServiceAccounts, ResourceQuotas, LimitRanges
  - Storage: PV / PVC / StorageClass
  - Access: Roles, RoleBindings, ClusterRoles, ClusterRoleBindings
- **Observe & ops**: Monitoring (Prometheus), Helm releases, API Proxy, resource YAML view / edit
- **Themes / Chinese UI**

## 🖥️ Desktop (Windows / macOS / Linux)

Double-click app: Electron shell + embedded Go API, using your local kubeconfig (`~/.kube/config` or `%USERPROFILE%\.kube\config`).

Latest: **[v1.0.0-desktop.1](https://github.com/ciliverse/cilikube/releases/tag/v1.0.0-desktop.1)**

| Platform | Asset |
| --- | --- |
| Windows x64 | [setup](https://github.com/ciliverse/cilikube/releases/download/v1.0.0-desktop.1/CiliKube-1.0.0-win-x64-setup.exe) / [portable](https://github.com/ciliverse/cilikube/releases/download/v1.0.0-desktop.1/CiliKube-1.0.0-win-x64-portable.exe) |
| macOS Apple Silicon | [DMG](https://github.com/ciliverse/cilikube/releases/download/v1.0.0-desktop.1/CiliKube-1.0.0-mac-arm64.dmg) |
| Linux x64 | [AppImage](https://github.com/ciliverse/cilikube/releases/download/v1.0.0-desktop.1/CiliKube-1.0.0-linux-x86_64.AppImage) |

- **First login**: `admin` / `12345678` (forced password change on first login)
- **Notes**: builds are unsigned (Windows SmartScreen / macOS Gatekeeper may warn). Intel Mac DMG not yet published.
- **Build**: push a desktop tag (CI builds all three platforms; SQLite needs CGO on each runner):

```bash
git tag v1.0.0-desktop.1
git push origin v1.0.0-desktop.1
```

## 💻 Local Development

### Environment Preparation
1. Install [Node.js](https://nodejs.org/) (>=20) and [pnpm](https://pnpm.io/) (>=10)
2. Install [Go](https://go.dev/) (>=1.26)
3. Have a Kubernetes cluster and configure the kubeconfig file (defaults to reading `~/.kube/config`)

### Running the Frontend
```bash
# Navigate to the frontend directory (monorepo path: web/)
cd web
# Install dependencies
pnpm install
# Start the development server
pnpm dev
```

Visit http://localhost:8888 to see the frontend interface.

### Running the Backend
```bash
# From the repository root
# (Optional) Update Go dependencies
go mod tidy
# Run the backend service (listens on port 8080 by default)
# Configuration files are modified in configs/config.yaml
go run cmd/server/main.go
```

### Building the Project
```bash
# Build frontend production package (output to web/dist)
cd web
pnpm build

# Build backend executable
cd ..
go build -o bin/cilikube cmd/server/main.go
```

## 🐳 Docker Deployment

### Using Official Images
```bash
# Backend
docker run -d --name cilikube -p 8080:8080 -v ~/.kube:/root/.kube:ro ghcr.io/ciliverse/cilikube:v1.0.1

# Frontend
docker run -d --name cilikube-web -p 80:80 ghcr.io/ciliverse/cilikube-web:v1.0.1
```

### Using Docker Compose
```bash
docker-compose up -d
```

Visit http://localhost to access the interface.

## ☸️ Kubernetes Deployment (Helm)

### Environment Preparation
- Install Helm (>=3.0)
- Have a Kubernetes cluster and configure the kubeconfig file
- Install kubectl (>=1.36.2)

### Deployment Steps
```bash
# Add Helm repository
helm repo add ciliverse https://charts.cillian.website

# Update Helm repository
helm repo update

# Install CiliKube
helm install cilikube ciliverse/cilikube -n cilikube --create-namespace

# Check service status
kubectl get svc cilikube -n cilikube
```

## 🎨 Previous UI (Vue)

<details>
<summary>Click to view historical Vue screenshots</summary>

<table>
  <tr>
    <td width="50%">
      <img src="docs/login.png" alt="Login" width="100%">
      <p align="center"><strong>Login Interface</strong></p>
    </td>
    <td width="50%">
      <img src="docs/dashboard.png" alt="Dashboard" width="100%">
      <p align="center"><strong>Dashboard Overview</strong></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/cilikube12.png" alt="Navigation" width="100%">
      <p align="center"><strong>Navigation Menu</strong></p>
    </td>
    <td width="50%">
      <img src="docs/cluster.png" alt="Cluster" width="100%">
      <p align="center"><strong>Cluster Management</strong></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/pod.png" alt="Pods" width="100%">
      <p align="center"><strong>Pod Management</strong></p>
    </td>
    <td width="50%">
      <img src="docs/shell.png" alt="Shell" width="100%">
      <p align="center"><strong>Web Terminal</strong></p>
    </td>
  </tr>
</table>

</details>

## 🤝 Contribution Guide

We welcome contributions of all forms! If you'd like to help improve CiliKube, please:

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`) - Please follow the Git Commit Guidelines
4. Push your branch to your fork (`git push origin feature/AmazingFeature`)
5. Submit a Pull Request

### Git Commit Guidelines

Please follow the Conventional Commits specification:

- `feat`: Add new features
- `fix`: Fix issues/bugs
- `perf`: Optimize performance
- `style`: Change the code style without affecting the running result
- `refactor`: Refactor code
- `revert`: Revert changes
- `test`: Test related, does not involve changes to business code
- `docs`: Documentation and Annotation
- `chore`: Updating dependencies/modifying scaffolding configuration, etc.
- `workflow`: Workflow Improvements
- `ci`: CICD related changes
- `types`: Type definition changes
- `wip`: Work in progress (should generally not be merged)

## 📞 Contact

- Email: cilliantech@gmail.com
- Website: https://www.cillian.website
- WeChat: 希里安

<img src="docs/wechat400x400.png" width="100" height="100" />

## 📜 License

This project is licensed under the GNU Affero General Public License v3.0.

[![License](https://img.shields.io/badge/License-AGPL--3.0-red.svg)](./LICENSE)
