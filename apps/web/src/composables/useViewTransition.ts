import { ref } from "vue";

export interface TransitionArticle {
  id: string;
  title: string;
  ogImageUrl: string | null;
  source: string;
}

const transitioningArticleId = ref<string | null>(null);
const transitionArticle = ref<TransitionArticle | null>(null);
let savedScrollY = 0;

export function useViewTransition() {
  function startTransition(article: TransitionArticle) {
    transitioningArticleId.value = article.id;
    transitionArticle.value = article;
  }

  function saveScrollY(y: number) {
    savedScrollY = y;
  }

  function clearTransition() {
    transitioningArticleId.value = null;
    transitionArticle.value = null;
  }

  function getSavedScrollY(): number {
    return savedScrollY;
  }

  function restoreScroll() {
    window.scrollTo(0, savedScrollY);
  }

  function resetSavedScrollY() {
    savedScrollY = 0;
  }

  return {
    transitioningArticleId,
    transitionArticle,
    startTransition,
    clearTransition,
    saveScrollY,
    getSavedScrollY,
    restoreScroll,
    resetSavedScrollY,
  };
}
