import api from '../lib/api';

export interface User {
    id: string;
    email: string;
    name: string;
    photo_url?: string;
    role: 'user' | 'admin' | 'super_admin';
    status: 'active' | 'suspended' | 'deleted';
    created_at: string;
    last_login?: string;
}

export interface UserListResponse {
    users: User[];
    total: number;
    page: number;
    page_size: number;
}

export const usersService = {
    async listUsers(
        page: number = 1,
        pageSize: number = 20,
        search?: string,
        status?: string
    ): Promise<UserListResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString(),
        });

        if (search) {
            params.append('search', search);
        }

        if (status) {
            params.append('status', status);
        }

        const response = await api.get(`/api/users?${params.toString()}`);
        return response.data;
    },

    async getUser(userId: string): Promise<User> {
        const response = await api.get(`/api/users/${userId}`);
        return response.data;
    },

    async suspendUser(userId: string): Promise<void> {
        await api.post(`/api/users/${userId}/suspend`);
    },

    async deleteUser(userId: string): Promise<void> {
        await api.delete(`/api/users/${userId}`);
    },
};
