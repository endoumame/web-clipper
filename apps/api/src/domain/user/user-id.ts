import { createBrandedId } from "../shared/branded-id.js";
import type { z } from "zod";

const UserId = createBrandedId({
  brand: "UserId",
  invalidError: (message) => ({ message, type: "INVALID_USER_ID" }),
});

type UserId = z.infer<typeof UserId.schema>;

export { UserId };
