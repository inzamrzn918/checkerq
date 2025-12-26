import { describe, it, expect, vi } from 'vitest';
import { configService } from '../services/configService';

// Mock the API
vi.mock('../lib/api', () => ({
    default: {
        get: vi.fn((url: string) => {
            if (url === '/api/config/admin/feature-flags') {
                return Promise.resolve({
                    data: {
                        google_signin_enabled: true,
                        offline_mode_enabled: true,
                        backup_restore_enabled: true,
                        auto_save_enabled: true,
                    },
                });
            }
            if (url === '/api/config/admin/app-settings') {
                return Promise.resolve({
                    data: {
                        auto_save_interval: 60,
                        max_assessments_per_user: 100,
                    },
                });
            }
            if (url === '/api/config/admin/evaluation-settings') {
                return Promise.resolve({
                    data: {
                        default_ai_model: 'gemini',
                        max_retry_attempts: 3,
                        confidence_threshold: 0.7,
                    },
                });
            }
            if (url === '/api/config/admin/upload-limits') {
                return Promise.resolve({
                    data: {
                        max_file_size: 10485760,
                        allowed_file_types: ['pdf', 'jpg', 'png'],
                    },
                });
            }
            return Promise.resolve({ data: {} });
        }),
        post: vi.fn(() => Promise.resolve({ data: { message: 'Config updated' } })),
    },
}));

describe('ConfigService', () => {
    it('should fetch feature flags', async () => {
        const flags = await configService.getFeatureFlags();

        expect(flags).toBeDefined();
        expect(flags.google_signin_enabled).toBe(true);
        expect(flags.auto_save_enabled).toBe(true);
    });

    it('should fetch app settings', async () => {
        const settings = await configService.getAppSettings();

        expect(settings).toBeDefined();
        expect(settings.auto_save_interval).toBe(60);
    });

    it('should fetch evaluation settings', async () => {
        const settings = await configService.getEvaluationSettings();

        expect(settings).toBeDefined();
        expect(settings.default_ai_model).toBe('gemini');
    });

    it('should fetch upload limits', async () => {
        const limits = await configService.getUploadLimits();

        expect(limits).toBeDefined();
        expect(limits.max_file_size).toBe(10485760);
    });

    it('should update feature flags', async () => {
        const result = await configService.updateFeatureFlags({
            google_signin_enabled: false,
            offline_mode_enabled: true,
            backup_restore_enabled: true,
            auto_save_enabled: true,
        });

        expect(result).toBeDefined();
    });

    it('should have all required methods', () => {
        expect(configService.getFeatureFlags).toBeDefined();
        expect(configService.getAppSettings).toBeDefined();
        expect(configService.getEvaluationSettings).toBeDefined();
        expect(configService.getUploadLimits).toBeDefined();
        expect(configService.updateFeatureFlags).toBeDefined();
        expect(configService.updateAppSettings).toBeDefined();
        expect(configService.updateEvaluationSettings).toBeDefined();
        expect(configService.updateUploadLimits).toBeDefined();
    });
});
