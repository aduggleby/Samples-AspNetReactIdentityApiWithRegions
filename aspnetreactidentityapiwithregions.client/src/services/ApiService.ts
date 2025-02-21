import axios from "axios";
import AuthService from "./AuthService";

// Define AppSettings type
export interface AppSettings {
  region: string;
  regions: Record<string, string>;
}

const API_URL = "/api/";

// Create an axios instance
const apiClient = axios.create({
  baseURL: API_URL,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Request interceptor to add the access token to headers
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig & { _skipAuthRetry?: boolean }) => {
    // Skip token handling for refresh token requests to avoid infinite loops
    if (config._skipAuthRetry) {
      return config;
    }

    const token = await AuthService.getAccessToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to refresh token on 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _skipAuthRetry?: boolean };

    // Skip refresh token requests to avoid infinite loops
    if (originalRequest._skipAuthRetry) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshSuccess = await AuthService.refreshToken();
        if (refreshSuccess) {
          const newToken = await AuthService.getAccessToken();
          if (newToken) {
            processQueue();
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        }
        processQueue(error);
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

const ApiService = {
  getWeatherForecast: async () => {
    const response = await apiClient.get(`weatherforecast`, {
      withCredentials: true,
    });
    return response.data;
  },
  // Updated method with AppSettings type
  getAppSettings: async (): Promise<AppSettings> => {
    const response = await apiClient.get(`appsettings`);
    return response.data;
  }
};

export default ApiService;
