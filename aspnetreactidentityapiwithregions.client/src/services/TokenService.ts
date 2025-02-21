import { createLogger } from "../utils/logger";

const logger = createLogger("token-service");
const REFRESH_TOKEN_KEY = "refresh_token";

export class TokenService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setTokens(
    accessToken: string,
    refreshToken: string,
    remember: boolean = false
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (remember) {
      logger.debug("Storing refresh token in localStorage");
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  hasRefreshToken(): boolean {
    return !!this.refreshToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  updateRefreshToken(newRefreshToken: string) {
    this.refreshToken = newRefreshToken;
    if (localStorage.getItem(REFRESH_TOKEN_KEY)) {
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    }
  }
}
