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
  <div v-if="auth.isLoading.value" class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-gray-500 text-sm">読み込み中...</div>
  </div>

  <!-- App -->
  <div v-else class="min-h-screen bg-gray-50">
    <header v-if="auth.isAuthenticated.value" class="bg-white border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <RouterLink to="/" class="text-xl font-bold text-gray-900 no-underline">
          Web Clipper
        </RouterLink>
        <div class="flex items-center gap-4">
          <RouterLink
            to="/articles/add"
            class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium no-underline hover:bg-blue-700"
          >
            記事を追加
          </RouterLink>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600">
              {{ auth.currentUser.value?.username }}
            </span>
            <button
              class="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              @click="handleLogout"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>
    <main :class="auth.isAuthenticated.value ? 'max-w-4xl mx-auto px-4 py-6' : ''">
      <RouterView />
    </main>
  </div>
</template>
