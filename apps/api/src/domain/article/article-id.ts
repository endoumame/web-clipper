import { createBrandedId } from "../shared/branded-id.js";
import type { z } from "zod";

const ArticleId = createBrandedId({
  brand: "ArticleId",
  invalidError: (message) => ({ message, type: "INVALID_ARTICLE_ID" }),
});

type ArticleId = z.infer<typeof ArticleId.schema>;

export { ArticleId };
