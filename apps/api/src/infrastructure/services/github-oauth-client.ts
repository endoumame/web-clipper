export type GitHubUser = {
  readonly id: number;
  readonly login: string;
};

export type GitHubOAuthClient = {
  readonly exchangeCode: (code: string, redirectUri: string) => Promise<string>;
  readonly fetchUser: (accessToken: string) => Promise<GitHubUser>;
};

export const createGitHubOAuthClient = (
  clientId: string,
  clientSecret: string,
): GitHubOAuthClient => ({
  exchangeCode: async (code, redirectUri) => {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data: { access_token?: string; error?: string } = await res.json();
    if (!data.access_token) {
      throw new Error(data.error ?? "Failed to get access token");
    }
    return data.access_token;
  },

  fetchUser: async (accessToken) => {
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
