import { describe, it, expect, vi } from 'vitest';
import { usersService } from '../services/usersService';

// Mock the API
vi.mock('../lib/api', () => ({
    default: {
        get: vi.fn((url: string) => {
            if (url.includes('/api/users?')) {
                return Promise.resolve({
                    data: {
                        users: [
                            { id: '1', email: 'user1@example.com', name: 'User One', role: 'user', status: 'active', created_at: '2025-01-01' },
                            { id: '2', email: 'admin@example.com', name: 'Admin User', role: 'admin', status: 'active', created_at: '2025-01-02' },
                        ],
                        total: 2,
                        page: 1,
                        page_size: 20,
                    },
                });
            }
            if (url.includes('/api/users/')) {
                return Promise.resolve({
                    data: { id: '1', email: 'user1@example.com', name: 'User One', role: 'user', status: 'active' },
                });
            }
            return Promise.resolve({ data: [] });
        }),
        post: vi.fn(() => Promise.resolve({ data: { message: 'User suspended' } })),
        delete: vi.fn(() => Promise.resolve({ data: { message: 'User deleted' } })),
    },
}));

describe('UsersService', () => {
    it('should fetch list of users', async () => {
        const result = await usersService.listUsers();

        expect(result).toBeDefined();
        expect(result.users).toBeDefined();
        expect(Array.isArray(result.users)).toBe(true);
        expect(result.users.length).toBe(2);
        expect(result.total).toBe(2);
    });

    it('should fetch user by id', async () => {
        const user = await usersService.getUser('1');

        expect(user).toBeDefined();
        expect(user.id).toBe('1');
        expect(user.email).toBe('user1@example.com');
    });

    it('should suspend user', async () => {
        await usersService.suspendUser('1');
        // If no error is thrown, the test passes
        expect(true).toBe(true);
    });

    it('should delete user', async () => {
        await usersService.deleteUser('1');
        // If no error is thrown, the test passes
        expect(true).toBe(true);
    });

    it('should have all required methods', () => {
        expect(usersService.listUsers).toBeDefined();
        expect(usersService.getUser).toBeDefined();
        expect(usersService.suspendUser).toBeDefined();
        expect(usersService.deleteUser).toBeDefined();
    });
});
