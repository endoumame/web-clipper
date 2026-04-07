import { computed, ref } from "vue";
import type { Highlight } from "@/types/article";
import type { Ref } from "vue";
import type { SelectionData } from "@/composables/use-text-selection";
import { marked } from "marked";
import { useTextSelection } from "@/composables/use-text-selection";

// eslint-disable-next-line -- inline import needed for type inference
// oxlint-disable-next-line typescript/consistent-type-imports
type ApiClient = ReturnType<typeof import("@/composables/use-api").useApi>;

const HIGHLIGHT_COLORS = ["yellow", "green", "blue", "pink", "orange"] as const;

interface HighlightActions {
  fetchHighlights: () => Promise<void>;
  saveHighlight: () => Promise<void>;
  removeHighlight: (highlightId: string) => Promise<void>;
}

interface HighlightState {
  highlights: Ref<Highlight[]>;
  savingHighlight: Ref<boolean>;
  highlightNote: Ref<string>;
  highlightColor: Ref<string>;
  selection: Ref<SelectionData | null>;
  clearSelection: () => void;
}

const fetchFromApi = async (api: ApiClient, id: string): Promise<Highlight[]> => {
  const res = await api.api.articles[":id"].highlights.$get({ param: { id } });
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return data.highlights as Highlight[];
};

interface HighlightPayload {
  highlightedText: string;
  startOffset: number;
  endOffset: number;
  prefixContext?: string;
  suffixContext?: string;
  color?: string;
  note?: string | null;
}

interface CreateHighlightParams {
  api: ApiClient;
  id: string;
  payload: HighlightPayload;
}

const createOnApi = async (params: CreateHighlightParams): Promise<Highlight | null> => {
  const res = await params.api.api.articles[":id"].highlights.$post({
    json: params.payload,
    param: { id: params.id },
  });
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as Highlight;
};

const deleteOnApi = async (api: ApiClient, id: string, highlightId: string): Promise<boolean> => {
  const res = await api.api.articles[":id"].highlights[":highlightId"].$delete({
    param: { highlightId, id },
  });
  return res.ok;
};

const DEFAULT_OFFSET = 0;

const buildPayload = (state: HighlightState): HighlightPayload => {
  const sel = state.selection.value;
  return {
    color: state.highlightColor.value,
    endOffset: sel?.endOffset ?? DEFAULT_OFFSET,
    highlightedText: sel?.text ?? "",
    note: state.highlightNote.value.trim() || null,
    prefixContext: sel?.prefixContext ?? "",
    startOffset: sel?.startOffset ?? DEFAULT_OFFSET,
    suffixContext: sel?.suffixContext ?? "",
  };
};

const createSaveAction =
  (articleId: Ref<string>, api: ApiClient, state: HighlightState): (() => Promise<void>) =>
  async (): Promise<void> => {
    if (!state.selection.value || state.savingHighlight.value) {
      return;
    }
    state.savingHighlight.value = true;
    try {
      const hl = await createOnApi({ api, id: articleId.value, payload: buildPayload(state) });
      if (hl) {
        state.highlights.value.push(hl);
        state.highlightNote.value = "";
        state.clearSelection();
      }
    } catch {
      /* Ignore */
    } finally {
      state.savingHighlight.value = false;
    }
  };

const createActions = (
  articleId: Ref<string>,
  api: ApiClient,
  state: HighlightState,
): HighlightActions => ({
  fetchHighlights: async (): Promise<void> => {
    try {
      state.highlights.value = await fetchFromApi(api, articleId.value);
    } catch {
      /* Ignore */
    }
  },
  removeHighlight: async (hlId: string): Promise<void> => {
    try {
      if (await deleteOnApi(api, articleId.value, hlId)) {
        state.highlights.value = state.highlights.value.filter((hl) => hl.id !== hlId);
      }
    } catch {
      /* Ignore */
    }
  },
  saveHighlight: createSaveAction(articleId, api, state),
});

interface UseHighlightsReturn extends HighlightActions {
  highlights: Ref<Highlight[]>;
  contentRef: Ref<HTMLElement | null>;
  selection: Ref<SelectionData | null>;
  clearSelection: () => void;
  savingHighlight: Ref<boolean>;
  highlightNote: Ref<string>;
  highlightColor: Ref<string>;
  highlightColors: typeof HIGHLIGHT_COLORS;
  renderedContent: Ref<string | null>;
}

const useHighlights = (
  articleId: Ref<string>,
  markdownContent: Ref<string | null>,
  api: ApiClient,
): UseHighlightsReturn => {
  const highlights = ref<Highlight[]>([]);
  const contentRef = ref<HTMLElement | null>(null);
  const { selection, clearSelection } = useTextSelection(contentRef, markdownContent);
  const savingHighlight = ref(false);
  const highlightNote = ref("");
  const highlightColor = ref("yellow");
  const renderedContent = computed(() =>
    markdownContent.value === null ? null : marked.parse(markdownContent.value, { async: false }),
  );
  const state: HighlightState = {
    clearSelection,
    highlightColor,
    highlightNote,
    highlights,
    savingHighlight,
    selection,
  };
  const actions = createActions(articleId, api, state);

  return {
    ...state,
    ...actions,
    contentRef,
    highlightColors: HIGHLIGHT_COLORS,
    renderedContent,
  };
};

export { useHighlights };
