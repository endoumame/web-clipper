import { z } from "zod";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 50;
const MIN_LOGIN_LENGTH = 1;

// SetupInput - for POST /api/auth/setup (first-time user creation)
const SetupInputSchema = z.object({
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
  username: z.string().min(MIN_USERNAME_LENGTH).max(MAX_USERNAME_LENGTH),
});

type SetupInput = z.infer<typeof SetupInputSchema>;

// LoginInput - for POST /api/auth/login
const LoginInputSchema = z.object({
  password: z.string().min(MIN_LOGIN_LENGTH),
  username: z.string().min(MIN_LOGIN_LENGTH),
});

type LoginInput = z.infer<typeof LoginInputSchema>;

// AuthUser - user info returned in responses
const AuthUserSchema = z.object({
  githubLinked: z.boolean(),
  id: z.string(),
  username: z.string(),
});

type AuthUser = z.infer<typeof AuthUserSchema>;

// AuthStatusResponse - for GET /api/auth/me
const AuthStatusResponseSchema = z.object({
  authenticated: z.boolean(),
  needsSetup: z.boolean(),
  user: AuthUserSchema.nullable(),
});

type AuthStatusResponse = z.infer<typeof AuthStatusResponseSchema>;

// SetupStatusResponse - for GET /api/auth/status
const SetupStatusResponseSchema = z.object({
  needsSetup: z.boolean(),
});

type SetupStatusResponse = z.infer<typeof SetupStatusResponseSchema>;

export {
  AuthStatusResponseSchema,
  AuthUserSchema,
  LoginInputSchema,
  SetupInputSchema,
  SetupStatusResponseSchema,
};
export type { AuthStatusResponse, AuthUser, LoginInput, SetupInput, SetupStatusResponse };
