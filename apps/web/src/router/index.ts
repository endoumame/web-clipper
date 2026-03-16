import { nextTick } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { useViewTransition } from "@/composables/useViewTransition";

const vt = useViewTransition();

const isBackToList = (toPath: string, fromPath: string) =>
  toPath === "/" && fromPath.startsWith("/articles/");

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (!isBackToList(to.path, from.path)) {
      return { top: 0 };
    }

    // VT対応ブラウザ: afterEach内でsnapshot前にスクロール復元するため、ここでは何もしない
    if ("startViewTransition" in document) {
      return false;
    }

    // 非VTブラウザ: ブラウザバックならsavedPosition、プログラマティック遷移なら保存値を使う
    return savedPosition ?? { top: vt.getSavedScrollY() };
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
      vt.resetSavedScrollY();
    });
  });
});

router.afterEach(async (to, from) => {
  await nextTick();

  // VTブラウザ: resolveTransition() の前にスクロール位置を復元し、
  // 新しいスナップショットに正しいスクロール位置を反映させる
  if (resolveTransition && isBackToList(to.path, from.path)) {
    vt.restoreScroll();
  }

  resolveTransition?.();
  resolveTransition = null;
});

export default router;
