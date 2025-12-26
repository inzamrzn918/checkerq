import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

const CONFIG_CACHE_KEY = 'app_config';
const CONFIG_CACHE_TIMESTAMP_KEY = 'app_config_timestamp';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// TypeScript interfaces matching backend
export interface GoogleOAuthConfig {
    android_client_id: string;
    web_client_id: string;
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

export interface AppConfig {
    google_oauth?: GoogleOAuthConfig;
    feature_flags?: FeatureFlags;
    app_settings?: AppSettings;
    evaluation_settings?: EvaluationSettings;
    upload_limits?: UploadLimits;
}

// Default configuration (fallback values)
const DEFAULT_CONFIG: AppConfig = {
    feature_flags: {
        google_signin_enabled: true,
        offline_mode_enabled: true,
        backup_restore_enabled: true,
        auto_save_enabled: true,
    },
    app_settings: {
        auto_save_interval: 60,
        max_assessments_per_user: 100,
        session_timeout: 3600,
        default_language: 'en',
    },
    evaluation_settings: {
        default_ai_model: 'gemini',
        max_retry_attempts: 3,
        evaluation_timeout: 300,
        confidence_threshold: 0.7,
    },
    upload_limits: {
        max_file_size: 10485760, // 10MB
        allowed_file_types: ['pdf', 'jpg', 'jpeg', 'png'],
        max_files_per_assessment: 10,
    },
};

class ConfigService {
    private config: AppConfig | null = null;
    private loading: boolean = false;

    /**
     * Fetch app configuration from backend
     */
    async fetchAppConfig(): Promise<AppConfig> {
        try {
            this.loading = true;
            const response = await apiClient.get('/api/config/app');
            const config = response.data;

            // Merge with defaults to ensure all fields exist
            const mergedConfig = this.mergeWithDefaults(config);

            // Cache the configuration
            await this.cacheConfig(mergedConfig);

            this.config = mergedConfig;
            this.loading = false;
            return mergedConfig;
        } catch (error) {
            console.error('Failed to fetch app config:', error);
            this.loading = false;

            // Try to use cached config
            const cachedConfig = await this.getCachedConfig();
            if (cachedConfig) {
                console.log('Using cached config due to fetch error');
                this.config = cachedConfig;
                return cachedConfig;
            }

            // Fall back to defaults
            console.log('Using default config');
            this.config = DEFAULT_CONFIG;
            return DEFAULT_CONFIG;
        }
    }

    /**
     * Get cached configuration from AsyncStorage
     */
    async getCachedConfig(): Promise<AppConfig | null> {
        try {
            const cachedData = await AsyncStorage.getItem(CONFIG_CACHE_KEY);
            const timestamp = await AsyncStorage.getItem(CONFIG_CACHE_TIMESTAMP_KEY);

            if (!cachedData || !timestamp) {
                return null;
            }

            // Check if cache is still valid
            const cacheAge = Date.now() - parseInt(timestamp, 10);
            if (cacheAge > CACHE_DURATION) {
                console.log('Cache expired, will fetch fresh config');
                return null;
            }

            const config = JSON.parse(cachedData);
            return this.mergeWithDefaults(config);
        } catch (error) {
            console.error('Error reading cached config:', error);
            return null;
        }
    }

    /**
     * Cache configuration to AsyncStorage
     */
    private async cacheConfig(config: AppConfig): Promise<void> {
        try {
            await AsyncStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config));
            await AsyncStorage.setItem(CONFIG_CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (error) {
            console.error('Error caching config:', error);
        }
    }

    /**
     * Get current configuration (from memory, cache, or fetch)
     */
    async getConfig(): Promise<AppConfig> {
        // Return in-memory config if available
        if (this.config) {
            return this.config;
        }

        // Try to get from cache
        const cachedConfig = await this.getCachedConfig();
        if (cachedConfig) {
            this.config = cachedConfig;
            return cachedConfig;
        }

        // Fetch from backend
        return await this.fetchAppConfig();
    }

    /**
     * Force refresh configuration from backend
     */
    async refreshConfig(): Promise<AppConfig> {
        return await this.fetchAppConfig();
    }

    /**
     * Clear cached configuration
     */
    async clearCache(): Promise<void> {
        try {
            await AsyncStorage.removeItem(CONFIG_CACHE_KEY);
            await AsyncStorage.removeItem(CONFIG_CACHE_TIMESTAMP_KEY);
            this.config = null;
        } catch (error) {
            console.error('Error clearing config cache:', error);
        }
    }

    /**
     * Check if currently loading
     */
    isLoading(): boolean {
        return this.loading;
    }

    /**
     * Merge fetched config with defaults to ensure all fields exist
     */
    private mergeWithDefaults(config: Partial<AppConfig>): AppConfig {
        return {
            google_oauth: config.google_oauth,
            feature_flags: {
                ...DEFAULT_CONFIG.feature_flags!,
                ...config.feature_flags,
            },
            app_settings: {
                ...DEFAULT_CONFIG.app_settings!,
                ...config.app_settings,
            },
            evaluation_settings: {
                ...DEFAULT_CONFIG.evaluation_settings!,
                ...config.evaluation_settings,
            },
            upload_limits: {
                ...DEFAULT_CONFIG.upload_limits!,
                ...config.upload_limits,
            },
        };
    }
}

export const configService = new ConfigService();
export default configService;
