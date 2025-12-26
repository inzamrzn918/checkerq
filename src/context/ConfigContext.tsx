import React, { createContext, useContext, useState, ReactNode } from 'react';
import configService, { AppConfig } from '../services/configService';

interface ConfigContextType {
    config: AppConfig | null;
    loading: boolean;
    error: string | null;
    loadConfig: () => Promise<void>;
    refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
    children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const loadConfig = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedConfig = await configService.getConfig();
            setConfig(fetchedConfig);
        } catch (err: any) {
            console.error('Error loading config:', err);
            setError(err.message || 'Failed to load configuration');
            // Use cached or default config on error
            const fallbackConfig = await configService.getCachedConfig();
            if (fallbackConfig) {
                setConfig(fallbackConfig);
            }
        } finally {
            setLoading(false);
        }
    };

    const refreshConfig = async () => {
        try {
            setError(null);
            const freshConfig = await configService.refreshConfig();
            setConfig(freshConfig);
        } catch (err: any) {
            console.error('Error refreshing config:', err);
            setError(err.message || 'Failed to refresh configuration');
        }
    };

    const value: ConfigContextType = {
        config,
        loading,
        error,
        loadConfig,
        refreshConfig,
    };

    return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = (): ConfigContextType => {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};

export default ConfigContext;
