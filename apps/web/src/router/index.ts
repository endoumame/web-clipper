import { nextTick } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { useViewTransition } from "@/composables/useViewTransition";

const vt = useViewTransition();

const isBackToList = (toPath: string, fromPath: string) =>
  toPath === "/" && fromPath.startsWith("/articles/");

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    // 詳細→一覧への遷移時のみスクロール位置を復元
    if (isBackToList(to.path, from.path) && savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  },
  routes: [
    {
      path: "/login",
      component: () => import("@/pages/LoginPage.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/setup",
      component: () => import("@/pages/SetupPage.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/",
      component: () => import("@/pages/HomePage.vue"),
    },
    {
      path: "/articles/add",
      component: () => import("@/pages/AddArticlePage.vue"),
    },
    {
      path: "/articles/:id",
      component: () => import("@/pages/ArticleDetailPage.vue"),
    },
  ],
});

// Navigation guard
router.beforeEach(async (to) => {
  // Dynamic import to avoid circular dependency
  const { useAuth } = await import("@/composables/useAuth");
  const auth = useAuth();

  // Check auth on first load
  if (auth.isLoading.value) {
    await auth.checkAuth();
  }

  // Needs setup → force /setup
  if (auth.needsSetup.value && to.path !== "/setup") {
    return "/setup";
  }

  // Setup done but trying to access /setup → redirect home
  if (!auth.needsSetup.value && to.path === "/setup") {
    return "/";
  }

  // Not authenticated and route requires auth → /login
  if (!auth.isAuthenticated.value && to.meta.requiresAuth !== false) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  // Authenticated but on /login → redirect home
  if (auth.isAuthenticated.value && to.path === "/login") {
    return "/";
  }
});

// View Transitions API
let resolveTransition: (() => void) | null = null;

router.beforeResolve(async (to, from) => {
  if (!document.startViewTransition) return;

  // ブラウザバックで一覧に戻る場合、transitioningArticleIdを自動設定
  // （goBack()経由なら既にstartTransition()でセット済み）
  if (isBackToList(to.path, from.path) && !vt.transitioningArticleId.value) {
    const articleId = from.params.id as string;
    if (articleId) {
      vt.transitioningArticleId.value = articleId;
    }
  }

  return new Promise<void>((resolve) => {
    const transition = document.startViewTransition(() => {
      resolve();
      return new Promise<void>((r) => {
        resolveTransition = r;
      });
    });

    transition.finished.then(() => {
      vt.clearTransition();
    });
  });
});

router.afterEach(async () => {
  await nextTick();
  resolveTransition?.();
  resolveTransition = null;
});

export default router;
