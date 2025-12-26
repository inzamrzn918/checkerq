import { describe, it, expect, jest } from '@jest/globals';
import * as storage from '../storage';

// Mock the database
jest.mock('../db', () => ({
    getDatabase: jest.fn(() => ({
        runAsync: jest.fn(),
        getAllAsync: jest.fn(),
        getFirstAsync: jest.fn(),
    })),
}));

describe('Storage Service', () => {
    it('should export saveAssessment function', () => {
        expect(storage.saveAssessment).toBeDefined();
        expect(typeof storage.saveAssessment).toBe('function');
    });

    it('should export getAssessments function', () => {
        expect(storage.getAssessments).toBeDefined();
        expect(typeof storage.getAssessments).toBe('function');
    });

    it('should export saveEvaluation function', () => {
        expect(storage.saveEvaluation).toBeDefined();
        expect(typeof storage.saveEvaluation).toBe('function');
    });

    it('should export getEvaluations function', () => {
        expect(storage.getEvaluations).toBeDefined();
        expect(typeof storage.getEvaluations).toBe('function');
    });
});
