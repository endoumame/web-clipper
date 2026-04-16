import { createBrandedIdVO } from "../shared/branded-id.js";
import type { z } from "zod";

const TagIdVO = createBrandedIdVO({
  brand: "TagId",
  invalidError: (message) => ({ message, type: "INVALID_TAG_ID" }),
});

type TagId = z.infer<typeof TagIdVO.schema>;

export { TagIdVO };
export type { TagId };
