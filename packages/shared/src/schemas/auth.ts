import { z } from "zod";

// SetupInput - for POST /api/auth/setup (first-time user creation)
export const SetupInputSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(128),
});
export type SetupInput = z.infer<typeof SetupInputSchema>;

// LoginInput - for POST /api/auth/login
export const LoginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

// AuthUser - user info returned in responses
export const AuthUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  githubLinked: z.boolean(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

// AuthStatusResponse - for GET /api/auth/me
export const AuthStatusResponseSchema = z.object({
  authenticated: z.boolean(),
  user: AuthUserSchema.nullable(),
  needsSetup: z.boolean(),
});
export type AuthStatusResponse = z.infer<typeof AuthStatusResponseSchema>;

// SetupStatusResponse - for GET /api/auth/status
export const SetupStatusResponseSchema = z.object({
  needsSetup: z.boolean(),
});
export type SetupStatusResponse = z.infer<typeof SetupStatusResponseSchema>;
