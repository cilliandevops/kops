import { type RouteRecordRaw, createRouter } from "vue-router"
import { history, flatMultiLevelRoutes } from "./helper"
import routeSettings from "@/config/route"

const Layouts = () => import("@/layouts/index.vue")

/**
 * 常驻路由
 * 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置 Name 属性
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layouts,
    meta: {
      hidden: true
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        component: () => import("@/views/redirect/index.vue")
      }
    ]
  },
  {
    path: "/403",
    component: () => import("@/views/error-page/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/views/error-page/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    path: "/login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/",
    component: Layouts,
    redirect: "/dashboard",
    meta: {
      title: "快捷看板",
      svgIcon: "dashboard"
    },
    children: [
      {
        path: "dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        name: "Dashboard",
        meta: {
          title: "概要",
          affix: true
        }
      },
      {
        path: "notice",
        component: () => import("@/views/notice/index.vue"),
        name: "Notice",
        meta: {
          title: "公告"
        }
      },
      {
        path: "navigation",
        component: () => import("@/views/error-page/404.vue"),
        name: "Nav",
        meta: {
          title: "导航"
        }
      }

    ]
  },
  {
    path: "/resource",
    component: () => import("@/views/error-page/404.vue"),
    meta: {
      title: "CMDB",
      svgIcon: "search"
    },
    children: [
      {
        path: "index",
        component: () => import("@/views/error-page/404.vue"),
        name: "Machines",
        meta: {
          title: "物理资产",
          
        }
      },
      {
        path: "index2",
        component: () => import("@/views/error-page/404.vue"),
        name: "Others",
        meta: {
          title: "其他",
         
        }
      }
    ]
  },
  {
    path: "/cluster",
    name: "K8s",
    component: Layouts,
    meta: {
      title: "k8s资源",
      svgIcon: "menu",
      },
    children: [
        {
            path: "node",
            name: "Node",
            meta: {title: "Node", requireAuth: true},
            component: () => import("@/views/node/Node.vue")
        },
        {
            path: "namespace",
            name: "Namespace",
            meta: {title: "Namespace",},
            component: () => import("@/views/namespace/Namespace.vue")
        },
        {
            path: "persistentvolume",
            name: "PersistentVolume",
            meta: {title: "PersistemtVolume"},
            component: () => import("@/views/persistentvolume/PersistentVolume.vue")
        }
    ]
  },
  {
    path: "/loadbalance",
    name: "LB",
    component: Layouts,
    meta: {
      title: "应用负载",
      elIcon: "Menu",
    
  },
    children: [
        {
            path: "/service",
            name: "Service",
            meta: {title: "Service", requireAuth: true},
            component: () => import("@/views/error-page/404.vue"),
        },
        {
            path: "/ingress",
            name: "Ingress",
            meta: {title: "Ingress", requireAuth: true},
            component: () => import("@/views/error-page/404.vue"),
        }
    ]
  },
  {
    path: "/link",
    meta: {
      title: "文档管理",
      svgIcon: "link"
    },
    children: [
      {
        path: "https://docs.cillian.website",
        component: () => {},
        name: "Link1",
        meta: {
          title: "中文文档"
        }
      },
      {
        path: "https://www.cillian.website",
        component: () => {},
        name: "Link2",
        meta: {
          title: "我的博客"
        }
      }
    ]
  },
 
]

/**
 * 动态路由
 * 用来放置有权限 (Roles 属性) 的路由
 * 必须带有 Name 属性
 */
export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: "/permission",
    component: Layouts,
    redirect: "/permission/page",
    name: "Permission",
    meta: {
      title: "权限管理",
      svgIcon: "lock",
      roles: ["admin", "editor"], // 可以在根路由中设置角色
      alwaysShow: true // 将始终显示根菜单
    },
    children: [
      {
        path: "page",
        component: () => import("@/views/permission/page.vue"),
        name: "PagePermission",
        meta: {
          title: "页面权限",
          roles: ["admin"] // 或者在子导航中设置角色
        }
      },
      {
        path: "directive",
        component: () => import("@/views/permission/directive.vue"),
        name: "DirectivePermission",
        meta: {
          title: "指令权限" // 如果未设置角色，则表示：该页面不需要权限，但会继承根路由的角色
        }
      }
    ]
  },
  {
    path: "/:pathMatch(.*)*", // Must put the 'ErrorPage' route at the end, 必须将 'ErrorPage' 路由放在最后
    redirect: "/404",
    name: "ErrorPage",
    meta: {
      hidden: true
    }
  }
]

const router = createRouter({
      /**
     * hash模式：createWebHashHistory，
     * history模式：createWebHistory
     */
  history,
  routes: routeSettings.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

/** 重置路由 */
export function resetRouter() {
  // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
  try {
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    window.location.reload()
  }
}

// 抛出路由实例, 在 main.js 中引用
export default router
