import { describe, it, expect, vi } from 'vitest';
import { licensesService } from '../services/licensesService';

// Mock the API
vi.mock('../lib/api', () => ({
    default: {
        get: vi.fn((url: string) => {
            if (url.includes('/api/licenses?')) {
                return Promise.resolve({
                    data: [
                        { id: '1', license_key: 'LIC-001', type: 'pro', status: 'active', created_at: '2025-01-01' },
                        { id: '2', license_key: 'LIC-002', type: 'free', status: 'expired', created_at: '2024-01-01' },
                    ],
                });
            }
            return Promise.resolve({ data: [] });
        }),
        post: vi.fn(() => Promise.resolve({
            data: [{ license_key: 'LIC-NEW-123', type: 'pro', status: 'active' }],
        })),
        put: vi.fn(() => Promise.resolve({ data: null })),
    },
}));

describe('LicensesService', () => {
    it('should fetch list of licenses', async () => {
        const licenses = await licensesService.listLicenses();

        expect(licenses).toBeDefined();
        expect(Array.isArray(licenses)).toBe(true);
        expect(licenses.length).toBe(2);
    });

    it('should generate licenses', async () => {
        const result = await licensesService.generateLicenses({ type: 'pro' }, 1);

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0].license_key).toContain('LIC-');
    });

    it('should revoke license', async () => {
        await licensesService.revokeLicense('1');
        // If no error is thrown, the test passes
        expect(true).toBe(true);
    });

    it('should have all required methods', () => {
        expect(licensesService.listLicenses).toBeDefined();
        expect(licensesService.generateLicenses).toBeDefined();
        expect(licensesService.revokeLicense).toBeDefined();
    });
});
