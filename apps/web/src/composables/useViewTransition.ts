import { ref } from "vue";

export interface TransitionArticle {
  id: string;
  title: string;
  ogImageUrl: string | null;
  source: string;
}

const transitioningArticleId = ref<string | null>(null);
const transitionArticle = ref<TransitionArticle | null>(null);

export function useViewTransition() {
  function startTransition(article: TransitionArticle) {
    transitioningArticleId.value = article.id;
    transitionArticle.value = article;
  }

  function clearTransition() {
    transitioningArticleId.value = null;
    transitionArticle.value = null;
  }

  return {
    transitioningArticleId,
    transitionArticle,
    startTransition,
    clearTransition,
  };
}
