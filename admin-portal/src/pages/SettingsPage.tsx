import React, { useState, useEffect } from 'react';
import { Save, Key, Globe, Zap, Settings as SettingsIcon, FileUp, CheckCircle2 } from 'lucide-react';
import configService, {
    GoogleOAuthConfig,
    AIKeysConfig,
    FeatureFlags,
    AppSettings,
    EvaluationSettings,
    UploadLimits
} from '../services/configService';

export default function SettingsPage() {
    // State for all settings
    const [googleOAuth, setGoogleOAuth] = useState<GoogleOAuthConfig>({
        android_client_id: '',
        web_client_id: '',
    });
    const [aiKeys, setAiKeys] = useState<AIKeysConfig>({
        gemini_api_key: '',
        mistral_api_key: '',
    });
    const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
        google_signin_enabled: true,
        offline_mode_enabled: true,
        backup_restore_enabled: true,
        auto_save_enabled: true,
    });
    const [appSettings, setAppSettings] = useState<AppSettings>({
        auto_save_interval: 60,
        max_assessments_per_user: 100,
        session_timeout: 3600,
        default_language: 'en',
    });
    const [evaluationSettings, setEvaluationSettings] = useState<EvaluationSettings>({
        default_ai_model: 'gemini',
        max_retry_attempts: 3,
        evaluation_timeout: 300,
        confidence_threshold: 0.7,
    });
    const [uploadLimits, setUploadLimits] = useState<UploadLimits>({
        max_file_size: 10485760,
        allowed_file_types: ['pdf', 'jpg', 'jpeg', 'png'],
        max_files_per_assessment: 10,
    });

    // Loading and save states
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
    const [saved, setSaved] = useState<{ [key: string]: boolean }>({});
    const [error, setError] = useState<string | null>(null);

    // Load all settings on mount
    useEffect(() => {
        loadAllSettings();
    }, []);

    const loadAllSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const [oauth, ai, flags, app, evaluation, upload] = await Promise.all([
                configService.getGoogleOAuth(),
                configService.getAIKeys(),
                configService.getFeatureFlags(),
                configService.getAppSettings(),
                configService.getEvaluationSettings(),
                configService.getUploadLimits(),
            ]);

            setGoogleOAuth(oauth);
            setAiKeys(ai);
            setFeatureFlags(flags);
            setAppSettings(app);
            setEvaluationSettings(evaluation);
            setUploadLimits(upload);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load settings');
            console.error('Failed to load settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (section: string, saveFunction: () => Promise<any>) => {
        setSaving(prev => ({ ...prev, [section]: true }));
        setError(null);
        try {
            await saveFunction();
            setSaved(prev => ({ ...prev, [section]: true }));
            setTimeout(() => {
                setSaved(prev => ({ ...prev, [section]: false }));
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || `Failed to save ${section}`);
            console.error(`Failed to save ${section}:`, err);
        } finally {
            setSaving(prev => ({ ...prev, [section]: false }));
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="text-slate-400">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="mt-2 text-slate-400">Configure system settings and app behavior</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Google OAuth Settings */}
            <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600/20">
                        <Globe className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Google OAuth Configuration</h2>
                        <p className="text-sm text-slate-400">Configure Google Sign-In for mobile app</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Android Client ID
                        </label>
                        <input
                            type="text"
                            value={googleOAuth.android_client_id}
                            onChange={(e) => setGoogleOAuth({ ...googleOAuth, android_client_id: e.target.value })}
                            placeholder="xxxxx.apps.googleusercontent.com"
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Web Client ID (Expo)
                        </label>
                        <input
                            type="text"
                            value={googleOAuth.web_client_id}
                            onChange={(e) => setGoogleOAuth({ ...googleOAuth, web_client_id: e.target.value })}
                            placeholder="xxxxx.apps.googleusercontent.com"
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <SaveButton
                            section="google-oauth"
                            saving={saving}
                            saved={saved}
                            onClick={() => handleSave('google-oauth', () =>
                                configService.updateGoogleOAuth(googleOAuth.android_client_id, googleOAuth.web_client_id)
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* AI API Keys */}
            <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600/20">
                        <Key className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">AI API Keys</h2>
                        <p className="text-sm text-slate-400">Configure AI service credentials</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Gemini API Key
                        </label>
                        <input
                            type="password"
                            value={aiKeys.gemini_api_key}
                            onChange={(e) => setAiKeys({ ...aiKeys, gemini_api_key: e.target.value })}
                            placeholder="Enter Gemini API Key"
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Mistral API Key (Optional)
                        </label>
                        <input
                            type="password"
                            value={aiKeys.mistral_api_key}
                            onChange={(e) => setAiKeys({ ...aiKeys, mistral_api_key: e.target.value })}
                            placeholder="Enter Mistral API Key"
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <SaveButton
                            section="ai-keys"
                            saving={saving}
                            saved={saved}
                            onClick={() => handleSave('ai-keys', () =>
                                configService.updateAIKeys(aiKeys.gemini_api_key, aiKeys.mistral_api_key)
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Feature Flags */}
            <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600/20">
                        <Zap className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Feature Flags</h2>
                        <p className="text-sm text-slate-400">Enable or disable app features</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <ToggleSwitch
                        label="Google Sign-In"
                        description="Allow users to sign in with Google"
                        checked={featureFlags.google_signin_enabled}
                        onChange={(checked) => setFeatureFlags({ ...featureFlags, google_signin_enabled: checked })}
                    />
                    <ToggleSwitch
                        label="Offline Mode"
                        description="Enable offline functionality"
                        checked={featureFlags.offline_mode_enabled}
                        onChange={(checked) => setFeatureFlags({ ...featureFlags, offline_mode_enabled: checked })}
                    />
                    <ToggleSwitch
                        label="Backup & Restore"
                        description="Allow users to backup and restore data"
                        checked={featureFlags.backup_restore_enabled}
                        onChange={(checked) => setFeatureFlags({ ...featureFlags, backup_restore_enabled: checked })}
                    />
                    <ToggleSwitch
                        label="Auto-Save"
                        description="Automatically save assessments"
                        checked={featureFlags.auto_save_enabled}
                        onChange={(checked) => setFeatureFlags({ ...featureFlags, auto_save_enabled: checked })}
                    />

                    <div className="flex justify-end pt-2">
                        <SaveButton
                            section="feature-flags"
                            saving={saving}
                            saved={saved}
                            onClick={() => handleSave('feature-flags', () =>
                                configService.updateFeatureFlags(featureFlags)
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* App Behavior Settings */}
            <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600/20">
                        <SettingsIcon className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">App Behavior Settings</h2>
                        <p className="text-sm text-slate-400">Configure app-wide behavior</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Auto-Save Interval (seconds)
                        </label>
                        <input
                            type="number"
                            min="30"
                            max="300"
                            value={appSettings.auto_save_interval}
                            onChange={(e) => setAppSettings({ ...appSettings, auto_save_interval: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <p className="mt-1 text-xs text-slate-400">Range: 30-300 seconds</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Max Assessments Per User
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={appSettings.max_assessments_per_user}
                            onChange={(e) => setAppSettings({ ...appSettings, max_assessments_per_user: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Session Timeout (seconds)
                        </label>
                        <input
                            type="number"
                            min="300"
                            value={appSettings.session_timeout}
                            onChange={(e) => setAppSettings({ ...appSettings, session_timeout: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Default Language
                        </label>
                        <select
                            value={appSettings.default_language}
                            onChange={(e) => setAppSettings({ ...appSettings, default_language: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                        </select>
                    </div>

                    <div className="flex justify-end pt-2">
                        <SaveButton
                            section="app-settings"
                            saving={saving}
                            saved={saved}
                            onClick={() => handleSave('app-settings', () =>
                                configService.updateAppSettings(appSettings)
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Evaluation Settings */}
            <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600/20">
                        <CheckCircle2 className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Evaluation Settings</h2>
                        <p className="text-sm text-slate-400">Configure AI evaluation parameters</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Default AI Model
                        </label>
                        <select
                            value={evaluationSettings.default_ai_model}
                            onChange={(e) => setEvaluationSettings({ ...evaluationSettings, default_ai_model: e.target.value as 'gemini' | 'mistral' })}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="gemini">Google Gemini</option>
                            <option value="mistral">Mistral AI</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Max Retry Attempts
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={evaluationSettings.max_retry_attempts}
                            onChange={(e) => setEvaluationSettings({ ...evaluationSettings, max_retry_attempts: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Evaluation Timeout (seconds)
                        </label>
                        <input
                            type="number"
                            min="60"
                            max="600"
                            value={evaluationSettings.evaluation_timeout}
                            onChange={(e) => setEvaluationSettings({ ...evaluationSettings, evaluation_timeout: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Confidence Threshold: {(evaluationSettings.confidence_threshold * 100).toFixed(0)}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={evaluationSettings.confidence_threshold}
                            onChange={(e) => setEvaluationSettings({ ...evaluationSettings, confidence_threshold: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="mt-1 text-xs text-slate-400">Minimum confidence for accepting AI evaluations</p>
                    </div>

                    <div className="flex justify-end pt-2">
                        <SaveButton
                            section="evaluation-settings"
                            saving={saving}
                            saved={saved}
                            onClick={() => handleSave('evaluation-settings', () =>
                                configService.updateEvaluationSettings(evaluationSettings)
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* File Upload Limits */}
            <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600/20">
                        <FileUp className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">File Upload Limits</h2>
                        <p className="text-sm text-slate-400">Configure file size and type restrictions</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Max File Size (MB)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={Math.round(uploadLimits.max_file_size / 1048576)}
                            onChange={(e) => setUploadLimits({ ...uploadLimits, max_file_size: parseInt(e.target.value) * 1048576 })}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <p className="mt-1 text-xs text-slate-400">Maximum: 100 MB</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Allowed File Types
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].map(type => (
                                <label key={type} className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={uploadLimits.allowed_file_types.includes(type)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setUploadLimits({ ...uploadLimits, allowed_file_types: [...uploadLimits.allowed_file_types, type] });
                                            } else {
                                                setUploadLimits({ ...uploadLimits, allowed_file_types: uploadLimits.allowed_file_types.filter(t => t !== type) });
                                            }
                                        }}
                                        className="rounded border-slate-600 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-slate-300 uppercase">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Max Files Per Assessment
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={uploadLimits.max_files_per_assessment}
                            onChange={(e) => setUploadLimits({ ...uploadLimits, max_files_per_assessment: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <SaveButton
                            section="upload-limits"
                            saving={saving}
                            saved={saved}
                            onClick={() => handleSave('upload-limits', () =>
                                configService.updateUploadLimits(uploadLimits)
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Components
interface SaveButtonProps {
    section: string;
    saving: { [key: string]: boolean };
    saved: { [key: string]: boolean };
    onClick: () => void;
}

function SaveButton({ section, saving, saved, onClick }: SaveButtonProps) {
    const isSaving = saving[section];
    const isSaved = saved[section];

    return (
        <button
            onClick={onClick}
            disabled={isSaving}
            className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
                ${isSaved
                    ? 'bg-green-600 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }
                ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            <Save className="h-5 w-5" />
            {isSaved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Settings'}
        </button>
    );
}

interface ToggleSwitchProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

function ToggleSwitch({ label, description, checked, onChange }: ToggleSwitchProps) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
            <div>
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-slate-400">{description}</div>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${checked ? 'bg-primary-600' : 'bg-slate-700'}
                `}
            >
                <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${checked ? 'translate-x-6' : 'translate-x-1'}
                    `}
                />
            </button>
        </div>
    );
}
