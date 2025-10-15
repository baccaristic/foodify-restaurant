let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenManager = {
  getAccessToken(): string | null {
    return accessToken;
  },

  getRefreshToken(): string | null {
    return refreshToken;
  },

  setTokens(tokens: { accessToken: string; refreshToken: string }): void {
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
  },

  setAccessToken(token: string | null): void {
    accessToken = token;
  },

  clear(): void {
    accessToken = null;
    refreshToken = null;
  },
};
