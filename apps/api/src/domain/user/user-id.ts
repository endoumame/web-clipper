import { createBrandedIdVO } from "../shared/branded-id.js";
import type { z } from "zod";

const UserIdVO = createBrandedIdVO({
  brand: "UserId",
  invalidError: (message) => ({ message, type: "INVALID_USER_ID" }),
});

type UserId = z.infer<typeof UserIdVO.schema>;

export { UserIdVO };
export type { UserId };
