<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { useAuth } from "@/composables/useAuth";

const auth = useAuth();

async function handleLogout() {
  await auth.logout();
}
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
      class="sticky top-0 z-50 bg-surface-0/80 backdrop-blur-xl border-b border-border/60"
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
      <RouterView />
    </main>
  </div>
</template>

<style>
/* View Transitions API: デフォルトのクロスフェード */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
  animation-timing-function: ease;
}

/* 共有要素の遷移 */
::view-transition-old(article-card),
::view-transition-new(article-card),
::view-transition-old(article-image),
::view-transition-new(article-image),
::view-transition-old(article-title),
::view-transition-new(article-title) {
  animation-duration: 0.35s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
