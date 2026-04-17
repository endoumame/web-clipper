import { createBrandedId } from "../shared/branded-id.js";
import type { z } from "zod";

const HighlightId = createBrandedId({
  brand: "HighlightId",
  invalidError: (message) => ({ message, type: "INVALID_HIGHLIGHT_ID" }),
});

type HighlightId = z.infer<typeof HighlightId.schema>;

export { HighlightId };
