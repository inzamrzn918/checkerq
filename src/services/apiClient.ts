import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

// Expo automatically loads EXPO_PUBLIC_* variables from .env
// Use environment variable or fallback to localhost for development
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        // Request interceptor - add auth token
        this.client.interceptors.request.use(
            async (config) => {
                const token = await SecureStore.getItemAsync('access_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor - handle token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshToken = await SecureStore.getItemAsync('refresh_token');
                        if (!refreshToken) {
                            throw new Error('No refresh token');
                        }

                        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                            refresh_token: refreshToken,
                        });

                        const { access_token, refresh_token: newRefreshToken } = response.data;

                        await SecureStore.setItemAsync('access_token', access_token);
                        await SecureStore.setItemAsync('refresh_token', newRefreshToken);

                        originalRequest.headers.Authorization = `Bearer ${access_token}`;
                        return this.client(originalRequest);
                    } catch (refreshError) {
                        // Clear tokens and redirect to login
                        await SecureStore.deleteItemAsync('access_token');
                        await SecureStore.deleteItemAsync('refresh_token');
                        // TODO: Navigate to login screen
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    getInstance(): AxiosInstance {
        return this.client;
    }
}

export const apiClient = new ApiClient().getInstance();
export default apiClient;
