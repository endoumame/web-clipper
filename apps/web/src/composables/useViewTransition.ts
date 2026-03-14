import { ref } from "vue";

const transitioningArticleId = ref<string | null>(null);

export function useViewTransition() {
  function startTransition(articleId: string) {
    transitioningArticleId.value = articleId;
  }

  function clearTransition() {
    transitioningArticleId.value = null;
  }

  return {
    transitioningArticleId,
    startTransition,
    clearTransition,
  };
}
