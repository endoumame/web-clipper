<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApi } from "@/composables/useApi";
import { useViewTransition } from "@/composables/useViewTransition";
import type { Article } from "@/types/article";

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

const sourceBadgeStyles: Record<string, string> = {
  twitter: "bg-info/15 text-info",
  qiita: "bg-success/15 text-success",
  zenn: "bg-purple/15 text-purple",
  hatena: "bg-error/15 text-error",
  github: "bg-foreground/15 text-foreground",
  classmethod: "bg-warning/15 text-warning",
  medium: "bg-foreground/15 text-foreground",
  note: "bg-success/15 text-success",
  devto: "bg-foreground/15 text-foreground",
  stackoverflow: "bg-warning/15 text-warning",
  other: "bg-muted/15 text-muted",
};

const sourceLabels: Record<string, string> = {
  twitter: "Twitter",
  qiita: "Qiita",
  zenn: "Zenn",
  hatena: "はてな",
  github: "GitHub",
  classmethod: "DevelopersIO",
  medium: "Medium",
  note: "note",
  devto: "DEV",
  stackoverflow: "Stack Overflow",
  other: "その他",
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function formatRelativeDate(dateStr: string): string {
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("ja-JP");
}

async function fetchArticle() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.api.articles[":id"].$get({ param: { id: articleId.value } });
    if (!res.ok) {
      if (res.status === 404) {
        error.value = "記事が見つかりませんでした。";
        return;
      }
      error.value = "記事の取得に失敗しました。";
      return;
    }
    article.value = (await res.json()) as Article;
  } catch {
    error.value = "記事の取得中にエラーが発生しました。";
  } finally {
    loading.value = false;
  }
}

async function fetchAllTags() {
  try {
    const res = await api.api.tags.$get();
    if (res.ok) {
      const data = await res.json();
      allTags.value = data.tags.map((t) => t.name);
    }
  } catch {
    // タグ取得失敗は無視
  }
}

async function toggleRead() {
  if (!article.value || togglingRead.value) return;
  togglingRead.value = true;
  try {
    const newIsRead = !article.value.isRead;
    const res = await api.api.articles[":id"].$put({
      param: { id: articleId.value },
      json: { isRead: newIsRead },
    });
    if (res.ok) {
      article.value.isRead = newIsRead;
    }
  } catch {
    // エラー時は何もしない
  } finally {
    togglingRead.value = false;
  }
}

function startEditMemo() {
  editMemo.value = article.value?.memo ?? "";
  isEditingMemo.value = true;
}

function cancelEditMemo() {
  isEditingMemo.value = false;
}

async function saveMemo() {
  if (!article.value || savingMemo.value) return;
  savingMemo.value = true;
  try {
    const memoValue = editMemo.value.trim() || null;
    const res = await api.api.articles[":id"].$put({
      param: { id: articleId.value },
      json: { memo: memoValue },
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
}

async function removeTag(tag: string) {
  if (!article.value || savingTags.value) return;
  savingTags.value = true;
  try {
    const newTags = article.value.tags.filter((t) => t !== tag);
    const res = await api.api.articles[":id"].$put({
      param: { id: articleId.value },
      json: { tags: newTags },
    });
    if (res.ok) {
      article.value.tags = newTags;
    }
  } catch {
    // エラー時は何もしない
  } finally {
    savingTags.value = false;
  }
}

async function addTag() {
  if (!article.value || savingTags.value) return;
  const tag = newTag.value.trim();
  if (!tag || article.value.tags.includes(tag)) {
    newTag.value = "";
    return;
  }
  savingTags.value = true;
  try {
    const newTags = [...article.value.tags, tag];
    const res = await api.api.articles[":id"].$put({
      param: { id: articleId.value },
      json: { tags: newTags },
    });
    if (res.ok) {
      article.value.tags = newTags;
      newTag.value = "";
    }
  } catch {
    // エラー時は何もしない
  } finally {
    savingTags.value = false;
  }
}

async function generateSummary() {
  if (!article.value || generatingSummary.value) return;
  generatingSummary.value = true;
  summaryError.value = null;
  try {
    const res = await api.api.articles[":id"].summary.$post({
      param: { id: articleId.value },
    });
    if (res.ok) {
      const data = await res.json();
      article.value = data as Article;
    } else {
      const body = await res.json().catch(() => null);
      summaryError.value =
        body && typeof body === "object" && "message" in body
          ? String((body as { message: string }).message)
          : "要約の生成に失敗しました";
    }
  } catch {
    summaryError.value = "要約の生成中にエラーが発生しました";
  } finally {
    generatingSummary.value = false;
  }
}

function goBack() {
  if (article.value) {
    startTransition({
      id: article.value.id,
      title: article.value.title,
      ogImageUrl: article.value.ogImageUrl,
      source: article.value.source,
    });
  }
  // history.state.back が '/' の場合はブラウザバックを使用してスクロール位置を復元する。
  // router.push('/') だと savedPosition が null になり scrollBehavior でスクロール復元できないため。
  // 直接 URL アクセス時など back が '/' でない場合は push にフォールバックする。
  if (history.state?.back === "/") {
    router.go(-1);
  } else {
    router.push("/");
  }
}

async function deleteArticle() {
  if (!article.value || deleting.value) return;
  if (!window.confirm("この記事を削除しますか？")) return;
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
  }
}

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
          <!-- 一覧カードと同じレイアウト -->
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
          <!-- 詳細部分のスケルトン -->
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
        <!-- OG画像 -->
        <img
          v-if="article.ogImageUrl"
          :src="article.ogImageUrl"
          :alt="article.title"
          class="w-full max-h-72 object-contain bg-black/20 rounded-t-xl"
          style="view-transition-name: article-image"
        />

        <div class="p-5">
          <!-- 上部: 一覧カードと同じレイアウト -->
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <!-- タイトル -->
              <h1
                class="text-foreground font-semibold text-base font-body"
                style="view-transition-name: article-title"
              >
                {{ article.title }}
              </h1>

              <!-- ドメインURL -->
              <span class="mt-1 text-xs text-muted block break-all">
                {{ extractDomain(article.url) }}
              </span>
            </div>

            <!-- 既読/未読インジケータ -->
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

          <!-- メタ情報 -->
          <div
            class="mt-3 flex flex-wrap items-center gap-2"
            style="view-transition-name: article-meta"
          >
            <!-- ソースバッジ -->
            <span
              class="badge-base px-2 py-0.5 text-xs font-medium rounded-full"
              :class="sourceBadgeStyles[article.source]"
            >
              {{ sourceLabels[article.source] }}
            </span>

            <!-- タグ -->
            <span
              v-for="tag in article.tags"
              :key="tag"
              class="bg-surface-2 text-muted text-xs rounded-full px-2.5 py-0.5"
            >
              {{ tag }}
            </span>

            <!-- 日付 -->
            <span class="text-muted/70 text-xs ml-auto font-body">
              {{ formatRelativeDate(article.createdAt) }}
            </span>
          </div>

          <!-- 下部: 詳細画面専用の項目 -->
          <div class="mt-5 pt-4 border-t border-border/50">
            <!-- 外部リンク -->
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

            <!-- 説明文 -->
            <p
              v-if="article.description"
              class="mt-4 text-sm leading-relaxed text-foreground/70 font-body"
            >
              {{ article.description }}
            </p>

            <!-- 日時 -->
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

        <!-- 表示モード -->
        <div v-if="!isEditingMemo">
          <p
            v-if="article.memo"
            class="whitespace-pre-wrap text-sm text-foreground/80 font-body leading-relaxed"
          >
            {{ article.memo }}
          </p>
          <p v-else class="text-sm text-muted/50 font-body">メモはありません</p>
        </div>

        <!-- 編集モード -->
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

        <!-- 現在のタグ -->
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

        <!-- タグ追加 -->
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
            :disabled="deleting"
            class="bg-error/10 text-error border border-error/20 hover:bg-error/20 px-4 py-2 text-sm rounded-lg font-medium transition-property-[color,background-color,border-color] duration-200 font-body disabled:opacity-50"
            @click="deleteArticle"
          >
            {{ deleting ? "削除中..." : "削除" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
