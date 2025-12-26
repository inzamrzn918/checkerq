import { describe, it, expect, vi } from 'vitest';
import { assessmentsService } from '../services/assessmentsService';

// Mock the API
vi.mock('../lib/api', () => ({
    default: {
        get: vi.fn((url: string) => {
            if (url.includes('/api/assessments?')) {
                return Promise.resolve({
                    data: {
                        assessments: [
                            { id: '1', title: 'Math Test', user_name: 'John', status: 'active', created_at: '2025-01-01' },
                            { id: '2', title: 'Science Quiz', user_name: 'Jane', status: 'draft', created_at: '2025-01-02' },
                        ],
                        total: 2,
                    },
                });
            }
            if (url.includes('/api/assessments/') && !url.includes('stats')) {
                return Promise.resolve({
                    data: { id: '1', title: 'Math Test', questions: [], evaluations: [] },
                });
            }
            if (url === '/api/assessments/stats') {
                return Promise.resolve({
                    data: { total: 50, active: 30, draft: 15, archived: 5 },
                });
            }
            return Promise.resolve({ data: [] });
        }),
        put: vi.fn(() => Promise.resolve({ data: { message: 'Status updated' } })),
        delete: vi.fn(() => Promise.resolve({ data: { message: 'Assessment deleted' } })),
    },
}));

describe('AssessmentsService', () => {
    it('should fetch list of assessments', async () => {
        const result = await assessmentsService.listAssessments();

        expect(result).toBeDefined();
        expect(result.assessments).toBeDefined();
        expect(Array.isArray(result.assessments)).toBe(true);
        expect(result.assessments.length).toBe(2);
    });

    it('should fetch assessment by id', async () => {
        const assessment = await assessmentsService.getAssessment('1');

        expect(assessment).toBeDefined();
        expect(assessment.id).toBe('1');
        expect(assessment.title).toBe('Math Test');
    });

    it('should fetch assessment stats', async () => {
        const stats = await assessmentsService.getStats();

        expect(stats).toBeDefined();
        expect(stats.total).toBe(50);
        expect(stats.active).toBe(30);
    });

    it('should update assessment status', async () => {
        const result = await assessmentsService.updateStatus('1', 'archived');

        expect(result).toBeDefined();
    });

    it('should delete assessment', async () => {
        const result = await assessmentsService.deleteAssessment('1');

        expect(result).toBeDefined();
    });

    it('should have all required methods', () => {
        expect(assessmentsService.listAssessments).toBeDefined();
        expect(assessmentsService.getAssessment).toBeDefined();
        expect(assessmentsService.getStats).toBeDefined();
        expect(assessmentsService.updateStatus).toBeDefined();
        expect(assessmentsService.deleteAssessment).toBeDefined();
    });
});
