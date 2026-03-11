import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
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

export default router;
