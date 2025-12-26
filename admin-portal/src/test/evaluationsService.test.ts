import { describe, it, expect, vi } from 'vitest';
import { evaluationsService } from '../services/evaluationsService';

// Mock the API
vi.mock('../lib/api', () => ({
    default: {
        get: vi.fn((url: string) => {
            if (url.includes('/api/evaluations?')) {
                return Promise.resolve({
                    data: {
                        evaluations: [
                            { id: '1', student_name: 'John', total_marks: 100, obtained_marks: 85, percentage: 85 },
                            { id: '2', student_name: 'Jane', total_marks: 50, obtained_marks: 45, percentage: 90 },
                        ],
                        total: 2,
                    },
                });
            }
            if (url.includes('/api/evaluations/') && !url.includes('stats')) {
                return Promise.resolve({
                    data: { id: '1', student_name: 'John', results: [], overall_feedback: 'Good' },
                });
            }
            if (url === '/api/evaluations/stats') {
                return Promise.resolve({
                    data: { total: 100, total_today: 10, average_marks: 75, average_percentage: 75 },
                });
            }
            return Promise.resolve({ data: [] });
        }),
        delete: vi.fn(() => Promise.resolve({ data: { message: 'Evaluation deleted' } })),
    },
}));

describe('EvaluationsService', () => {
    it('should fetch list of evaluations', async () => {
        const result = await evaluationsService.listEvaluations();

        expect(result).toBeDefined();
        expect(result.evaluations).toBeDefined();
        expect(Array.isArray(result.evaluations)).toBe(true);
        expect(result.evaluations.length).toBe(2);
    });

    it('should fetch evaluation by id', async () => {
        const evaluation = await evaluationsService.getEvaluation('1');

        expect(evaluation).toBeDefined();
        expect(evaluation.id).toBe('1');
        expect(evaluation.student_name).toBe('John');
    });

    it('should fetch evaluation stats', async () => {
        const stats = await evaluationsService.getStats();

        expect(stats).toBeDefined();
        expect(stats.total).toBe(100);
        expect(stats.average_marks).toBe(75);
    });

    it('should delete evaluation', async () => {
        const result = await evaluationsService.deleteEvaluation('1');

        expect(result).toBeDefined();
    });

    it('should have all required methods', () => {
        expect(evaluationsService.listEvaluations).toBeDefined();
        expect(evaluationsService.getEvaluation).toBeDefined();
        expect(evaluationsService.getStats).toBeDefined();
        expect(evaluationsService.deleteEvaluation).toBeDefined();
    });
});
