<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuth } from "@/composables/use-auth";
import { useRouter } from "vue-router";

const router = useRouter();
const auth = useAuth();

const username = ref("");
const password = ref("");
const passwordConfirm = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");

const passwordMismatch = computed(
  (): boolean => passwordConfirm.value !== "" && password.value !== passwordConfirm.value,
);

const isFormValid = computed(
  (): boolean =>
    username.value.trim() !== "" &&
    password.value.trim() !== "" &&
    passwordConfirm.value.trim() !== "" &&
    !passwordMismatch.value,
);

const trySetup = async (): Promise<boolean> => {
  const success = await auth.setup(username.value, password.value);
  if (success) {
    router.push("/");
    return true;
  }
  errorMessage.value = "セットアップに失敗しました。もう一度お試しください。";
  return false;
};

const handleSubmit = async (): Promise<void> => {
  if (!isFormValid.value || isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    await trySetup();
  } catch {
    errorMessage.value = "セットアップに失敗しました。もう一度お試しください。";
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div
    class="min-h-screen bg-surface-0 flex items-center justify-center px-4 relative overflow-hidden"
  >
    <!-- Decorative background orb -->
    <div
      class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent/5 blur-3xl pointer-events-none"
    />

    <div class="w-full max-w-sm relative z-10">
      <!-- Gradient top border -->
      <div class="h-1 rounded-t-xl bg-gradient-to-r from-accent via-purple to-info" />

      <!-- Card -->
      <div class="card-base rounded-t-none p-8">
        <!-- Logo -->
        <h1 class="text-2xl font-bold text-center mb-2 font-display">
          <span class="text-foreground">Web</span>
          <span class="text-accent">Clipper</span>
        </h1>
        <p class="text-muted text-sm text-center mb-6 font-body">初期セットアップ</p>

        <!-- Error message -->
        <div
          v-if="errorMessage"
          class="mb-4 rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error"
        >
          {{ errorMessage }}
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Username -->
          <div>
            <label for="username" class="mb-1 block text-sm font-medium text-muted font-body">
              ユーザー名
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              autocomplete="username"
              placeholder="ユーザー名を入力"
              class="input-base w-full"
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="mb-1 block text-sm font-medium text-muted font-body">
              パスワード
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="new-password"
              placeholder="パスワードを入力"
              class="input-base w-full"
            />
          </div>

          <!-- Password confirmation -->
          <div>
            <label
              for="password-confirm"
              class="mb-1 block text-sm font-medium text-muted font-body"
            >
              パスワード（確認）
            </label>
            <input
              id="password-confirm"
              v-model="passwordConfirm"
              type="password"
              required
              autocomplete="new-password"
              placeholder="パスワードを再入力"
              class="input-base w-full"
              :class="{ 'border-error': passwordMismatch }"
            />
            <p v-if="passwordMismatch" class="mt-1 text-sm text-error">パスワードが一致しません</p>
          </div>

          <!-- Submit button -->
          <button type="submit" :disabled="!isFormValid || isSubmitting" class="btn-primary w-full">
            <span v-if="isSubmitting" class="inline-flex items-center gap-2">
              <svg class="h-4 w-4 animate-spin text-surface-0" viewBox="0 0 24 24" fill="none">
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
