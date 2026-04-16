import { createBrandedIdVO } from "../shared/branded-id.js";
import type { z } from "zod";

const HighlightIdVO = createBrandedIdVO({
  brand: "HighlightId",
  invalidError: (message) => ({ message, type: "INVALID_HIGHLIGHT_ID" }),
});

type HighlightId = z.infer<typeof HighlightIdVO.schema>;

export { HighlightIdVO };
export type { HighlightId };
