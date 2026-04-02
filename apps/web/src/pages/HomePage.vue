<script setup lang="ts">
import type { Article, Tag } from "@/types/article";
import { computed, nextTick, onActivated, onMounted, onUnmounted, ref, watch } from "vue";
import {
  extractDomain,
  formatRelativeDate,
  sourceBadgeStyles,
  sourceLabels,
} from "@/utils/article-helpers";
import { RouterLink } from "vue-router";
import { useApi } from "@/composables/use-api";
import { useViewTransition } from "@/composables/use-view-transition";

defineOptions({ name: "HomePage" });

const api = useApi();
const { transitioningArticleId, startTransition } = useViewTransition();

// Magic number constants
const DEBOUNCE_MS = 300;
const EMPTY_LENGTH = 0;

// --- State ---
const searchQuery = ref("");
const debouncedQuery = ref("");
const selectedSource = ref<string>("");
const selectedTag = ref<Tag | null>(null);
const articles = ref<Article[]>([]);
const nextCursor = ref<string | null>(null);
const isLoading = ref(false);
const isLoadingMore = ref(false);

// --- Tag filter ---
const availableTags = ref<Tag[]>([]);
const showTagDropdown = ref(false);
const tagSearchQuery = ref("");
const tagSearchInputRef = ref<HTMLInputElement | null>(null);
const searchContainerRef = ref<HTMLElement | null>(null);

const POPULAR_TAG_START = 0;
const POPULAR_TAG_COUNT = 8;

const popularTags = computed((): Tag[] =>
  [...availableTags.value]
    .toSorted((left, right) => right.articleCount - left.articleCount)
    .slice(POPULAR_TAG_START, POPULAR_TAG_COUNT),
);

const filteredTags = computed((): Tag[] => {
  if (!tagSearchQuery.value) {
    return popularTags.value;
  }
  const query = tagSearchQuery.value.toLowerCase();
  return availableTags.value.filter((tag) => tag.name.toLowerCase().includes(query));
});

const fetchTags = async function fetchTags(): Promise<void> {
  try {
    const res = await api.api.tags.$get();
    if (res.ok) {
      const data = await res.json();
      availableTags.value = data.tags;
    }
  } catch {
    // タグ取得失敗は無視
  }
};

const selectTag = function selectTag(tag: Tag): void {
  selectedTag.value = tag;
  showTagDropdown.value = false;
  tagSearchQuery.value = "";
};

const clearTag = function clearTag(): void {
  selectedTag.value = null;
};

const toggleTagDropdown = async function toggleTagDropdown(): Promise<void> {
  showTagDropdown.value = !showTagDropdown.value;
  if (showTagDropdown.value) {
    await nextTick();
    tagSearchInputRef.value?.focus();
  }
};

const handleClickOutside = function handleClickOutside(event: MouseEvent): void {
  if (searchContainerRef.value && !searchContainerRef.value.contains(event.target as Node)) {
    showTagDropdown.value = false;
    tagSearchQuery.value = "";
  }
};

// --- Source filters ---
const sourceFilters = [
  { label: "全て", value: "" },
  { label: "Twitter", value: "twitter" },
  { label: "Qiita", value: "qiita" },
  { label: "Zenn", value: "zenn" },
  { label: "はてな", value: "hatena" },
  { label: "GitHub", value: "github" },
  { label: "DevelopersIO", value: "classmethod" },
  { label: "Medium", value: "medium" },
  { label: "note", value: "note" },
  { label: "DEV", value: "devto" },
  { label: "Stack Overflow", value: "stackoverflow" },
  { label: "その他", value: "other" },
] as const;

// --- Debounce ---
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, (val) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = val;
  }, DEBOUNCE_MS);
});

// --- Fetch articles ---
const buildQuery = function buildQuery(cursor?: string): Record<string, string> {
  const query: Record<string, string> = {};
  if (debouncedQuery.value) {
    query.search = debouncedQuery.value;
  }
  if (selectedSource.value) {
    query.source = selectedSource.value;
  }
  if (selectedTag.value) {
    query.tagId = selectedTag.value.name;
  }
  if (cursor) {
    query.cursor = cursor;
  }
  return query;
};

const fetchArticles = async function fetchArticles(
  cursor?: string,
): Promise<{ articles: Article[]; nextCursor: string | null }> {
  const query = buildQuery(cursor);
  const res = await api.api.articles.$get({ query });
  const data = await res.json();
  return data;
};

const loadArticles = async function loadArticles(): Promise<void> {
  isLoading.value = true;
  try {
    const data = await fetchArticles();
    articles.value = data.articles;
    nextCursor.value = data.nextCursor;
  } finally {
    isLoading.value = false;
  }
};

const loadMore = async function loadMore(): Promise<void> {
  if (!nextCursor.value || isLoadingMore.value) {
    return;
  }
  isLoadingMore.value = true;
  try {
    const data = await fetchArticles(nextCursor.value);
    articles.value = [...articles.value, ...data.articles];
    nextCursor.value = data.nextCursor;
  } finally {
    isLoadingMore.value = false;
  }
};

// --- Reload on filter change ---
watch([debouncedQuery, selectedSource, selectedTag], () => {
  loadArticles();
});

const isEmpty = computed((): boolean => !isLoading.value && articles.value.length === EMPTY_LENGTH);

// --- Init ---
let isInitialActivation = true;

onMounted(() => {
  loadArticles();
  fetchTags();
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

onActivated(async () => {
  if (isInitialActivation) {
    isInitialActivation = false;
    return;
  }
  const data = await fetchArticles();
  articles.value = data.articles;
  nextCursor.value = data.nextCursor;
});
</script>

<template>
  <div class="space-y-6">
    <!-- Search Bar — command palette style with tag filter -->
    <div ref="searchContainerRef" class="search-container-wrapper">
      <div class="search-container group">
        <!-- Search icon -->
        <div class="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
          <svg
            class="w-5 h-5 text-muted/50 transition-colors duration-200 group-focus-within:text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <!-- Selected tag chip (inside search box) -->
        <button
          v-if="selectedTag"
          class="selected-tag-chip"
          title="タグフィルターを解除"
          @click.stop="clearTag"
        >
          <span class="selected-tag-chip-label">{{ selectedTag.name }}</span>
          <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <input
          v-model="searchQuery"
          type="text"
          placeholder="記事を検索..."
          class="search-input"
          :class="{ 'search-input-with-tag': selectedTag }"
        />

        <!-- Right side controls -->
        <div class="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center gap-1">
          <!-- Clear search button -->
          <button
            v-if="searchQuery"
            class="p-1 text-muted/50 hover:text-foreground transition-colors duration-150"
            @click="searchQuery = ''"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <!-- Tag filter toggle button -->
          <button
            class="tag-filter-btn"
            :class="{ 'tag-filter-btn-active': showTagDropdown || selectedTag }"
            title="タグで絞り込み"
            @click.stop="toggleTagDropdown"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </button>

          <!-- Keyboard shortcut hint -->
          <kbd
            class="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-muted/40 bg-surface-2/60 border border-border/30 rounded-md"
          >
            ⌘K
          </kbd>
        </div>
      </div>

      <!-- Tag dropdown -->
      <div v-if="showTagDropdown" class="tag-dropdown">
        <input
          ref="tagSearchInputRef"
          v-model="tagSearchQuery"
          type="text"
          class="tag-search-input"
          placeholder="タグを検索..."
          @click.stop
        />
        <div class="tag-dropdown-list">
          <div v-if="!tagSearchQuery && filteredTags.length > 0" class="tag-dropdown-section-label">
            よく使われるタグ
          </div>
          <button
            v-for="tag in filteredTags"
            :key="tag.id"
            class="tag-dropdown-item"
            :class="{ 'tag-dropdown-item-selected': selectedTag?.id === tag.id }"
            @click.stop="selectTag(tag)"
          >
            <span class="tag-dropdown-item-name">{{ tag.name }}</span>
            <span class="tag-dropdown-item-count">{{ tag.articleCount }}件</span>
          </button>
          <p v-if="filteredTags.length === 0" class="tag-dropdown-empty">タグが見つかりません</p>
        </div>
      </div>
    </div>

    <!-- Source Filters — horizontal scroll with fade edges -->
    <div class="filter-scroll-container">
      <div class="filter-scroll-inner">
        <button
          v-for="f in sourceFilters"
          :key="f.value"
          class="filter-chip"
          :class="selectedSource === f.value ? 'filter-chip-active' : 'filter-chip-inactive'"
          @click="selectedSource = f.value"
        >
          {{ f.label }}
        </button>
      </div>
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
        @click="
          startTransition({
            id: article.id,
            title: article.title,
            ogImageUrl: article.ogImageUrl,
            source: article.source,
          })
        "
      >
        <!-- OG Image -->
        <img
          v-if="article.ogImageUrl"
          :src="article.ogImageUrl"
          :alt="article.title"
          class="w-full max-h-72 object-contain bg-black/20 rounded-t-xl"
          :style="
            article.id === transitioningArticleId ? { viewTransitionName: 'article-image' } : {}
          "
          loading="lazy"
        />

        <div class="p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <!-- Title -->
              <h3
                class="text-foreground font-semibold text-base font-body line-clamp-2"
                :style="
                  article.id === transitioningArticleId
                    ? { viewTransitionName: 'article-title' }
                    : {}
                "
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
          <div
            class="mt-3 flex flex-wrap items-center gap-2"
            :style="
              article.id === transitioningArticleId ? { viewTransitionName: 'article-meta' } : {}
            "
          >
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
              {{ formatRelativeDate(article.createdAt) }}
            </span>
          </div>
        </div>
      </RouterLink>
    </div>

    <!-- Load more -->
    <div v-if="nextCursor && !isLoading" class="flex justify-center pt-2 pb-4">
      <button
        class="btn-ghost px-6 py-2 text-sm font-medium font-body rounded-lg border border-accent/40 text-accent hover:bg-accent/10 hover:border-accent disabled:opacity-50"
        :disabled="isLoadingMore"
        @click="loadMore"
      >
        {{ isLoadingMore ? "読み込み中..." : "もっと読み込む" }}
      </button>
    </div>
  </div>
</template>
