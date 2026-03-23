import { ref, onMounted, onUnmounted } from "vue";

export function useHideOnScroll(threshold = 10) {
  const isHidden = ref(false);
  let lastScrollY = 0;
  let accumulatedDelta = 0;

  function onScroll() {
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;

    if (Math.sign(delta) !== Math.sign(accumulatedDelta)) {
      accumulatedDelta = 0;
    }
    accumulatedDelta += delta;

    if (accumulatedDelta > threshold) {
      isHidden.value = true;
      accumulatedDelta = 0;
    } else if (accumulatedDelta < -threshold) {
      isHidden.value = false;
      accumulatedDelta = 0;
    }

    if (currentY <= 0) {
      isHidden.value = false;
    }

    lastScrollY = currentY;
  }

  onMounted(() => window.addEventListener("scroll", onScroll, { passive: true }));
  onUnmounted(() => window.removeEventListener("scroll", onScroll));

  return { isHidden };
}
