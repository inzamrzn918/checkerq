import api from '../lib/api';

// Types for settings
export interface GoogleOAuthConfig {
    android_client_id: string;
    web_client_id: string;
}

export interface AIKeysConfig {
    gemini_api_key: string;
    mistral_api_key: string;
}

export interface FeatureFlags {
    google_signin_enabled: boolean;
    offline_mode_enabled: boolean;
    backup_restore_enabled: boolean;
    auto_save_enabled: boolean;
}

export interface AppSettings {
    auto_save_interval: number;
    max_assessments_per_user: number;
    session_timeout: number;
    default_language: string;
}

export interface EvaluationSettings {
    default_ai_model: 'gemini' | 'mistral';
    max_retry_attempts: number;
    evaluation_timeout: number;
    confidence_threshold: number;
}

export interface UploadLimits {
    max_file_size: number;
    allowed_file_types: string[];
    max_files_per_assessment: number;
}

class ConfigService {
    // Google OAuth
    async getGoogleOAuth(): Promise<GoogleOAuthConfig> {
        const response = await api.get('/api/config/admin');
        return response.data.google_oauth || { android_client_id: '', web_client_id: '' };
    }

    async updateGoogleOAuth(androidClientId: string, webClientId: string) {
        const response = await api.post('/api/config/admin/google-oauth', {
            android_client_id: androidClientId,
            web_client_id: webClientId,
        });
        return response.data;
    }

    // AI Keys
    async getAIKeys(): Promise<AIKeysConfig> {
        const response = await api.get('/api/config/admin/ai-keys');
        return response.data;
    }

    async updateAIKeys(geminiApiKey?: string, mistralApiKey?: string) {
        const response = await api.post('/api/config/admin/ai-keys', {
            gemini_api_key: geminiApiKey,
            mistral_api_key: mistralApiKey,
        });
        return response.data;
    }

    // Feature Flags
    async getFeatureFlags(): Promise<FeatureFlags> {
        const response = await api.get('/api/config/admin/feature-flags');
        return response.data;
    }

    async updateFeatureFlags(flags: FeatureFlags) {
        const response = await api.post('/api/config/admin/feature-flags', flags);
        return response.data;
    }

    // App Settings
    async getAppSettings(): Promise<AppSettings> {
        const response = await api.get('/api/config/admin/app-settings');
        return response.data;
    }

    async updateAppSettings(settings: AppSettings) {
        const response = await api.post('/api/config/admin/app-settings', settings);
        return response.data;
    }

    // Evaluation Settings
    async getEvaluationSettings(): Promise<EvaluationSettings> {
        const response = await api.get('/api/config/admin/evaluation-settings');
        return response.data;
    }

    async updateEvaluationSettings(settings: EvaluationSettings) {
        const response = await api.post('/api/config/admin/evaluation-settings', settings);
        return response.data;
    }

    // Upload Limits
    async getUploadLimits(): Promise<UploadLimits> {
        const response = await api.get('/api/config/admin/upload-limits');
        return response.data;
    }

    async updateUploadLimits(limits: UploadLimits) {
        const response = await api.post('/api/config/admin/upload-limits', limits);
        return response.data;
    }
}

export const configService = new ConfigService();
export default configService;
