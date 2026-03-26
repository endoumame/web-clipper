import { z } from "zod";

const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export { ErrorResponseSchema };
export type { ErrorResponse };
