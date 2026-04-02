<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from "vue-router";
import { useAuth } from "@/composables/use-auth";
import { useHideOnScroll } from "@/composables/use-hide-on-scroll";
import { useTheme } from "@/composables/use-theme";

const auth = useAuth();
const router = useRouter();
const { isHidden } = useHideOnScroll();
const { resolved: themeMode, toggleTheme } = useTheme();

const handleLogout = async function handleLogout(): Promise<void> {
  await auth.logout();
  await router.push("/login");
};
</script>

<template>
  <!-- Loading state -->
  <div
    v-if="auth.isLoading.value"
    class="min-h-screen bg-surface-0 flex items-center justify-center"
  >
    <div class="flex flex-col items-center gap-3">
      <div class="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
      <span class="text-muted text-sm font-body">読み込み中...</span>
    </div>
  </div>

  <!-- App -->
  <div v-else class="min-h-screen bg-surface-0 font-body text-foreground">
    <header
      v-if="auth.isAuthenticated.value"
      class="sticky top-0 z-50 transition-transform duration-300"
      :class="{ '-translate-y-full': isHidden }"
    >
      <!-- Glassmorphism header with subtle gradient border bottom -->
      <div class="header-glass">
        <div
          class="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4"
        >
          <!-- Logo with gradient -->
          <RouterLink
            to="/"
            class="font-display font-bold text-lg sm:text-xl no-underline shrink-0 flex items-center gap-2 group"
          >
            <span
              class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-accent to-accent/70 text-accent-fg text-sm sm:text-base font-black shadow-sm transition-transform duration-200 group-hover:scale-105"
              >W</span
            >
            <span
              class="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
              >Clipper</span
            >
          </RouterLink>

          <!-- Right actions -->
          <div class="flex items-center gap-1.5 sm:gap-2">
            <!-- Add article button with icon -->
            <RouterLink
              to="/articles/add"
              class="btn-primary no-underline whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-2 inline-flex items-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span class="hidden sm:inline">追加</span>
            </RouterLink>

            <!-- Divider -->
            <div class="w-px h-6 bg-border/40 mx-1 hidden sm:block" />

            <!-- Theme toggle -->
            <button
              class="header-icon-btn"
              :title="themeMode === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替'"
              @click="toggleTheme"
            >
              <svg
                v-if="themeMode === 'dark'"
                class="w-[18px] h-[18px]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <svg
                v-else
                class="w-[18px] h-[18px]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </button>

            <!-- User avatar + menu -->
            <div class="flex items-center gap-1.5 sm:gap-2">
              <button
                class="header-icon-btn w-8 h-8 sm:w-9 sm:h-9 !rounded-full bg-surface-2 text-muted font-semibold text-xs sm:text-sm uppercase"
                :title="auth.currentUser.value?.username"
              >
                {{ auth.currentUser.value?.username?.charAt(0) ?? "?" }}
              </button>
              <button
                class="header-icon-btn text-muted/70 hover:text-error"
                title="ログアウト"
                @click="handleLogout"
              >
                <svg
                  class="w-[18px] h-[18px]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- Bottom gradient line -->
      <div class="h-px w-full bg-gradient-to-r from-transparent via-border/80 to-transparent" />
    </header>

    <main :class="auth.isAuthenticated.value ? 'max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8' : ''">
      <RouterView v-slot="{ Component }">
        <KeepAlive include="HomePage">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>
  </div>
</template>

<style>
/* View Transitions API: ルート要素のクロスフェードを短く・控えめに */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.25s;
  animation-timing-function: ease-out;
}

/* 共有要素の遷移: image, title, meta */
::view-transition-old(article-image),
::view-transition-new(article-image),
::view-transition-old(article-title),
::view-transition-new(article-title),
::view-transition-old(article-meta),
::view-transition-new(article-meta) {
  animation-duration: 0.4s;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

/* 共有要素の位置・サイズ補間を old/new と同じタイミングに揃える */
::view-transition-group(article-image),
::view-transition-group(article-title),
::view-transition-group(article-meta) {
  animation-duration: 0.4s;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 10;
}

/* View Transition 中は CSS transition を無効化して
   border-radius 等が意図せずアニメーションするのを防止 */
:root:active-view-transition * {
  transition: none !important;
}
</style>
