<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  extractDomain,
  formatDate,
  formatRelativeDate,
  sourceBadgeStyles,
  sourceLabels,
} from "@/utils/article-helpers";
import { useRoute, useRouter } from "vue-router";
import type { Article } from "@/types/article";
import { useApi } from "@/composables/use-api";
import { useViewTransition } from "@/composables/use-view-transition";

const route = useRoute();
const router = useRouter();
const api = useApi();
const { transitionArticle, startTransition, clearTransition } = useViewTransition();

const articleId = computed(() => route.params.id as string);

const article = ref<Article | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// メモ編集
const isEditingMemo = ref(false);
const editMemo = ref("");
const savingMemo = ref(false);

// タグ管理
const newTag = ref("");
const savingTags = ref(false);
const allTags = ref<string[]>([]);

// 既読切替
const togglingRead = ref(false);

// AI要約
const generatingSummary = ref(false);
const summaryError = ref<string | null>(null);

// 削除
const deleting = ref(false);
const showDeleteConfirm = ref(false);

const HTTP_NOT_FOUND = 404;
const HISTORY_BACK_STEPS = -1;

const handleFetchError = function handleFetchError(status: number): void {
  error.value =
    status === HTTP_NOT_FOUND ? "記事が見つかりませんでした。" : "記事の取得に失敗しました。";
};

const fetchArticle = async function fetchArticle(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.api.articles[":id"].$get({ param: { id: articleId.value } });
    if (!res.ok) {
      handleFetchError(res.status);
      return;
    }
    article.value = (await res.json()) as Article;
  } catch {
    error.value = "記事の取得中にエラーが発生しました。";
  } finally {
    loading.value = false;
  }
};

const fetchAllTags = async function fetchAllTags(): Promise<void> {
  try {
    const res = await api.api.tags.$get();
    if (res.ok) {
      const data = await res.json();
      allTags.value = data.tags.map((tg) => tg.name);
    }
  } catch {
    // タグ取得失敗は無視
  }
};

const toggleRead = async function toggleRead(): Promise<void> {
  if (!article.value || togglingRead.value) {
    return;
  }
  togglingRead.value = true;
  try {
    const newIsRead = !article.value.isRead;
    const res = await api.api.articles[":id"].$put({
      json: { isRead: newIsRead },
      param: { id: articleId.value },
    });
    if (res.ok) {
      article.value.isRead = newIsRead;
    }
  } catch {
    // エラー時は何もしない
  } finally {
    togglingRead.value = false;
  }
};

const startEditMemo = function startEditMemo(): void {
  editMemo.value = article.value?.memo ?? "";
  isEditingMemo.value = true;
};

const cancelEditMemo = function cancelEditMemo(): void {
  isEditingMemo.value = false;
};

const saveMemo = async function saveMemo(): Promise<void> {
  if (!article.value || savingMemo.value) {
    return;
  }
  savingMemo.value = true;
  try {
    const memoValue = editMemo.value.trim() || null;
    const res = await api.api.articles[":id"].$put({
      json: { memo: memoValue },
      param: { id: articleId.value },
    });
    if (res.ok) {
      article.value.memo = memoValue;
      isEditingMemo.value = false;
    }
  } catch {
    // エラー時は何もしない
  } finally {
    savingMemo.value = false;
  }
};

const updateArticleTags = async function updateArticleTags(newTags: string[]): Promise<boolean> {
  const res = await api.api.articles[":id"].$put({
    json: { tags: newTags },
    param: { id: articleId.value },
  });
  return res.ok;
};

const removeTag = async function removeTag(tag: string): Promise<void> {
  if (!article.value || savingTags.value) {
    return;
  }
  savingTags.value = true;
  try {
    const newTags = article.value.tags.filter((tg) => tg !== tag);
    if (await updateArticleTags(newTags)) {
      article.value.tags = newTags;
    }
  } catch {
    // エラー時は何もしない
  } finally {
    savingTags.value = false;
  }
};

const getValidNewTag = function getValidNewTag(): string | null {
  if (!article.value || savingTags.value) {
    return null;
  }
  const tag = newTag.value.trim();
  if (!tag || article.value.tags.includes(tag)) {
    newTag.value = "";
    return null;
  }
  return tag;
};

const addTag = async function addTag(): Promise<void> {
  const tag = getValidNewTag();
  if (!tag || !article.value) {
    return;
  }
  savingTags.value = true;
  try {
    const newTags = [...article.value.tags, tag];
    if (await updateArticleTags(newTags)) {
      article.value.tags = newTags;
      newTag.value = "";
    }
  } catch {
    // エラー時は何もしない
  } finally {
    savingTags.value = false;
  }
};

const extractSummaryErrorMessage = function extractSummaryErrorMessage(body: unknown): string {
  if (body && typeof body === "object" && "message" in body) {
    return String((body as { message: string }).message);
  }
  return "要約の生成に失敗しました";
};

const handleSummaryResponse = async function handleSummaryResponse(res: Response): Promise<void> {
  if (res.ok) {
    const data = await res.json();
    article.value = data as Article;
  } else {
    const body = await res.json().catch(() => null);
    summaryError.value = extractSummaryErrorMessage(body);
  }
};

const generateSummary = async function generateSummary(): Promise<void> {
  if (!article.value || generatingSummary.value) {
    return;
  }
  generatingSummary.value = true;
  summaryError.value = null;
  try {
    const res = await api.api.articles[":id"].summary.$post({ param: { id: articleId.value } });
    await handleSummaryResponse(res);
  } catch {
    summaryError.value = "要約の生成中にエラーが発生しました";
  } finally {
    generatingSummary.value = false;
  }
};

const goBack = function goBack(): void {
  if (article.value) {
    startTransition({
      id: article.value.id,
      ogImageUrl: article.value.ogImageUrl,
      source: article.value.source,
      title: article.value.title,
    });
  }
  if (history.state?.back === "/") {
    router.go(HISTORY_BACK_STEPS);
  } else {
    router.push("/");
  }
};

const confirmDelete = function confirmDelete(): void {
  showDeleteConfirm.value = true;
};

const cancelDelete = function cancelDelete(): void {
  showDeleteConfirm.value = false;
};

const deleteArticle = async function deleteArticle(): Promise<void> {
  if (!article.value || deleting.value) {
    return;
  }
  deleting.value = true;
  try {
    const res = await api.api.articles[":id"].$delete({ param: { id: articleId.value } });
    if (res.ok) {
      router.push("/");
    }
  } catch {
    // エラー時は何もしない
  } finally {
    deleting.value = false;
    showDeleteConfirm.value = false;
  }
};

onMounted(() => {
  fetchArticle();
  fetchAllTags();
});
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- ローディング（遷移データあり: プレビュー表示） -->
    <div v-if="loading && transitionArticle" class="space-y-5 py-8">
      <div class="skeleton h-5 w-24" />
      <div class="card-base overflow-hidden">
        <img
          v-if="transitionArticle.ogImageUrl"
          :src="transitionArticle.ogImageUrl"
          :alt="transitionArticle.title"
          class="w-full max-h-72 object-contain bg-black/20 rounded-t-xl"
          style="view-transition-name: article-image"
        />
        <div class="p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <h1
                class="text-foreground font-semibold text-base font-body"
                style="view-transition-name: article-title"
              >
                {{ transitionArticle.title }}
              </h1>
              <div class="skeleton h-3 w-1/3 rounded mt-1" />
            </div>
            <span class="flex-shrink-0 mt-1.5">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-muted/30" />
            </span>
          </div>
          <div
            class="mt-3 flex flex-wrap items-center gap-2"
            style="view-transition-name: article-meta"
          >
            <span
              class="badge-base px-2 py-0.5 text-xs font-medium rounded-full"
              :class="sourceBadgeStyles[transitionArticle.source]"
            >
              {{ sourceLabels[transitionArticle.source] }}
            </span>
            <div class="skeleton h-5 w-20 rounded-full ml-auto" />
          </div>
          <div class="mt-5 pt-4 border-t border-border/50">
            <div class="skeleton h-4 w-1/2" />
            <div class="skeleton h-16 w-full mt-4" />
          </div>
        </div>
      </div>
      <div class="card-base p-5">
        <div class="skeleton h-4 w-20 mb-3" />
        <div class="skeleton h-10 w-full" />
      </div>
    </div>

    <!-- ローディング（遷移データなし: スケルトン） -->
    <div v-else-if="loading" class="space-y-5 py-8">
      <div class="skeleton h-5 w-24" />
      <div class="card-base overflow-hidden">
        <div class="skeleton h-52 rounded-none" />
        <div class="p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1 space-y-1">
              <div class="skeleton h-5 w-3/4 rounded" />
              <div class="skeleton h-3 w-1/3 rounded" />
            </div>
            <span class="flex-shrink-0 mt-1.5">
              <div class="skeleton w-2.5 h-2.5 rounded-full" />
            </span>
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <div class="skeleton h-5 w-16 rounded-full" />
            <div class="skeleton h-5 w-12 rounded-full" />
            <div class="skeleton h-5 w-20 rounded-full ml-auto" />
          </div>
          <div class="mt-5 pt-4 border-t border-border/50">
            <div class="skeleton h-4 w-1/2" />
            <div class="skeleton h-16 w-full mt-4" />
          </div>
        </div>
      </div>
      <div class="card-base p-5">
        <div class="skeleton h-4 w-20 mb-3" />
        <div class="skeleton h-10 w-full" />
      </div>
    </div>

    <!-- エラー -->
    <div v-else-if="error" class="py-20 text-center">
      <div class="text-error text-base font-body mb-4">{{ error }}</div>
      <button class="btn-ghost" @click="goBack">一覧に戻る</button>
    </div>

    <!-- 記事詳細 -->
    <div v-else-if="article">
      <!-- 戻るリンク -->
      <button
        class="mb-6 text-sm text-muted hover:text-foreground transition-colors duration-200 font-body inline-flex items-center gap-1.5"
        @click="goBack"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        一覧に戻る
      </button>

      <!-- メインカード -->
      <div class="card-base overflow-hidden">
        <img
          v-if="article.ogImageUrl"
          :src="article.ogImageUrl"
          :alt="article.title"
          class="w-full max-h-72 object-contain bg-black/20 rounded-t-xl"
          style="view-transition-name: article-image"
        />

        <div class="p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <h1
                class="text-foreground font-semibold text-base font-body"
                style="view-transition-name: article-title"
              >
                {{ article.title }}
              </h1>
              <span class="mt-1 text-xs text-muted block break-all">
                {{ extractDomain(article.url) }}
              </span>
            </div>
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

          <div
            class="mt-3 flex flex-wrap items-center gap-2"
            style="view-transition-name: article-meta"
          >
            <span
              class="badge-base px-2 py-0.5 text-xs font-medium rounded-full"
              :class="sourceBadgeStyles[article.source]"
            >
              {{ sourceLabels[article.source] }}
            </span>
            <span
              v-for="tag in article.tags"
              :key="tag"
              class="bg-surface-2 text-muted text-xs rounded-full px-2.5 py-0.5"
            >
              {{ tag }}
            </span>
            <span class="text-muted/70 text-xs ml-auto font-body">
              {{ formatRelativeDate(article.createdAt) }}
            </span>
          </div>

          <div class="mt-5 pt-4 border-t border-border/50">
            <a
              :href="article.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-sm text-info break-all hover:underline font-body"
            >
              {{ article.url }}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="flex-shrink-0"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            <p
              v-if="article.description"
              class="mt-4 text-sm leading-relaxed text-foreground/70 font-body"
            >
              {{ article.description }}
            </p>
            <div class="mt-4 flex gap-6 text-xs text-muted/60 font-body">
              <span>作成: {{ formatDate(article.createdAt) }}</span>
              <span>更新: {{ formatDate(article.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI要約 -->
      <div class="card-base p-5 mt-5">
        <div class="mb-3 flex items-center justify-between">
          <span class="section-title">AI要約</span>
          <button
            v-if="!article.aiSummary"
            :disabled="generatingSummary"
            class="text-sm text-accent hover:underline font-body"
            @click="generateSummary"
          >
            {{ generatingSummary ? "生成中..." : "要約を生成" }}
          </button>
          <button
            v-else
            :disabled="generatingSummary"
            class="text-sm text-muted hover:underline font-body"
            @click="generateSummary"
          >
            {{ generatingSummary ? "再生成中..." : "再生成" }}
          </button>
        </div>
        <div
          v-if="generatingSummary && !article.aiSummary"
          class="flex items-center gap-2 text-sm text-muted font-body"
        >
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
          AIが記事を要約しています...
        </div>
        <p
          v-else-if="article.aiSummary"
          class="whitespace-pre-wrap text-sm text-foreground/80 font-body leading-relaxed"
        >
          {{ article.aiSummary }}
        </p>
        <p v-else-if="summaryError" class="text-sm text-error font-body">
          {{ summaryError }}
        </p>
        <p v-else class="text-sm text-muted/50 font-body">
          ボタンを押すとAIが記事の内容を要約します
        </p>
      </div>

      <!-- 既読/未読トグル -->
      <div class="card-base p-5 mt-5">
        <div class="flex items-center justify-between">
          <span class="section-title">閲覧状態</span>
          <button
            :disabled="togglingRead"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-property-[color,background-color,border-color] duration-200 font-body disabled:opacity-50"
            :class="
              article.isRead
                ? 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20'
                : 'bg-success/10 text-success border border-success/20 hover:bg-success/20'
            "
            @click="toggleRead"
          >
            {{ togglingRead ? "更新中..." : article.isRead ? "未読にする" : "既読にする" }}
          </button>
        </div>
      </div>

      <!-- メモ -->
      <div class="card-base p-5 mt-5">
        <div class="mb-3 flex items-center justify-between">
          <span class="section-title">メモ</span>
          <button
            v-if="!isEditingMemo"
            class="text-sm text-accent hover:underline font-body"
            @click="startEditMemo"
          >
            編集
          </button>
        </div>
        <div v-if="!isEditingMemo">
          <p
            v-if="article.memo"
            class="whitespace-pre-wrap text-sm text-foreground/80 font-body leading-relaxed"
          >
            {{ article.memo }}
          </p>
          <p v-else class="text-sm text-muted/50 font-body">メモはありません</p>
        </div>
        <div v-else>
          <textarea
            v-model="editMemo"
            rows="4"
            class="input-base resize-none"
            placeholder="メモを入力..."
          />
          <div class="mt-3 flex gap-2">
            <button :disabled="savingMemo" class="btn-primary text-sm px-4 py-2" @click="saveMemo">
              {{ savingMemo ? "保存中..." : "保存" }}
            </button>
            <button :disabled="savingMemo" class="btn-ghost text-sm" @click="cancelEditMemo">
              キャンセル
            </button>
          </div>
        </div>
      </div>

      <!-- タグ管理 -->
      <div class="card-base p-5 mt-5">
        <span class="section-title mb-3 block">タグ</span>
        <div class="mb-4 flex flex-wrap gap-2">
          <span
            v-for="tag in article.tags"
            :key="tag"
            class="inline-flex items-center gap-1.5 rounded-full bg-purple/15 px-3 py-1 text-sm text-purple font-body"
          >
            {{ tag }}
            <button
              :disabled="savingTags"
              class="text-purple/50 hover:text-purple transition-colors"
              @click="removeTag(tag)"
            >
              &times;
            </button>
          </span>
          <span v-if="article.tags.length === 0" class="text-sm text-muted/50 font-body">
            タグはありません
          </span>
        </div>
        <div class="flex gap-2">
          <input
            v-model="newTag"
            type="text"
            list="tag-suggestions"
            class="input-base flex-1"
            placeholder="新しいタグを追加..."
            @keydown.enter="addTag"
          />
          <datalist id="tag-suggestions">
            <option v-for="t in allTags" :key="t" :value="t" />
          </datalist>
          <button
            :disabled="savingTags || !newTag.trim()"
            class="btn-primary text-sm px-4 py-2"
            @click="addTag"
          >
            追加
          </button>
        </div>
      </div>

      <!-- 削除 -->
      <div class="card-base border-error/20 p-5 mt-5">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm font-medium text-error font-body">記事を削除</span>
            <p class="text-xs text-muted/60 font-body mt-0.5">この操作は取り消せません。</p>
          </div>
          <button
            v-if="!showDeleteConfirm"
            :disabled="deleting"
            class="bg-error/10 text-error border border-error/20 hover:bg-error/20 px-4 py-2 text-sm rounded-lg font-medium transition-property-[color,background-color,border-color] duration-200 font-body disabled:opacity-50"
            @click="confirmDelete"
          >
            削除
          </button>
          <div v-else class="flex gap-2">
            <button
              :disabled="deleting"
              class="bg-error text-white px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-50"
              @click="deleteArticle"
            >
              {{ deleting ? "削除中..." : "本当に削除" }}
            </button>
            <button :disabled="deleting" class="btn-ghost text-sm" @click="cancelDelete">
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
