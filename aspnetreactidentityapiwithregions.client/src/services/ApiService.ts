import axios from "axios";
import AuthService from "./AuthService";

const API_URL = "/api/";

// Create an axios instance
const apiClient = axios.create({
    baseURL: API_URL,
});

// Request interceptor to add the access token to headers
apiClient.interceptors.request.use(
    async (config) => {
        const token = AuthService.getAccessToken();
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
        const originalRequest = error.config;

        // If error is 401 Unauthorized and retry is not set
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshSuccess = await AuthService.refreshToken();
            if (refreshSuccess) {
                const newToken = AuthService.getAccessToken();
                if (newToken) {
                    originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                }
            }
        }
        return Promise.reject(error);
    }
);

const ApiService = {
    getWeatherForecast: async () => {
        const response = await apiClient.get(`weatherforecast`, { withCredentials: true });
        return response.data;
    },
};

export default ApiService;
