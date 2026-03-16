<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useApi } from "@/composables/useApi";

const router = useRouter();
const route = useRoute();
const api = useApi();

// Form state
const url = ref("");
const tags = ref<string[]>([]);
const tagInput = ref("");
const memo = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");

// Existing tags from API
const existingTags = ref<Array<{ id: string; name: string; articleCount: number }>>([]);
const showTagDropdown = ref(false);

// URL validation
const urlError = computed(() => {
  if (!url.value) return "";
  return URL.canParse(url.value) ? "" : "有効なURLを入力してください";
});

const isFormValid = computed(() => {
  return url.value.trim() !== "" && urlError.value === "";
});

// Filtered tags for dropdown (exclude already selected)
const filteredTags = computed(() => {
  const input = tagInput.value.toLowerCase();
  return existingTags.value
    .filter((t) => !tags.value.includes(t.name))
    .filter((t) => (input ? t.name.toLowerCase().includes(input) : true));
});

// Fetch existing tags
onMounted(async () => {
  // Share Target: read query parameters
  const sharedUrl = route.query.url as string | undefined;
  const sharedText = route.query.text as string | undefined;
  const sharedTitle = route.query.title as string | undefined;

  if (sharedUrl) {
    url.value = sharedUrl;
  } else if (sharedText) {
    const extracted = sharedText.match(/https?:\/\/\S+/);
    if (extracted) {
      url.value = extracted[0];
    }
  }

  if (sharedTitle) {
    memo.value = sharedTitle;
  }

  // Clean up query string
  if (route.query.url || route.query.text || route.query.title) {
    router.replace({ path: route.path });
  }

  try {
    const res = await api.api.tags.$get();
    const data = await res.json();
    existingTags.value = data.tags;
  } catch {
    // Silently fail - tags dropdown will just be empty
  }
});

function addTag(tagName: string) {
  const trimmed = tagName.trim();
  if (trimmed && !tags.value.includes(trimmed)) {
    tags.value.push(trimmed);
  }
  tagInput.value = "";
  showTagDropdown.value = false;
}

function removeTag(tagName: string) {
  tags.value = tags.value.filter((t) => t !== tagName);
}

function handleTagKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    const value = tagInput.value.replace(/,/g, "").trim();
    if (value) {
      addTag(value);
    }
  }
}

function handleTagInputFocus() {
  showTagDropdown.value = true;
}

function handleTagInputBlur() {
  // Delay to allow click on dropdown item
  setTimeout(() => {
    showTagDropdown.value = false;
  }, 200);
}

async function handleSubmit() {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    const res = await api.api.articles.$post({
      json: {
        url: url.value,
        tags: tags.value.length > 0 ? tags.value : [],
        memo: memo.value || undefined,
      },
    });

    if (!res.ok) {
      const errorData = (await res.json()) as { error: string; message: string };
      errorMessage.value = errorData.message;
      return;
    }

    router.push("/");
  } catch {
    errorMessage.value = "記事の追加に失敗しました。もう一度お試しください。";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <h2 class="font-display text-2xl font-bold text-foreground mb-8">記事を追加</h2>

    <!-- Error message -->
    <div
      v-if="errorMessage"
      class="mb-4 rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error font-body"
    >
      {{ errorMessage }}
    </div>

    <form class="card-base p-6 space-y-6" @submit.prevent="handleSubmit">
      <!-- URL input -->
      <div>
        <label for="url" class="text-sm font-medium text-muted font-body mb-2 block">URL</label>
        <input
          id="url"
          v-model="url"
          type="url"
          placeholder="https://example.com/article"
          required
          class="input-base"
          :class="{ 'border-error': urlError }"
        />
        <p v-if="urlError" class="text-error text-sm mt-1">{{ urlError }}</p>
      </div>

      <!-- Tags input -->
      <div>
        <label for="tag-input" class="text-sm font-medium text-muted font-body mb-2 block"
          >タグ</label
        >

        <!-- Selected tags -->
        <div v-if="tags.length > 0" class="mb-2 flex flex-wrap gap-2">
          <span
            v-for="tag in tags"
            :key="tag"
            class="bg-accent/15 text-accent text-sm rounded-full px-3 py-1 inline-flex items-center gap-1"
          >
            {{ tag }}
            <button type="button" class="text-accent/60 hover:text-accent" @click="removeTag(tag)">
              &times;
            </button>
          </span>
        </div>

        <!-- Tag input with dropdown -->
        <div class="relative">
          <input
            id="tag-input"
            v-model="tagInput"
            type="text"
            placeholder="タグを入力（Enterまたはカンマで追加）"
            class="input-base"
            @keydown="handleTagKeydown"
            @focus="handleTagInputFocus"
            @blur="handleTagInputBlur"
          />

          <!-- Dropdown -->
          <ul
            v-if="showTagDropdown && filteredTags.length > 0"
            class="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-surface-2 py-1 shadow-xl shadow-black/20"
          >
            <li
              v-for="tag in filteredTags"
              :key="tag.id"
              class="px-4 py-2.5 text-sm text-foreground hover:bg-surface-3 cursor-pointer transition-colors"
              @mousedown.prevent="addTag(tag.name)"
            >
              {{ tag.name }}
              <span class="text-muted">({{ tag.articleCount }})</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Memo input -->
      <div>
        <label for="memo" class="text-sm font-medium text-muted font-body mb-2 block">メモ</label>
        <textarea
          id="memo"
          v-model="memo"
          rows="4"
          placeholder="メモを入力"
          class="input-base resize-none"
        />
      </div>

      <!-- Submit button -->
      <div>
        <button type="submit" :disabled="!isFormValid || isSubmitting" class="btn-primary w-full">
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
            送信中...
          </span>
          <span v-else>記事を追加</span>
        </button>
      </div>
    </form>
  </div>
</template>
