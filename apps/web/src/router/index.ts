import { nextTick } from "vue";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from) {
    if (to.path === "/" && from.path.startsWith("/articles/")) {
      return false;
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
    return "/login";
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

  const isBackToList = to.path === "/" && from.path.startsWith("/articles/");

  return new Promise<void>((resolve) => {
    const transition = document.startViewTransition(() => {
      resolve();
      return new Promise<void>((r) => {
        resolveTransition = r;
      });
    });

    transition.finished.then(async () => {
      const { useViewTransition } = await import("@/composables/useViewTransition");
      const vt = useViewTransition();
      if (isBackToList) {
        vt.restoreScroll();
      }
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
