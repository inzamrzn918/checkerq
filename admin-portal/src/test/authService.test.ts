import { describe, it, expect } from 'vitest';
import authService from '../services/authService';

describe('AuthService', () => {
    it('should have login method', () => {
        expect(authService.login).toBeDefined();
        expect(typeof authService.login).toBe('function');
    });

    it('should have logout method', () => {
        expect(authService.logout).toBeDefined();
        expect(typeof authService.logout).toBe('function');
    });

    it('should have getToken method', () => {
        expect(authService.getToken).toBeDefined();
        expect(typeof authService.getToken).toBe('function');
    });

    it('should have isAuthenticated method', () => {
        expect(authService.isAuthenticated).toBeDefined();
        expect(typeof authService.isAuthenticated).toBe('function');
    });

    it('should return false when not authenticated', () => {
        // Clear any existing tokens
        localStorage.clear();
        expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when token exists', () => {
        localStorage.setItem('admin_access_token', 'fake-token');
        expect(authService.isAuthenticated()).toBe(true);
        localStorage.clear();
    });
});
