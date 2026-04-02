<script setup lang="ts">
import type { PageInfo } from "../../types.js";
import { clipArticle } from "../composables/use-extension-api.js";
import { ref } from "vue";

const { pageInfo } = defineProps<{ pageInfo: PageInfo }>();
const emit = defineEmits<{ logout: [] }>();

const memo = ref(pageInfo.selectedText);
const isClipping = ref(false);
const resultMessage = ref("");
const isError = ref(false);

const handleClip = async (): Promise<void> => {
  isClipping.value = true;
  resultMessage.value = "";
  const result = await clipArticle(pageInfo.url, memo.value);
  isClipping.value = false;
  if (result.success) {
    resultMessage.value = "Saved!";
    isError.value = false;
  } else {
    resultMessage.value = result.error ?? "Failed to clip";
    isError.value = true;
  }
};
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>Web Clipper</h1>
      <button class="logout-btn" @click="emit('logout')">Logout</button>
    </div>
    <div class="page-info">
      <div class="page-title">{{ pageInfo.title }}</div>
      <div class="page-url">{{ pageInfo.url }}</div>
    </div>
    <form v-if="!resultMessage || isError" @submit.prevent="handleClip">
      <div class="form-group">
        <label for="memo">Memo</label>
        <textarea id="memo" v-model="memo" placeholder="Add a note..." />
      </div>
      <div v-if="resultMessage && isError" class="error-msg">{{ resultMessage }}</div>
      <button type="submit" class="btn btn-primary" :disabled="isClipping">
        {{ isClipping ? "Saving..." : "Clip this page" }}
      </button>
    </form>
    <div v-else class="success-msg">{{ resultMessage }}</div>
  </div>
</template>
