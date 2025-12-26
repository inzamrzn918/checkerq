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
            if (url.includes('/api/analytics/evaluations-trend')) {
                return Promise.resolve({
                    data: [
                        { day: 'Mon', count: 50 },
                        { day: 'Tue', count: 60 },
                    ],
                });
            }
            if (url === '/api/analytics/license-distribution') {
                return Promise.resolve({
                    data: [
                        { name: 'Active', value: 180, color: '#0ea5e9' },
                        { name: 'Expired', value: 20, color: '#ef4444' },
                    ],
                });
            }
            if (url.includes('/api/analytics/recent-activity')) {
                return Promise.resolve({
                    data: [
                        { user: 'John Doe', action: 'created assessment', time: '2 mins ago' },
                    ],
                });
            }
            return Promise.resolve({ data: [] });
        }),
    },
}));

describe('AnalyticsService', () => {
    it('should fetch dashboard stats', async () => {
        const stats = await analyticsService.getStats();

        expect(stats).toBeDefined();
        expect(stats.total_users).toBe(150);
        expect(stats.total_assessments).toBe(450);
    });

    it('should fetch user growth data', async () => {
        const data = await analyticsService.getUserGrowth(6);

        expect(data).toBeDefined();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(2);
    });

    it('should fetch evaluations trend', async () => {
        const data = await analyticsService.getEvaluationsTrend(7);

        expect(data).toBeDefined();
        expect(Array.isArray(data)).toBe(true);
    });

    it('should fetch license distribution', async () => {
        const data = await analyticsService.getLicenseDistribution();

        expect(data).toBeDefined();
        expect(Array.isArray(data)).toBe(true);
    });

    it('should fetch recent activity', async () => {
        const data = await analyticsService.getRecentActivity(5);

        expect(data).toBeDefined();
        expect(Array.isArray(data)).toBe(true);
    });

    it('should have all required methods', () => {
        expect(analyticsService.getStats).toBeDefined();
        expect(analyticsService.getUserGrowth).toBeDefined();
        expect(analyticsService.getEvaluationsTrend).toBeDefined();
        expect(analyticsService.getLicenseDistribution).toBeDefined();
        expect(analyticsService.getRecentActivity).toBeDefined();
    });
});
