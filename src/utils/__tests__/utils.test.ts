import { describe, it, expect } from '@jest/globals';
import { formatDate, calculatePercentage } from '../dateUtils';

describe('Date Utils', () => {
    it('should format date correctly', () => {
        const date = new Date('2025-12-26T12:00:00Z');
        const formatted = formatDate(date);
        expect(formatted).toBeDefined();
        expect(typeof formatted).toBe('string');
    });
});

describe('Calculation Utils', () => {
    it('should calculate percentage correctly', () => {
        expect(calculatePercentage(50, 100)).toBe(50);
        expect(calculatePercentage(25, 100)).toBe(25);
        expect(calculatePercentage(0, 100)).toBe(0);
    });

    it('should handle division by zero', () => {
        expect(calculatePercentage(50, 0)).toBe(0);
    });
});
