<script setup lang="ts">
import { ref, computed, watch, onMounted, onDeactivated } from "vue";
import { RouterLink } from "vue-router";
import { useApi } from "@/composables/useApi";
import { useViewTransition } from "@/composables/useViewTransition";
import type { Article, Tag } from "@/types/article";

defineOptions({ name: "HomePage" });

const api = useApi();
const { saveScrollY } = useViewTransition();

// --- State ---
const searchQuery = ref("");
const debouncedQuery = ref("");
const selectedSource = ref<string>("");
const selectedTagId = ref<string>("");

const articles = ref<Article[]>([]);
const nextCursor = ref<string | null>(null);
const tags = ref<Tag[]>([]);
const isLoading = ref(false);
const isLoadingMore = ref(false);

// --- Source filters ---
const sourceFilters = [
  { value: "", label: "全て" },
  { value: "twitter", label: "Twitter" },
  { value: "qiita", label: "Qiita" },
  { value: "zenn", label: "Zenn" },
  { value: "hatena", label: "はてな" },
  { value: "other", label: "その他" },
] as const;

const sourceBadgeStyles: Record<string, string> = {
  twitter: "bg-info/15 text-info",
  qiita: "bg-success/15 text-success",
  zenn: "bg-purple/15 text-purple",
  hatena: "bg-error/15 text-error",
  other: "bg-muted/15 text-muted",
};

const sourceLabels: Record<string, string> = {
  twitter: "Twitter",
  qiita: "Qiita",
  zenn: "Zenn",
  hatena: "はてな",
  other: "その他",
};

// --- Debounce ---
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = val;
  }, 300);
});

// --- Fetch articles ---
async function fetchArticles(cursor?: string) {
  const query: Record<string, string> = {};
  if (debouncedQuery.value) query.q = debouncedQuery.value;
  if (selectedSource.value) query.source = selectedSource.value;
  if (selectedTagId.value) query.tagId = selectedTagId.value;
  if (cursor) query.cursor = cursor;

  const res = await api.api.articles.$get({ query });
  const data = await res.json();
  return data;
}

async function loadArticles() {
  isLoading.value = true;
  try {
    const data = await fetchArticles();
    articles.value = data.articles;
    nextCursor.value = data.nextCursor;
  } finally {
    isLoading.value = false;
  }
}

async function loadMore() {
  if (!nextCursor.value || isLoadingMore.value) return;
  isLoadingMore.value = true;
  try {
    const data = await fetchArticles(nextCursor.value);
    articles.value = [...articles.value, ...data.articles];
    nextCursor.value = data.nextCursor;
  } finally {
    isLoadingMore.value = false;
  }
}

// --- Fetch tags ---
async function fetchTags() {
  const res = await api.api.tags.$get();
  const data = await res.json();
  tags.value = data.tags;
}

// --- Reload on filter change ---
watch([debouncedQuery, selectedSource, selectedTagId], () => {
  loadArticles();
});

// --- Helpers ---
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

const isEmpty = computed(() => !isLoading.value && articles.value.length === 0);

// --- Scroll position ---
onDeactivated(() => {
  saveScrollY(window.scrollY);
});

// --- Init ---
onMounted(() => {
  loadArticles();
  fetchTags();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Search Bar -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg class="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="記事を検索..."
        class="input-base w-full py-3 px-5 pl-12 text-base font-body focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-200"
      />
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-4">
      <!-- Source filter pills -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in sourceFilters"
          :key="f.value"
          class="px-4 py-2 text-sm rounded-full border transition-all duration-200 font-body"
          :class="
            selectedSource === f.value
              ? 'bg-accent text-surface-0 border-accent shadow-sm shadow-accent/20'
              : 'bg-surface-2 text-muted border-border hover:text-foreground hover:border-muted'
          "
          @click="selectedSource = f.value"
        >
          {{ f.label }}
        </button>
      </div>

      <!-- Tag dropdown -->
      <select
        v-model="selectedTagId"
        class="input-base bg-surface-2 px-4 py-2 text-sm font-body rounded-lg"
      >
        <option value="">全てのタグ</option>
        <option v-for="tag in tags" :key="tag.id" :value="tag.id">
          {{ tag.name }} ({{ tag.articleCount }})
        </option>
      </select>
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="n in 6" :key="n" class="card-base overflow-hidden">
        <div class="skeleton w-full h-48 rounded-none" />
        <div class="p-5 space-y-3">
          <div class="skeleton h-5 w-3/4 rounded" />
          <div class="skeleton h-3 w-1/3 rounded" />
          <div class="flex gap-2 mt-3">
            <div class="skeleton h-5 w-16 rounded-full" />
            <div class="skeleton h-5 w-12 rounded-full" />
            <div class="skeleton h-5 w-20 rounded-full ml-auto" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="isEmpty" class="text-center py-16">
      <svg
        class="w-12 h-12 mx-auto text-muted/40 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
      <p class="text-muted font-body text-sm">記事が見つかりませんでした</p>
      <p class="text-muted/50 font-body text-xs mt-1">検索条件を変更してお試しください</p>
    </div>

    <!-- Article cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <RouterLink
        v-for="article in articles"
        :key="article.id"
        :to="`/articles/${article.id}`"
        class="block card-hover overflow-hidden no-underline"
      >
        <!-- OG Image -->
        <img
          v-if="article.ogImageUrl"
          :src="article.ogImageUrl"
          :alt="article.title"
          class="w-full max-h-72 object-contain bg-black/20"
          loading="lazy"
        />

        <div class="p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <!-- Title -->
              <h3
                class="text-foreground font-semibold text-base font-body line-clamp-2"
              >
                {{ article.title }}
              </h3>

              <!-- Domain URL -->
              <span class="mt-1 text-xs text-muted block truncate">
                {{ extractDomain(article.url) }}
              </span>
            </div>

            <!-- Read/unread indicator -->
            <span class="flex-shrink-0 mt-1.5" :title="article.isRead ? '既読' : '未読'">
              <span
                v-if="article.isRead"
                class="inline-block w-2.5 h-2.5 rounded-full bg-muted/30"
              />
              <span
                v-else
                class="inline-block w-2.5 h-2.5 rounded-full bg-accent shadow-sm shadow-accent/50"
              />
            </span>
          </div>

          <!-- Meta -->
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <!-- Source badge -->
            <span
              class="badge-base px-2 py-0.5 text-xs font-medium rounded-full"
              :class="sourceBadgeStyles[article.source]"
            >
              {{ sourceLabels[article.source] }}
            </span>

            <!-- Tags -->
            <span
              v-for="tag in article.tags"
              :key="tag"
              class="bg-surface-2 text-muted text-xs rounded-full px-2.5 py-0.5"
            >
              {{ tag }}
            </span>

            <!-- Date -->
            <span class="text-muted/70 text-xs ml-auto font-body">
              {{ formatDate(article.createdAt) }}
            </span>
          </div>
        </div>
      </RouterLink>
    </div>

    <!-- Load more -->
    <div v-if="nextCursor && !isLoading" class="flex justify-center pt-2 pb-4">
      <button
        class="btn-ghost px-6 py-2 text-sm font-medium font-body rounded-lg border border-accent/40 text-accent hover:bg-accent/10 hover:border-accent transition-all duration-200 disabled:opacity-50"
        :disabled="isLoadingMore"
        @click="loadMore"
      >
        {{ isLoadingMore ? "読み込み中..." : "もっと読み込む" }}
      </button>
    </div>
  </div>
</template>
