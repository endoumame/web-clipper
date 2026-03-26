interface GitHubUser {
  readonly id: number;
  readonly login: string;
}

interface GitHubOAuthClient {
  readonly exchangeCode: (code: string, redirectUri: string) => Promise<string>;
  readonly fetchUser: (accessToken: string) => Promise<GitHubUser>;
}

const createGitHubOAuthClient = (clientId: string, clientSecret: string): GitHubOAuthClient => ({
  exchangeCode: async (code: string, redirectUri: string): Promise<string> => {
    const res = await fetch("https://github.com/login/oauth/access_token", {
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
    });

    const data: { access_token?: string; error?: string } = await res.json();
    if (typeof data.access_token !== "string" || data.access_token === "") {
      throw new Error(data.error ?? "Failed to get access token");
    }
    return data.access_token;
  },

  fetchUser: async (accessToken: string): Promise<GitHubUser> => {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "web-clipper",
      },
    });

    const user: GitHubUser = await res.json();
    if (!user.id) {
      throw new Error("Failed to get GitHub user info");
    }
    return user;
  },
});

export type { GitHubOAuthClient, GitHubUser };
export { createGitHubOAuthClient };
