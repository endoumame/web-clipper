<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";

const router = useRouter();
const auth = useAuth();

const username = ref("");
const password = ref("");
const passwordConfirm = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");

const passwordMismatch = computed(() => {
  return passwordConfirm.value !== "" && password.value !== passwordConfirm.value;
});

const isFormValid = computed(() => {
  return (
    username.value.trim() !== "" &&
    password.value.trim() !== "" &&
    passwordConfirm.value.trim() !== "" &&
    !passwordMismatch.value
  );
});

async function handleSubmit() {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    const success = await auth.setup(username.value, password.value);
    if (success) {
      router.push("/");
    } else {
      errorMessage.value = "セットアップに失敗しました。もう一度お試しください。";
    }
  } catch {
    errorMessage.value = "セットアップに失敗しました。もう一度お試しください。";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <h1 class="text-2xl font-bold text-gray-900 text-center mb-2">Web Clipper</h1>
        <p class="text-sm text-gray-500 text-center mb-6">初期セットアップ</p>

        <!-- Error message -->
        <div
          v-if="errorMessage"
          class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ errorMessage }}
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Username -->
          <div>
            <label for="username" class="mb-1 block text-sm font-medium text-gray-700">
              ユーザー名
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              autocomplete="username"
              placeholder="ユーザー名を入力"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="mb-1 block text-sm font-medium text-gray-700">
              パスワード
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="new-password"
              placeholder="パスワードを入力"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <!-- Password confirmation -->
          <div>
            <label for="password-confirm" class="mb-1 block text-sm font-medium text-gray-700">
              パスワード（確認）
            </label>
            <input
              id="password-confirm"
              v-model="passwordConfirm"
              type="password"
              required
              autocomplete="new-password"
              placeholder="パスワードを再入力"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              :class="{ 'border-red-500': passwordMismatch }"
            />
            <p v-if="passwordMismatch" class="mt-1 text-sm text-red-600">
              パスワードが一致しません
            </p>
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="!isFormValid || isSubmitting"
            class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="isSubmitting" class="inline-flex items-center gap-2">
              <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              セットアップ中...
            </span>
            <span v-else>アカウントを作成</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
