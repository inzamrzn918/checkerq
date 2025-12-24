import * as SecureStore from 'expo-secure-store';

const GEMINI_KEY = 'gemini_api_key';
const MISTRAL_KEY = 'mistral_api_key';

export interface ApiKeys {
    gemini?: string;
    mistral?: string;
}

interface BackupPreferences {
    autoBackupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly' | 'manual';
    lastBackupTime?: string;
    googleDriveConnected: boolean;
    googleDriveEmail?: string;
}

const API_KEYS_KEY = 'api_keys';
const BACKUP_PREFS_KEY = 'backup_preferences';

export const settingsService = {
    /**
     * Get stored API keys
     */
    async getApiKeys(): Promise<ApiKeys> {
        try {
            const gemini = await SecureStore.getItemAsync(GEMINI_KEY);
            const mistral = await SecureStore.getItemAsync(MISTRAL_KEY);

            return {
                gemini: gemini || undefined,
                mistral: mistral || undefined,
            };
        } catch (error) {
            console.error('Error getting API keys:', error);
            return {};
        }
    },

    /**
     * Save API keys securely
     */
    async setApiKeys(keys: ApiKeys): Promise<void> {
        try {
            if (keys.gemini) {
                await SecureStore.setItemAsync(GEMINI_KEY, keys.gemini);
            }
            if (keys.mistral) {
                await SecureStore.setItemAsync(MISTRAL_KEY, keys.mistral);
            }
        } catch (error) {
            console.error('Error saving API keys:', error);
            throw new Error('Failed to save API keys');
        }
    },

    /**
     * Clear all API keys
     */
    async clearApiKeys(): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(GEMINI_KEY);
            await SecureStore.deleteItemAsync(MISTRAL_KEY);
        } catch (error) {
            console.error('Error clearing API keys:', error);
        }
    },

    /**
     * Check if valid API keys exist (at least Gemini)
     */
    async hasValidKeys(): Promise<boolean> {
        const keys = await this.getApiKeys();
        return !!keys.gemini && keys.gemini.trim().length > 0;
    },

    /**
     * Check if app can be used (has valid keys)
     */
    async canUseApp(): Promise<boolean> {
        return this.hasValidKeys();
    },

    // Backup Preferences
    async getBackupPreferences(): Promise<BackupPreferences> {
        try {
            const prefs = await SecureStore.getItemAsync(BACKUP_PREFS_KEY);
            if (prefs) {
                return JSON.parse(prefs);
            }
            return {
                autoBackupEnabled: false,
                backupFrequency: 'manual',
                googleDriveConnected: false,
            };
        } catch (error) {
            console.error('Error getting backup preferences:', error);
            return {
                autoBackupEnabled: false,
                backupFrequency: 'manual',
                googleDriveConnected: false,
            };
        }
    },

    async setBackupPreferences(prefs: BackupPreferences): Promise<void> {
        try {
            await SecureStore.setItemAsync(BACKUP_PREFS_KEY, JSON.stringify(prefs));
        } catch (error) {
            console.error('Error setting backup preferences:', error);
            throw error;
        }
    },

    async updateLastBackupTime(): Promise<void> {
        try {
            const prefs = await this.getBackupPreferences();
            prefs.lastBackupTime = new Date().toISOString();
            await this.setBackupPreferences(prefs);
        } catch (error) {
            console.error('Error updating last backup time:', error);
        }
    },
};
