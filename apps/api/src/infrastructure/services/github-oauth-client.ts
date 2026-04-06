import type { DomainError } from "../../domain/shared/index.js";
import { ResultAsync } from "neverthrow";

interface GitHubUser {
  readonly id: number;
  readonly login: string;
}

interface GitHubOAuthClient {
  readonly exchangeCode: (code: string, redirectUri: string) => ResultAsync<string, DomainError>;
  readonly fetchUser: (accessToken: string) => ResultAsync<GitHubUser, DomainError>;
}

const toOAuthError = (error: unknown, message: string): DomainError => ({
  message: error instanceof Error ? error.message : message,
  type: "OAUTH_ERROR",
});

const createGitHubOAuthClient = (clientId: string, clientSecret: string): GitHubOAuthClient => ({
  exchangeCode: (code: string, redirectUri: string): ResultAsync<string, DomainError> =>
    ResultAsync.fromPromise(
      fetch("https://github.com/login/oauth/access_token", {
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }).then(async (res: Response): Promise<string> => {
        const data: { access_token?: string; error?: string } = await res.json();
        if (typeof data.access_token !== "string" || data.access_token === "") {
          throw new Error(data.error ?? "Failed to get access token");
        }
        return data.access_token;
      }),
      (error: unknown): DomainError => toOAuthError(error, "Failed to get access token"),
    ),

  fetchUser: (accessToken: string): ResultAsync<GitHubUser, DomainError> =>
    ResultAsync.fromPromise(
      fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "web-clipper",
        },
      }).then(async (res: Response): Promise<GitHubUser> => {
        const user: GitHubUser = await res.json();
        if (!user.id) {
          throw new Error("Failed to get GitHub user info");
        }
        return user;
      }),
      (error: unknown): DomainError => toOAuthError(error, "Failed to get GitHub user info"),
    ),
});

export type { GitHubOAuthClient, GitHubUser };
export { createGitHubOAuthClient };
