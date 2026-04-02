<script setup lang="ts">
/* oxlint-disable no-unsafe-assignment, no-unsafe-call, no-unsafe-member-access -- Chrome extension API types not resolved by oxlint */
import type { ExtensionMessage, PageInfo } from "../types.js";
import { checkSession, clearSession } from "./composables/use-extension-api.js";
import { onMounted, ref } from "vue";
import ClipForm from "./components/ClipForm.vue";
import LoginForm from "./components/LoginForm.vue";

type ViewState = "clip" | "loading" | "login";

const viewState = ref<ViewState>("loading");
const pageInfo = ref<PageInfo | null>(null);

const buildFallbackPageInfo = (tab?: chrome.tabs.Tab): PageInfo => ({
  description: "",
  ogImage: "",
  selectedText: "",
  title: tab?.title ?? "",
  url: tab?.url ?? "",
});

const queryContentScript = async (tabId: number): Promise<PageInfo | null> => {
  try {
    const message: ExtensionMessage = { type: "GET_PAGE_INFO" };
    const response = (await chrome.tabs.sendMessage(tabId, message)) as PageInfo | null;
    return response !== null && typeof response === "object" ? response : null;
  } catch {
    return null;
  }
};

const fetchPageInfo = async (): Promise<PageInfo> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const fallback = buildFallbackPageInfo(tab);
  if (typeof tab?.id !== "number") {
    return fallback;
  }
  return (await queryContentScript(tab.id)) ?? fallback;
};

const initialize = async (): Promise<void> => {
  const isAuthenticated = await checkSession();
  if (!isAuthenticated) {
    viewState.value = "login";
    return;
  }
  pageInfo.value = await fetchPageInfo();
  viewState.value = "clip";
};

const handleLoginSuccess = async (): Promise<void> => {
  viewState.value = "loading";
  pageInfo.value = await fetchPageInfo();
  viewState.value = "clip";
};

const handleLogout = async (): Promise<void> => {
  await clearSession();
  viewState.value = "login";
};

onMounted(async () => {
  await initialize();
});
</script>

<template>
  <div v-if="viewState === 'loading'" class="loading">Loading...</div>
  <LoginForm v-else-if="viewState === 'login'" @login-success="handleLoginSuccess" />
  <ClipForm
    v-else-if="viewState === 'clip' && pageInfo"
    :page-info="pageInfo"
    @logout="handleLogout"
  />
</template>
