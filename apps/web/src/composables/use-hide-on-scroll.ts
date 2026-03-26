import { onMounted, onUnmounted, ref } from "vue";
import type { Ref } from "vue";

const DEFAULT_THRESHOLD = 10;
const ZERO = 0;

interface UseHideOnScrollReturn {
  isHidden: Ref<boolean>;
}

const useHideOnScroll = function useHideOnScroll(
  threshold: number = DEFAULT_THRESHOLD,
): UseHideOnScrollReturn {
  const isHidden = ref(false);
  let lastScrollY = ZERO;
  let accumulatedDelta = ZERO;

  const updateVisibility = function updateVisibility(currentY: number): void {
    if (currentY <= ZERO) {
      isHidden.value = false;
    } else if (accumulatedDelta > threshold) {
      isHidden.value = true;
      accumulatedDelta = ZERO;
    } else if (accumulatedDelta < -threshold) {
      isHidden.value = false;
      accumulatedDelta = ZERO;
    }
  };

  const handleScroll = function handleScroll(): void {
    const currentY = globalThis.scrollY;
    const delta = currentY - lastScrollY;

    if (Math.sign(delta) !== Math.sign(accumulatedDelta)) {
      accumulatedDelta = ZERO;
    }
    accumulatedDelta += delta;

    updateVisibility(currentY);

    lastScrollY = currentY;
  };

  onMounted((): void => {
    globalThis.addEventListener("scroll", handleScroll, { passive: true });
  });
  onUnmounted((): void => {
    globalThis.removeEventListener("scroll", handleScroll);
  });

  return { isHidden };
};

export { useHideOnScroll };
