<div align="center">
  <img alt="CiliKube Logo" width="150" height="150" src="docs/logo.png">
  <h1>CiliKube</h1>
  <span><a href="./README.md">English</a> | 中文</span>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Release-v1.5.0-green?style=flat-square" alt="Release v1.5.0">
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

## 🌟 项目支持

感谢您对 CiliKube 的关注。如果您认为本项目对您的 Kubernetes 管理工作具有价值，请考虑为仓库点亮星标 ⭐。社区支持是推动项目持续发展和改进的重要动力。

关注微信公众号**希里安**，获取最新版本发布信息和技术洞察。

## 🤝 贡献者

<a href="https://github.com/ciliverse/cilikube/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ciliverse/cilikube" />
</a>

我们向所有通过代码贡献、问题报告和功能建议帮助改进 CiliKube 的贡献者表示诚挚的谢意。

## 🏢 赞助支持

本项目的 CDN 加速和安全防护服务由腾讯 EdgeOne 慷慨赞助。

<a href="https://edgeone.ai/zh?from=github">
  <img src="https://edgeone.ai/media/34fe3a45-492d-4ea4-ae5d-ea1087ca7b4b.png" alt="EdgeOne" width="350" height="50">
</a>

## 📖 产品概述

CiliKube 是开源的 Kubernetes 多集群管理平台，技术栈为 React + TypeScript + Go / Gin。  
**v1.0 起，登录后先进 AI 工作台；资源控制台仍在，但不再是唯一入口。**

定位一句话：

**AI 是领航员 / 只读调查员，控制台仍是真相源。**

问清楚「现在怎么样、哪儿挂了」，再顺着线索进详情、日志或终端动手；AI 默认只读查证，不替你在集群里乱改。

### v1.5.0（当前）

- **资源覆盖**：新增 15 种资源 —— ReplicaSet、ReplicationController、PodTemplate、Endpoints、EndpointSlice、IngressClass、ServiceCIDR、PriorityClass、RuntimeClass、Lease、Mutating/ValidatingWebhook、VolumeAttachment、CSIDriver、CSINode
- **节点运维**：cordon / uncordon / drain（含驱逐进度）、污点与标签编辑
- **环境 / 应用**：应用分组视图与访问范围管理
- **UI 重构**：默认主题改为中性灰白，排版与间距重做、表格更紧凑；八套配色主题仍可选
- **登录页**：重新设计的网格 / 粒子光场，会跟随页面布局避让
- 字体精简为浏览器默认 + Maple Mono（选 `Maple Mono CN` 时全站统一一种字形）
- 许可证变更为 AGPL-3.0-only

### v1.0.1

- **拓扑图**（Observe）：Ingress → Service → 工作负载 → Pod，Traffic 模式 RPS 流动（含分摊到 Pod）
- **时间线**（Observe）：状态色带 + 实时 Event 标记；Showcase 预置演示历史
- 导航：侧栏分组可折叠；详情页 Back / 浏览器返回与 Logs 控制台历史更合理
- Showcase：kube-dns ↔ coredns 连线，拓扑 Traffic 演示更完整

### v1.0.0

相对此前版本的主要变化：

- **AI 工作台**：登录首页、Skill（精选 / 巡检 / 排障 / 导航 + `/` 菜单 + 自定义 Prompt）、资源页「用 AI 调查」
- **集群总览**：多集群健康卡片、单卡 / 舰队巡检
- **资源控制台**：工作负载 / 网络（含 Gateway API）/ 配置 / 存储 / RBAC、日志与 Web 终端
- **Monitoring**：metrics-server 快照 + Prometheus 时序（Demo 为 Showcase 曲线）
- **桌面客户端**：Windows / macOS / Linux，内嵌后端读本机 kubeconfig
- **多主题**：tron / paper / matrix / amber / nord / sakura / midnight-violet / solarized

<div align="center">
  <img src="docs/v1.0.1/01-ai-landing.png" alt="AI 落地页" width="100%">
  <p><strong>AI 落地页 · Skills · 先问诊再动手</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/05-topology.png" alt="拓扑 Traffic" width="100%">
  <p><strong>拓扑图 · Traffic 模式 RPS 流动（Service → 工作负载 → Pod）</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/06-timeline.png" alt="时间线" width="100%">
  <p><strong>时间线 · 状态散点 + 事件流</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/04-fleet-overview.png" alt="集群总览" width="100%">
  <p><strong>集群总览 · 多集群健康卡片</strong></p>
</div>

<details>
<summary>更多界面（登录 · 对话 · Monitoring · Pods · 主题）</summary>

<br>

<div align="center">
  <img src="docs/v1.0.1/00-login.png" alt="登录页" width="100%">
  <p><strong>登录页 · Showcase 一键演示账号</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/02-ai-skill-slash.png" alt="Skill 菜单" width="100%">
  <p><strong>输入 <code>/</code> 弹出 Skill</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/03-ai-chat-clues.png" alt="AI 对话与资源线索" width="100%">
  <p><strong>AI 对话 · 资源线索进控制台</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/07-monitoring.png" alt="Monitoring" width="100%">
  <p><strong>Monitoring · Showcase Prometheus 时序</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/08-pods-investigate.png" alt="Pods 列表" width="100%">
  <p><strong>Pods 列表 ·「用 AI 调查」</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/09-pod-detail.png" alt="Pod 详情" width="100%">
  <p><strong>Pod 详情</strong></p>
</div>

<div align="center">
  <img src="docs/v1.0.1/10-themes-overview-collage.png" alt="八套主题" width="100%">
  <p><strong>八套主题概览</strong></p>
</div>

</details>

## ✨ 核心优势

1. **先问诊，再深潜**: 登录先进 AI，控制台在顶栏；资源页与舰队卡都能把上下文扔回调查员
2. **先看路径，再看历史**: Topology（Traffic）看 Service → 工作负载 → Pod 流量；Timeline 看状态色带与事件
3. **只读边界清晰**: 默认 Agent 是集群调查员；写操作、审批、备份仍走控制台与既有流程
4. **浏览器 + 桌面**: 同一套界面；桌面双击连本机 kubeconfig，不必先搭 Web

## 🎯 目标用户

- **云原生 / DevOps**: 需要轻量、可定制的多集群界面，并愿意先问诊再动手
- **前端开发者**: 寻求 **React + TypeScript + Tailwind** 实践经验
- **后端开发者**: 学习 **Go + Gin** 与 **client-go** 集成
- **学习者**: 边用边理解 Kubernetes 资源模型与排障路径

## 💡 项目起源

CiliKube 源于全栈学习与云原生实践：把想法做成能点开的产品。  
v1.0 在资源控制台之上，补了一层更接近真实排障顺序的入口——先问清楚，再动手改。

## 🌐 在线预览

- 在线演示: https://cilikube.cillian.website  
  （公网 Demo 为 Showcase **模拟舰队**，登录页可一键填演示账号；勿当生产运维台）

## 📚 文档

- 演示 / 产品站: [cilikube.cillian.website](https://cilikube.cillian.website)
- 介绍文: [CiliKube 1.0.0 博客](https://www.cillian.website/post/20260730/)

## 🚀 技术架构

**系统要求**:
- Node.js >= 20.0.0 (开发和测试版本 v24.14.1)
- Go >= 1.26.0 (开发和测试版本 v1.26.4)
- PNPM >= 10.x
- Kubernetes / kubectl 1.36.2（与 client-go 对齐）

**前端架构**:
- **核心技术**: `React 19` `TypeScript 7` `Vite 8` `Tailwind CSS 4`
- **数据 / 路由**: `TanStack Query` `React Router`
- **动效 / 图表**: `Framer Motion` `Recharts`
- **HTTP 客户端**: `Axios`
- 原 Vue 前端仍保留在独立仓库 [cilikube-web](https://github.com/ciliverse/cilikube-web)

**后端架构**:
- **框架**: `Go` `Gin`
- **Kubernetes 集成**: `client-go`
- **身份认证**: `JWT`
- **实时通信**: `Gorilla WebSocket`
- **配置管理**: `Viper`
- **日志系统**: `Zap Logger`
- **AI**: mock / OpenAI 兼容 SSE（只读工具调用）

## ✨ 现有功能

- **AI 工作台**: 登录首页、SSE 对话、只读工具、Skill（含 `/` 与自定义）、资源页「用 AI 调查」、会话历史、一键进控制台
- **集群总览**: 多集群健康卡片、环境标签、单卡 AI 巡检 / 舰队巡检
- **认证与权限**: JWT 登录、GitHub OAuth（可选）、Casbin RBAC；用户 / 角色 / 系统设置；安全审计
- **多集群**: 集群导入与切换、本地 kubeconfig 上下文导入
- **概览与检索**: 全局资源搜索、Events 事件流
- **集群资源**:
  - Nodes / Namespaces / CRDs
  - Workloads：Pods（日志 / Web 终端）、Deployments、StatefulSets、DaemonSets、Jobs、CronJobs、HPA、PDB
  - Network：Services、Ingress、GatewayClasses、Gateways、HTTPRoutes、NetworkPolicies
  - Config：ConfigMaps、Secrets、ServiceAccounts、ResourceQuotas、LimitRanges
  - Storage：PV / PVC / StorageClass
  - Access：Roles、RoleBindings、ClusterRoles、ClusterRoleBindings
- **可观测与运维**: Monitoring（Prometheus）、Helm Release、API Proxy、资源 YAML 查看 / 编辑
- **多主题 / 中文界面**

## 🖥️ 桌面版（Windows / macOS / Linux）

双击即用：Electron 壳 + 内嵌 Go 后端，自动读取本机 kubeconfig（`~/.kube/config` 或 `%USERPROFILE%\.kube\config`）。

最新版：**[v1.0.0-desktop.1](https://github.com/ciliverse/cilikube/releases/tag/v1.0.0-desktop.1)**

| 平台 | 下载 |
| --- | --- |
| Windows x64 | [安装包](https://github.com/ciliverse/cilikube/releases/download/v1.0.0-desktop.1/CiliKube-1.0.0-win-x64-setup.exe) / [便携版](https://github.com/ciliverse/cilikube/releases/download/v1.0.0-desktop.1/CiliKube-1.0.0-win-x64-portable.exe) |
| macOS Apple Silicon | [DMG](https://github.com/ciliverse/cilikube/releases/download/v1.0.0-desktop.1/CiliKube-1.0.0-mac-arm64.dmg) |
| Linux x64 | [AppImage](https://github.com/ciliverse/cilikube/releases/download/v1.0.0-desktop.1/CiliKube-1.0.0-linux-x86_64.AppImage) |

- **首次登录**：`admin` / `12345678`（首次登录会强制改密）
- **说明**：当前未代码签名（Windows SmartScreen / macOS 可能提示拦截）。Intel Mac DMG 暂未发布。
- **自己打包**：推送带 `desktop` 的 tag，CI 会同时打三端（各 runner 上需 CGO 编 SQLite）：

```bash
git tag v1.0.0-desktop.1
git push origin v1.0.0-desktop.1
```

## 💻 本地开发

### 环境准备
1. 安装 [Node.js](https://nodejs.org/) (>=20) 和 [pnpm](https://pnpm.io/) (>=10)
2. 安装 [Go](https://go.dev/) (>=1.26)
3. 拥有一个 Kubernetes 集群，并配置好 kubeconfig 文件 (默认读取 `~/.kube/config`)

### 运行前端
```bash
# 进入前端目录（本仓库 monorepo 下的 web/）
cd web
# 安装依赖
pnpm install
# 启动开发服务器
pnpm dev
```

访问 http://localhost:8888 即可看到前端界面。

### 运行后端
```bash
# 在仓库根目录
# (可选) 更新 Go 依赖
go mod tidy
# 运行后端服务 (默认监听 8080 端口)
# 配置文件在 configs/config.yaml 中修改
go run cmd/server/main.go
```

### 构建项目
```bash
# 构建前端生产环境包 (输出到 web/dist)
cd web
pnpm build

# 构建后端可执行文件
cd ..
go build -o bin/cilikube cmd/server/main.go
```

## 🐳 Docker 部署

### 使用官方镜像
```bash
# 后端
docker run -d --name cilikube -p 8080:8080 -v ~/.kube:/root/.kube:ro ghcr.io/ciliverse/cilikube:v1.5.0

# 前端
docker run -d --name cilikube-web -p 80:80 ghcr.io/ciliverse/cilikube-web:v1.5.0
```

### 使用 Docker Compose
```bash
docker-compose up -d
```

访问 http://localhost 即可。

## ☸️ Kubernetes 部署 (Helm)

### 环境准备
- 安装 Helm (>=3.0)
- 拥有一个 Kubernetes 集群，并配置好 kubeconfig 文件
- 安装 kubectl (>=1.36.2)

### 部署步骤
```bash
# 添加 Helm 仓库
helm repo add ciliverse https://charts.cillian.website

# 更新 Helm 仓库
helm repo update

# 安装 CiliKube
helm install cilikube ciliverse/cilikube -n cilikube --create-namespace

# 查看服务状态
kubectl get svc cilikube -n cilikube
```

## 🎨 历史界面（Vue）

<details>
<summary>点击查看历史 Vue 截图</summary>

<table>
  <tr>
    <td width="50%">
      <img src="docs/login.png" alt="登录界面" width="100%">
      <p align="center"><strong>登录界面</strong></p>
    </td>
    <td width="50%">
      <img src="docs/dashboard.png" alt="仪表盘" width="100%">
      <p align="center"><strong>仪表盘概览</strong></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/cilikube12.png" alt="导航菜单" width="100%">
      <p align="center"><strong>导航菜单</strong></p>
    </td>
    <td width="50%">
      <img src="docs/cluster.png" alt="集群管理" width="100%">
      <p align="center"><strong>集群管理</strong></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/pod.png" alt="Pod管理" width="100%">
      <p align="center"><strong>Pod 管理</strong></p>
    </td>
    <td width="50%">
      <img src="docs/shell.png" alt="Web终端" width="100%">
      <p align="center"><strong>Web 终端</strong></p>
    </td>
  </tr>
</table>

</details>

## 🤝 贡献指南

我们欢迎各种形式的贡献！如果您想参与改进 CiliKube，请：

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'feat: Add some AmazingFeature'`) - 请遵循 Git 提交规范
4. 将您的分支推送到 Github (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### Git 提交规范

请遵循 Conventional Commits 规范：

- `feat`: 新增功能
- `fix`: 修复 Bug
- `perf`: 性能优化
- `style`: 代码样式调整（不影响逻辑）
- `refactor`: 代码重构
- `revert`: 撤销更改
- `test`: 添加或修改测试
- `docs`: 文档或注释修改
- `chore`: 构建流程、依赖管理等杂项更改
- `workflow`: 工作流改进
- `ci`: CI/CD 配置相关
- `types`: 类型定义修改
- `wip`: 开发中的提交（不建议合入主分支）

## 📞 联系方式

- Email: cilliantech@gmail.com
- Website: https://www.cillian.website
- 公众号: 希里安

<img src="docs/wechat400x400.png" width="100" height="100" />

## 📜 许可证

本项目基于 GNU Affero General Public License v3.0 开源。

[![License](https://img.shields.io/badge/License-AGPL--3.0-red.svg)](./LICENSE)
