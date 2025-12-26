import * as SecureStore from 'expo-secure-store';
import apiClient from './apiClient';

interface AuthTokens {
    access_token: string;
    refresh_token: string;
}

interface UserProfile {
    id: string;
    email: string;
    name: string;
    photo_url?: string;
}

class AuthService {
    async initialize() {
        try {
            // Initialization logic if needed
            console.log('Auth service initialized');
        } catch (error) {
            console.error('Failed to initialize auth:', error);
        }
    }

    async signInWithGoogle(): Promise<UserProfile | null> {
        // Google Sign-In requires a development build or production APK
        // For now, return null to skip authentication in Expo Go
        console.warn('Google Sign-In is not available in Expo Go. Please use a development build or production APK.');

        // For testing purposes, you can bypass authentication
        // Uncomment the following to skip login in development:
        /*
        try {
            const mockUser: UserProfile = {
                id: 'dev-user',
                email: 'dev@checkerq.com',
                name: 'Development User',
            };
            return mockUser;
        } catch (error) {
            console.error('Mock sign in error:', error);
        }
        */

        return null;
    }

    async signOut(): Promise<void> {
        try {
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    }

    async getCurrentUser(): Promise<UserProfile | null> {
        try {
            const token = await SecureStore.getItemAsync('access_token');
            if (!token) return null;

            const response = await apiClient.get('/api/users/me');
            return response.data;
        } catch (error) {
            return null;
        }
    }

    async isAuthenticated(): Promise<boolean> {
        const token = await SecureStore.getItemAsync('access_token');
        return !!token;
    }
}

export const authService = new AuthService();
export default authService;

