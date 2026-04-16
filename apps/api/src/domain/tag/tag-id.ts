import { createBrandedId } from "../shared/branded-id.js";
import type { z } from "zod";

const TagId = createBrandedId({
  brand: "TagId",
  invalidError: (message) => ({ message, type: "INVALID_TAG_ID" }),
});

type TagId = z.infer<typeof TagId.schema>;

export { TagId };
