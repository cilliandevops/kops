<div align="center">
  <img alt="Kops Logo" width="120" height="120" src="./src/assets/layouts/logo.png">
  <h1>Kops</h1>
  <span>中文 | <a href="./README.md">English</a></span>
</div>

# Kops 简介

## Kops是什么？

Kops是一款采用主流技术栈构建的一套精致的开源全栈k8s资源管理平台，致力于简化k8s资源的增删改查以及拓展自定义功能。

## Kops的与其他k8s管理系统区别

Kops不追求功能繁多大而全，而是专注于小而美，旨在帮助初学者轻松入门Web开发和k8s的二次开发！

## 定位

Kops非常适合想要学习Vue、Gin进行Web开发以及对Kubernetes的进行二次开发的Web开发初学者和云原生技术爱好者。

## 背景

这个项目是我给2023年自己学习web开发的一个交代，学习路上遇到了不少困难，但好在一路上有不少开源社区的朋友的帮助，今年也将k8s主流的四个蓝证书拿到手了。这个项目kops的字母K代表的不单是k8s，同时也是我打开开源世界大门的一把钥匙（key），走进开源世界，不断贡献，留下自己的足迹，帮助到和我一样的学习者。

## 文档

- 文档临时链接: [link](https://docs.cillian.website)
- 官方文档： 正在建设中,会尽快哈！

## 在线预览网站地址

- 近期会部署到云服务器供大家查看哈！

- coding

## 小心思

- 开源不易，记得点个免费的小星星，一同进步
- 关注公众号-希里安，更新最新情况


##  IDE 推荐设置

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## 技术栈

- 前后端均采用最新主流技术栈，帮助快速融入主流

- 前端采用V3-admin框架，在此感谢原作者un-pany： `https://github.com/un-pany/v3-admin-vite`

- 后端试用k8s官方客户端调用api服务器，实现增删改查

### 环境

- Nodejs 20.14.0 (24年6月最新LTS版本)
- Go 1.22.4 (24年6月最新版本)
#### 前端：采用最新技术栈vue3+ts+elmentplus,依赖均为最新版本

- Vue3
- Element Plus
- Pinia
- Vite
- Vue Router
- TypeScript
- PNPM
- Scss
- ESlint
- Prettier
- Axios
- UnoCSS
#### 后端：采用go+gin框架开发接口，使用client-go进行k8s接口开发

- github.com/dgrijalva/jwt-go
- github.com/gin-gonic/gin
- github.com/gorilla/websocket
- github.com/wonderivan/logger
- k8s.io/api
- k8s.io/apimachinery
- k8s.io/client-go

#### 开发进度一览

前端进展：
- 登录界面
- 网页整体布局搭建
- 菜单栏
- 标签栏
- 消息提示框
- 顶部导航条

后端进展：

- k8s环境初始化
- 路由设置
- 跨域问题配置
- JWT认证机制
- Node资源接口
- Pod管理接口
- PV资源接口

未来计划

- 剩余资源接口开发
- 页内导航
- 监控页面
- 日志页面
- webshell


## 自定义配置vite

查看 [Vite官网](https://vitejs.dev/config/)

## 项目二次开发

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```

## 功能预览

![Alt text](src/assets/kops/kops.gif)

![Alt text](src/assets/kops/login-2.png)

![Alt text](src/assets/kops/dashboard.png)

![Alt text](src/assets/kops/k8s-1.jpg)

![Alt text](src/assets/kops/k8s-2.jpg)

![Alt text](src/assets/kops/k8s-3.png)

![Alt text](src/assets/kops/k8s-4.png)

![Alt text](src/assets/kops/k8s-5.png)

![Alt text](src/assets/kops/k8s-6.png)

![Alt text](src/assets/kops/k8s-7.png)

![Alt text](src/assets/kops/k8s-8.png)

![Alt text](src/assets/kops/k8s-9.png)


## Git 提交规范

- `feat` add new functions
- `fix` Fix issues/bugs
- `perf` Optimize performance
- `style` Change the code style without affecting the running result
- `refactor` Re-factor code
- `revert` Undo changes
- `test` Test related, does not involve changes to business code
- `docs` Documentation and Annotation
- `chore` Updating dependencies/modifying scaffolding configuration, etc.
- `workflow` Work flow Improvements
- `ci` CICD
- `types` Type definition
- `wip` In development


## 感谢的心

对于小型项目来说，获得认可可能是一个挑战。如果您认为这个项目有价值，请考虑通过给予星标来显示您的支持。您的鼓励是作者定期维护项目的主要动力。还有一个小提醒：给予星标完全是免费的！

## 联系方式

- Email: cilliandevops@gmail.com

- Website: https://www.cillian.website

- WeChat：cilliandevops

## License

[MIT License](./LICENSE)

Copyright (c) 2023-present [cilliandevops](https://github.com/cilliandevops)