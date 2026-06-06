<script setup lang="ts">
import { loginToApi } from "../composables/use-extension-api.js";
import { ref } from "vue";

const emit = defineEmits<{ loginSuccess: [] }>();

const apiUrl = ref("http://localhost:8787");
const username = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);

const handleLogin = async (): Promise<void> => {
  errorMessage.value = "";
  isLoading.value = true;
  const result = await loginToApi(apiUrl.value, username.value, password.value);
  isLoading.value = false;
  if (result.success) {
    emit("loginSuccess");
  } else {
    errorMessage.value = result.error ?? "Login failed";
  }
};
</script>

<template>
  <div class="container">
    <h1>Web Clipper Login</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="api-url">API URL</label>
        <input
          id="api-url"
          v-model="apiUrl"
          type="url"
          placeholder="https://your-api.example.com"
          required
        />
      </div>
      <div class="form-group">
        <label for="username">Username</label>
        <input id="username" v-model="username" type="text" autocomplete="username" required />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </div>
      <div v-if="errorMessage" class="error-msg">{{ errorMessage }}</div>
      <button type="submit" class="btn btn-primary" :disabled="isLoading">
        {{ isLoading ? "Logging in..." : "Login" }}
      </button>
    </form>
  </div>
</template>
