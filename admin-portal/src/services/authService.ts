import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface LoginCredentials {
    email: string;
    password: string;
}

interface AuthTokens {
    access_token: string;
    token_type: string;
}

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

class AuthService {
    private readonly TOKEN_KEY = 'admin_access_token';
    private readonly USER_KEY = 'admin_user';

    async login(credentials: LoginCredentials): Promise<User> {
        try {
            const response = await axios.post<AuthTokens>(
                `${API_BASE_URL}/api/auth/login`,
                new URLSearchParams({
                    username: credentials.email,
                    password: credentials.password,
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            const { access_token } = response.data;
            localStorage.setItem(this.TOKEN_KEY, access_token);

            // Fetch user profile
            const user = await this.getCurrentUser();
            if (user) {
                localStorage.setItem(this.USER_KEY, JSON.stringify(user));
                return user;
            }

            throw new Error('Failed to fetch user profile');
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.response?.data?.detail || 'Login failed');
        }
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    async getCurrentUser(): Promise<User | null> {
        try {
            const token = this.getToken();
            if (!token) return null;

            const response = await axios.get<User>(`${API_BASE_URL}/api/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            return response.data;
        } catch (error) {
            console.error('Get current user error:', error);
            this.logout();
            return null;
        }
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getStoredUser(): User | null {
        const userStr = localStorage.getItem(this.USER_KEY);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}

export const authService = new AuthService();
export default authService;
