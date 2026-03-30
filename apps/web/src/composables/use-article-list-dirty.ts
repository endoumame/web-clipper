import { ref } from "vue";

const dirty = ref(false);

interface UseArticleListDirtyReturn {
  isDirty: () => boolean;
  markDirty: () => void;
}

const useArticleListDirty = (): UseArticleListDirtyReturn => {
  const markDirty = (): void => {
    dirty.value = true;
  };

  const isDirty = (): boolean => {
    if (dirty.value) {
      dirty.value = false;
      return true;
    }
    return false;
  };

  return { isDirty, markDirty };
};

export { useArticleListDirty };
