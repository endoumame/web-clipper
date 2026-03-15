let savedScrollY = 0;

export function useViewTransition() {
  function saveScrollY(y: number) {
    savedScrollY = y;
  }

  function clearTransition() {
    // no-op: kept for router compatibility
  }

  function restoreScroll() {
    window.scrollTo(0, savedScrollY);
    savedScrollY = 0;
  }

  return {
    saveScrollY,
    clearTransition,
    restoreScroll,
  };
}
