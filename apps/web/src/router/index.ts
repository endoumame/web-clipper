import { createRouter, createWebHistory } from "vue-router";
import type { Component } from "vue";
import { nextTick } from "vue";
import { useViewTransition } from "@/composables/use-view-transition";

const vt = useViewTransition();

const MIN_LENGTH = 1;

const isBackToList = (toPath: string, fromPath: string): boolean =>
  toPath === "/" && fromPath.startsWith("/articles/");

const loadLogin = async (): Promise<{ default: Component }> => {
  const mod = await import("@/pages/LoginPage.vue");
  return mod;
};
const loadSetup = async (): Promise<{ default: Component }> => {
  const mod = await import("@/pages/SetupPage.vue");
  return mod;
};
const loadHome = async (): Promise<{ default: Component }> => {
  const mod = await import("@/pages/HomePage.vue");
  return mod;
};
const loadAdd = async (): Promise<{ default: Component }> => {
  const mod = await import("@/pages/AddArticlePage.vue");
  return mod;
};
const loadDetail = async (): Promise<{ default: Component }> => {
  const mod = await import("@/pages/ArticleDetailPage.vue");
  return mod;
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      component: loadLogin,
      meta: { requiresAuth: false },
      path: "/login",
    },
    {
      component: loadSetup,
      meta: { requiresAuth: false },
      path: "/setup",
    },
    {
      component: loadHome,
      path: "/",
    },
    {
      component: loadAdd,
      path: "/articles/add",
    },
    {
      component: loadDetail,
      path: "/articles/:id",
    },
  ],
  scrollBehavior(_to, from, savedPosition) {
    if (isBackToList(_to.path, from.path) && savedPosition !== null) {
      return savedPosition;
    }
    return { top: 0 };
  },
});

// Navigation guard
interface NavTarget {
  fullPath: string;
  meta: Record<string, unknown>;
  path: string;
}

type NavResult = string | { path: string; query: { redirect: string } } | true;

const checkSetupRedirect = (needsSetup: boolean, path: string): NavResult => {
  if (needsSetup && path !== "/setup") {
    return "/setup";
  }
  if (!needsSetup && path === "/setup") {
    return "/";
  }
  return true;
};

const checkAuthRedirect = (isAuthenticated: boolean, to: NavTarget): NavResult => {
  if (!isAuthenticated && to.meta.requiresAuth !== false) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  if (isAuthenticated && to.path === "/login") {
    return "/";
  }
  return true;
};

const handleNavigation = async (to: NavTarget): Promise<NavResult> => {
  const { useAuth } = await import("@/composables/use-auth");
  const auth = useAuth();

  if (auth.isLoading.value) {
    await auth.checkAuth();
  }

  const setupResult = checkSetupRedirect(auth.needsSetup.value, to.path);
  if (setupResult !== true) {
    return setupResult;
  }

  return checkAuthRedirect(auth.isAuthenticated.value, to);
};

router.beforeEach(async (to) => {
  const result = await handleNavigation(to);
  return result;
});

// View Transitions API
let resolveTransition: (() => void) | null = null;

const setTransitionForBackNavigation = (
  toPath: string,
  fromPath: string,
  fromParams: Record<string, string | string[]>,
): void => {
  if (isBackToList(toPath, fromPath) && vt.transitioningArticleId.value === null) {
    const articleId = String(fromParams.id);
    if (articleId.length >= MIN_LENGTH) {
      vt.transitioningArticleId.value = articleId;
    }
  }
};

// oxlint-disable-next-line require-await -- async required for vue-router but no direct await needed
router.beforeResolve(async (to, from) => {
  if (typeof document.startViewTransition !== "function") {
    return;
  }

  setTransitionForBackNavigation(
    to.path,
    from.path,
    from.params as Record<string, string | string[]>,
  );

  return new Promise<void>((resolve) => {
    // oxlint-disable-next-line require-await -- must be async for promise-function-async rule, but no await needed
    const transition = document.startViewTransition(async (): Promise<void> => {
      resolve();
      return new Promise<void>((innerResolve) => {
        resolveTransition = innerResolve;
      });
    });

    transition.finished
      .then((): void => {
        vt.clearTransition();
      })
      .catch((): void => {
        // Transition may be cancelled
      });
  });
});

router.afterEach(async () => {
  await nextTick();
  resolveTransition?.();
  resolveTransition = null;
});

export { router };
