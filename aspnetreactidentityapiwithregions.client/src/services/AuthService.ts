import axios from "axios";

const IDENTITY_API_URL = "/api/identity/";

interface Result<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

const TOKEN_STORAGE_KEY = "auth_token";

let accessToken: string | null = localStorage.getItem(TOKEN_STORAGE_KEY);

// Set up an Axios interceptor to add the Authorization header to all requests
axios.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
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
    try {
      const response = await axios.post(
        `${IDENTITY_API_URL}login`,
        { email, password },
        { withCredentials: true }
      );
      if (response.data && response.data.accessToken) {
        accessToken = response.data.accessToken;
        if (remember) {
          localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
        }
      }
      return { success: true, data: response.data };
    } catch (error) {
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
    try {
      const response = await axios.post(
        `${IDENTITY_API_URL}logout`,
        {},
        { withCredentials: true }
      );
      accessToken = null;
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error);
    }
  },
  refreshToken: async (): Promise<boolean> => {
    try {
      const response = await axios.post(
        `${IDENTITY_API_URL}refresh-token`,
        null,
        {
          withCredentials: true,
        }
      );
      if (response.data && response.data.accessToken) {
        accessToken = response.data.accessToken;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  getAccessToken: (): string | null => {
    return accessToken;
  },
  recoverPassword: async (email: string): Promise<Result<any>> => {
    try {
      const response = await axios.post(`${IDENTITY_API_URL}recover-password`, {
        email,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error);
    }
  },
  verify2FA: async (code: string): Promise<Result<any>> => {
    try {
      const response = await axios.post(`${IDENTITY_API_URL}verify-2fa`, {
        code,
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
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await axios.get(`${IDENTITY_API_URL}user`);
        return { success: true, data: response.data };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (
            error.response?.status === 403 ||
            error.response?.status === 401
          ) {
            return handleError(error);
          }
          if (attempt < retries - 1) {
            await delay(1000);
            continue;
          }
        }
        return handleError(error);
      }
    }
    return { success: false, errors: ["Maximum retry attempts exceeded"] };
  },
};

function handleError(error: any): Result<any> {
  if (axios.isAxiosError(error) && error.response) {
    const errors = parseIdentityErrors(error.response.data);
    return { success: false, errors };
  } else {
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
