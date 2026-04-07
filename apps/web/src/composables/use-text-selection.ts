import { onUnmounted, ref } from "vue";
import type { Ref } from "vue";

const CONTEXT_LENGTH = 30;
const NOT_FOUND = -1;
const FIRST_RANGE = 0;
const MIN_INDEX = 0;
const EMPTY_COUNT = 0;

interface SelectionData {
  text: string;
  startOffset: number;
  endOffset: number;
  prefixContext: string;
  suffixContext: string;
  rect: DOMRect;
}

interface UseTextSelectionReturn {
  selection: Ref<SelectionData | null>;
  clearSelection: () => void;
}

const getSelectedText = (sel: Selection, container: HTMLElement): string | null => {
  const range = sel.getRangeAt(FIRST_RANGE);
  if (!container.contains(range.commonAncestorContainer)) {
    return null;
  }
  const text = sel.toString().trim();
  return text === "" ? null : text;
};

const buildSelectionData = (
  selectedText: string,
  md: string,
  sel: Selection,
): SelectionData | null => {
  const startIdx = md.indexOf(selectedText);
  if (startIdx === NOT_FOUND) {
    return null;
  }
  const endIdx = startIdx + selectedText.length;
  return {
    endOffset: endIdx,
    prefixContext: md.slice(Math.max(MIN_INDEX, startIdx - CONTEXT_LENGTH), startIdx),
    rect: sel.getRangeAt(FIRST_RANGE).getBoundingClientRect(),
    startOffset: startIdx,
    suffixContext: md.slice(endIdx, Math.min(md.length, endIdx + CONTEXT_LENGTH)),
    text: selectedText,
  };
};

const useTextSelection = (
  contentRef: Ref<HTMLElement | null>,
  markdownContent: Ref<string | null>,
): UseTextSelectionReturn => {
  const selection = ref<SelectionData | null>(null);

  const handleMouseUp = (): void => {
    const sel = globalThis.getSelection();
    if (sel === null || sel.isCollapsed || sel.rangeCount === EMPTY_COUNT) {
      return;
    }
    if (contentRef.value === null || markdownContent.value === null) {
      return;
    }
    const text = getSelectedText(sel, contentRef.value);
    selection.value = text === null ? null : buildSelectionData(text, markdownContent.value, sel);
  };

  const handleMouseDown = (): void => {
    selection.value = null;
  };

  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("mousedown", handleMouseDown);
  onUnmounted(() => {
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("mousedown", handleMouseDown);
  });

  const clearSelection = (): void => {
    selection.value = null;
    globalThis.getSelection()?.removeAllRanges();
  };

  return { clearSelection, selection };
};

export { useTextSelection };
export type { SelectionData };
