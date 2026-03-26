import type { Ref } from "vue";
import { ref } from "vue";

interface TransitionArticle {
  id: string;
  ogImageUrl: string | null;
  source: string;
  title: string;
}

const transitioningArticleId = ref<string | null>(null);
const transitionArticle = ref<TransitionArticle | null>(null);

interface UseViewTransitionReturn {
  clearTransition: () => void;
  startTransition: (article: TransitionArticle) => void;
  transitionArticle: Ref<TransitionArticle | null>;
  transitioningArticleId: Ref<string | null>;
}

const useViewTransition = (): UseViewTransitionReturn => {
  const startTransition = (article: TransitionArticle): void => {
    transitioningArticleId.value = article.id;
    transitionArticle.value = article;
  };

  const clearTransition = (): void => {
    transitioningArticleId.value = null;
    transitionArticle.value = null;
  };

  return {
    clearTransition,
    startTransition,
    transitionArticle,
    transitioningArticleId,
  };
};

export { useViewTransition };
export type { TransitionArticle };
