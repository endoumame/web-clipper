import { createBrandedIdVO } from "../shared/branded-id.js";
import type { z } from "zod";

const ArticleIdVO = createBrandedIdVO({
  brand: "ArticleId",
  invalidError: (message) => ({ message, type: "INVALID_ARTICLE_ID" }),
});

type ArticleId = z.infer<typeof ArticleIdVO.schema>;

export { ArticleIdVO };
export type { ArticleId };
