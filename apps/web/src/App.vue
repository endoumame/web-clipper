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
      class="sticky top-0 z-50 bg-surface-0/80 backdrop-blur-xl border-b border-border/60 transition-transform duration-300"
      :class="{ '-translate-y-full': isHidden }"
    >
      <!-- Decorative golden top bar -->
      <div class="h-0.5 w-full bg-gradient-to-r from-accent/0 via-accent to-accent/0" />

      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3"
      >
        <RouterLink to="/" class="font-display font-bold text-lg sm:text-xl no-underline shrink-0">
          <span class="text-foreground">Web </span><span class="text-accent">Clipper</span>
        </RouterLink>

        <div class="flex items-center gap-2 sm:gap-4">
          <RouterLink
            to="/articles/add"
            class="btn-primary no-underline whitespace-nowrap text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5"
          >
            記事を追加
          </RouterLink>

          <button
            class="p-2 text-muted hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-surface-2"
            :title="themeMode === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替'"
            @click="toggleTheme"
          >
            <!-- Sun icon (dark mode → switch to light) -->
            <svg
              v-if="themeMode === 'dark'"
              class="w-5 h-5"
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
            <!-- Moon icon (light mode → switch to dark) -->
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          </button>

          <div class="flex items-center gap-2 sm:gap-3">
            <span class="text-muted text-sm font-body hidden sm:inline truncate max-w-32">
              {{ auth.currentUser.value?.username }}
            </span>
            <button
              class="btn-ghost whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-4"
              @click="handleLogout"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
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
