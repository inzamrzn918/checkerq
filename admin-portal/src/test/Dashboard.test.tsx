import { describe, it, expect, vi } from 'vitest';
import { analyticsService } from '../services/analyticsService';

// Mock the API
vi.mock('../lib/api', () => ({
    default: {
        get: vi.fn((url: string) => {
            if (url === '/api/analytics/stats') {
                return Promise.resolve({
                    data: {
                        total_users: 150,
                        new_users_today: 5,
                        active_users: 120,
                        total_assessments: 450,
                        total_evaluations: 1200,
                        evaluations_today: 25,
                        total_licenses: 200,
                        active_licenses: 180,
                    },
                });
            }
            if (url.includes('/api/analytics/user-growth')) {
                return Promise.resolve({
                    data: [
                        { month: 'Jan', users: 100 },
                        { month: 'Feb', users: 120 },
                    ],
                });
            }
            return Promise.resolve({ data: [] });
        }),
    },
}));

describe('Dashboard Analytics', () => {
    it('should fetch dashboard stats', async () => {
        const stats = await analyticsService.getStats();

        expect(stats).toBeDefined();
        expect(stats.total_users).toBe(150);
        expect(stats.new_users_today).toBe(5);
        expect(stats.total_assessments).toBe(450);
        expect(stats.total_evaluations).toBe(1200);
    });

    it('should fetch user growth data', async () => {
        const userGrowth = await analyticsService.getUserGrowth(6);

        expect(userGrowth).toBeDefined();
        expect(Array.isArray(userGrowth)).toBe(true);
        expect(userGrowth.length).toBeGreaterThan(0);
    });

    it('should have all required service methods', () => {
        expect(analyticsService.getStats).toBeDefined();
        expect(analyticsService.getUserGrowth).toBeDefined();
        expect(analyticsService.getEvaluationsTrend).toBeDefined();
        expect(analyticsService.getLicenseDistribution).toBeDefined();
        expect(analyticsService.getRecentActivity).toBeDefined();
    });
});
