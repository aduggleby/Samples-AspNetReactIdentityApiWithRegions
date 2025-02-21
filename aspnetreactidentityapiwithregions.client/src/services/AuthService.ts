import axios, { InternalAxiosRequestConfig } from "axios";
import { createLogger } from "../utils/logger";
import { CustomAxiosRequestConfig } from "../types/axios";

const IDENTITY_API_URL = "/api/identity/";
const logger = createLogger("auth");

interface Result<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

const REFRESH_TOKEN_KEY = "refresh_token";

let accessToken: string | null = null;
let refreshToken: string | null = localStorage.getItem(REFRESH_TOKEN_KEY);

// Set up an Axios interceptor to add the Authorization header to all requests
axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      logger.debug("Adding authorization header to request");
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    logger.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const AuthService = {
  login: async (
    email: string,
    password: string,
    remember: boolean = false
  ): Promise<Result<any>> => {
    logger.info("Attempting login for user:", email);
    try {
      const response = await axios.post(
        `${IDENTITY_API_URL}login`,
        { email, password },
        { withCredentials: true }
      );

      if (response.data) {
        if (response.data.accessToken) {
          logger.debug("Received access token");
          accessToken = response.data.accessToken;
        }

        if (response.data.refreshToken) {
          if (remember) {
            logger.debug("Storing refresh token (remember me enabled)");
            refreshToken = response.data.refreshToken;
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          } else {
            // Keep refresh token in memory only
            logger.debug("Storing refresh token in memory only");
            refreshToken = response.data.refreshToken;
          }
        }

        logger.info("Login successful");
        return { success: true, data: response.data };
      }

      logger.warn("Login response missing expected data");
      return { success: false, errors: ["Invalid response from server"] };
    } catch (error) {
      logger.error("Login failed:", error);
      return handleError(error);
    }
  },
  register: async (email: string, password: string): Promise<Result<any>> => {
    try {
      const response = await axios.post(
        `${IDENTITY_API_URL}register`,
        { email, password },
        { withCredentials: true }
      );
      if (response.data && response.data.accessToken) {
        accessToken = response.data.accessToken;
      }
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error);
    }
  },
  logout: async (): Promise<Result<any>> => {
    logger.info("Logging out user");
    try {
      const response = await axios.post(
        `${IDENTITY_API_URL}logout`,
        {},
        { withCredentials: true }
      );
      accessToken = null;
      refreshToken = null;
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      logger.info("Logout successful");
      return { success: true, data: response.data };
    } catch (error) {
      logger.error("Logout failed:", error);
      return handleError(error);
    }
  },
  refreshToken: async (): Promise<boolean> => {
    logger.debug("Attempting to refresh token");
    try {
      if (!refreshToken) {
        logger.warn("No refresh token available");
        return false;
      }

      const config: CustomAxiosRequestConfig = {
        withCredentials: true,
        _skipAuthRetry: true,
      };

      const response = await axios.post(
        `${IDENTITY_API_URL}refresh`,
        { refreshToken },
        config
      );

      if (response.data) {
        if (response.data.accessToken) {
          logger.debug("Received new access token");
          accessToken = response.data.accessToken;
        }

        if (response.data.refreshToken) {
          logger.debug("Updating stored refresh token");
          refreshToken = response.data.refreshToken;
          if (localStorage.getItem(REFRESH_TOKEN_KEY)) {
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          }
        }

        if (accessToken) {
          logger.info("Token refresh successful");
          return true;
        }
      }

      logger.warn("Token refresh response missing tokens");
      return false;
    } catch (error) {
      logger.error("Token refresh failed:", error);
      accessToken = null;
      refreshToken = null;
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return false;
    }
  },
  getAccessToken: async (): Promise<string | null> => {
    if (accessToken) {
      logger.debug("Returning existing access token");
      return accessToken;
    }

    if (refreshToken && !accessToken) {
      logger.debug("No access token, attempting refresh");
      const success = await AuthService.refreshToken();
      if (success) {
        logger.debug("Successfully obtained new access token");
        return accessToken;
      }
      logger.warn("Failed to obtain new access token");
    }

    logger.debug("No access token available");
    return null;
  },
  recoverPassword: async (email: string): Promise<Result<any>> => {
    try {
      const response = await axios.post(`${IDENTITY_API_URL}recover-password`, {
        email: email ?? "", // Ensure email is a string
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error);
    }
  },
  verify2FA: async (code: string): Promise<Result<any>> => {
    try {
      const response = await axios.post(`${IDENTITY_API_URL}verify-2fa`, {
        code: code ?? "", // Ensure code is a string
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error);
    }
  },

  getUser: async (): Promise<Result<any>> => {
    try {
      const response = await axios.get(`${IDENTITY_API_URL}user`);
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error);
    }
  },
  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<Result<any>> => {
    try {
      const response = await axios.post(`${IDENTITY_API_URL}change-password`, {
        currentPassword,
        newPassword,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error);
    }
  },
  resend2FA: async (): Promise<Result<any>> => {
    try {
      const response = await axios.post(`${IDENTITY_API_URL}resend-2fa`, {});
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error);
    }
  },
  retryableGetUser: async (retries: number = 5): Promise<Result<any>> => {
    logger.info("Attempting to get user info");

    // If we have a refresh token but no access token, try refresh first
    if (refreshToken && !accessToken) {
      logger.debug(
        "Found refresh token but no access token, attempting to refresh"
      );
      const refreshSuccess = await AuthService.refreshToken();
      if (!refreshSuccess) {
        logger.warn("Initial token refresh failed");
        return {
          success: false,
          errors: ["Unable to authenticate"],
        };
      }
    }

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        logger.debug(
          `Get user attempt ${attempt + 1}/${retries}, AccessToken: ${
            accessToken ? "present" : "missing"
          }`
        );
        const response = await axios.get(`${IDENTITY_API_URL}user`);
        logger.info("Successfully retrieved user info");
        return { success: true, data: response.data };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (
            error.response?.status === 401 ||
            error.response?.status === 403
          ) {
            // Try refresh token on auth errors
            if (refreshToken && attempt < retries - 1) {
              logger.debug("Auth error, attempting token refresh");
              const refreshSuccess = await AuthService.refreshToken();
              if (refreshSuccess) {
                logger.debug("Token refresh successful, retrying user info");
                continue;
              }
            }
            logger.warn("Authentication failed permanently");
            return handleError(error);
          }
          if (attempt < retries - 1) {
            logger.debug(
              `Request failed, retrying in 1s (attempt ${
                attempt + 1
              }/${retries})`
            );
            await delay(1000);
            continue;
          }
        }
        logger.error("Failed to get user info:", error);
        return handleError(error);
      }
    }
    logger.warn("Maximum retry attempts exceeded");
    return { success: false, errors: ["Maximum retry attempts exceeded"] };
  },
  hasRefreshToken: (): boolean => {
    return !!refreshToken;
  },
};

function handleError(error: any): Result<any> {
  if (axios.isAxiosError(error) && error.response) {
    const errors = parseIdentityErrors(error.response.data);
    logger.error("API error:", { status: error.response.status, errors });
    return { success: false, errors };
  } else {
    logger.error("Unexpected error:", error);
    return { success: false, errors: ["An unexpected error occurred."] };
  }
}

function parseIdentityErrors(responseData: any): string[] {
  const errors: string[] = [];
  if (responseData && responseData.errors) {
    for (const key in responseData.errors) {
      if (responseData.errors.hasOwnProperty(key)) {
        errors.push(...responseData.errors[key]);
      }
    }
  } else if (responseData && responseData.title) {
    errors.push(responseData.title);
  }
  return errors;
}

export default AuthService;
