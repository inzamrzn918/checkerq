import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Linking, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { ChevronLeft, Save, Key, Trash2, ExternalLink, Download, Upload, Cloud, Database, LogOut, Award, Activity } from 'lucide-react-native';
import { settingsService } from '../services/settings';
import { BackupService } from '../services/backup';
import { StorageService } from '../services/storage';
import { GeminiService } from '../services/gemini';
import { showError, showSuccess, showConfirm } from '../utils/errorHandler';
import authService from '../services/authService';
import licenseService from '../services/licenseService';

export default function SettingsScreen({ navigation }: any) {
    const [geminiKey, setGeminiKey] = useState('');
    const [mistralKey, setMistralKey] = useState('');
    const [maxConcurrent, setMaxConcurrent] = useState('3');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [backupPrefs, setBackupPrefs] = useState<any>(null);
    const [backupLoading, setBackupLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentLicense, setCurrentLicense] = useState<any>(null);
    const [storageUsage, setStorageUsage] = useState<number>(0);
    const [offlineMode, setOfflineMode] = useState(false);
    const [evalStats, setEvalStats] = useState({ today: 0, month: 0 });

    // Removed the initial useEffect that called loadKeys() as loadData will handle everything on focus.

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const keys = await settingsService.getApiKeys();
            const prefs = await settingsService.getBackupPreferences();
            const user = await authService.getCurrentUser();
            const license = await licenseService.getCurrentLicense();
            const maxC = await settingsService.getMaxConcurrent();

            setGeminiKey(keys.gemini || '');
            setMistralKey(keys.mistral || '');
            setMaxConcurrent(maxC.toString());
            setBackupPrefs(prefs);
            setCurrentUser(user);
            setCurrentLicense(license);

            const usage = await StorageService.getStorageUsage();
            setStorageUsage(usage);

            const isOffline = await settingsService.getOfflineMode();
            setOfflineMode(isOffline);

            const stats = await StorageService.getEvaluationStats();
            setEvalStats(stats);
        } catch (error) {
            Alert.alert('Error', 'Failed to load settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await authService.signOut();
                        navigation.replace('Login');
                    }
                }
            ]
        );
    };

    // Removed the original loadKeys function as its logic is now part of loadData.
    // Removed the original loadBackupPreferences function as its logic is now part of loadData.

    const saveSettings = async () => {
        if (!geminiKey.trim()) {
            Alert.alert('Required', 'Gemini API key is required.');
            return;
        }

        setSaving(true);
        try {
            await settingsService.setApiKeys({
                gemini: geminiKey.trim(),
                mistral: mistralKey.trim() || undefined,
            });
            await settingsService.setMaxConcurrent(parseInt(maxConcurrent, 10) || 3);
            await settingsService.setOfflineMode(offlineMode);

            // Update running service immediately
            GeminiService.setApiKey(geminiKey.trim());

            Alert.alert('Success', 'Settings saved successfully!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to save API keys. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const openLink = (url: string) => {
        Linking.openURL(url);
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0.00 MB';
        // We'll show in MB for small sizes, GB for large
        const mb = bytes / (1024 * 1024);
        if (mb < 1024) return `${mb.toFixed(2)} MB`;
        const gb = mb / 1024;
        return `${gb.toFixed(2)} GB`;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Account Section */}
                {currentUser && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account</Text>
                        <View style={styles.accountCard}>
                            <View style={styles.accountInfo}>
                                <Text style={styles.accountName}>{currentUser.name}</Text>
                                <Text style={styles.accountEmail}>{currentUser.email}</Text>
                            </View>
                        </View>

                        {/* License Status */}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('LicenseActivation')}
                        >
                            <Award color={theme.colors.primary} size={20} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.actionButtonText}>License</Text>
                                <Text style={styles.actionButtonSubtext}>
                                    {currentLicense ? `${currentLicense.type.toUpperCase()} - Active` : 'Activate License'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Logout Button */}
                        <TouchableOpacity
                            style={[styles.actionButton, styles.logoutButton]}
                            onPress={handleLogout}
                        >
                            <LogOut color={theme.colors.error} size={20} />
                            <Text style={[styles.actionButtonText, styles.logoutText]}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AI API Keys</Text>
                    <Text style={styles.subText}>Your API keys are stored securely and only used to communicate with AI services.</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Gemini API Key <Text style={styles.required}>*</Text>
                        </Text>
                        <View style={styles.inputContainer}>
                            <Key color={theme.colors.textSecondary} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Gemini API Key"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={geminiKey}
                                onChangeText={setGeminiKey}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                        <TouchableOpacity onPress={() => openLink('https://ai.google.dev/gemini-api/docs/api-key')}>
                            <Text style={styles.linkText}>How to get Gemini API key →</Text>
                        </TouchableOpacity>

                        {/* Gemini Usage Tracker */}
                        <View style={styles.quotaBox}>
                            <View style={styles.quotaHeader}>
                                <Activity size={12} color={theme.colors.textSecondary} />
                                <Text style={styles.quotaTitle}>Local Usage Tracking</Text>
                            </View>
                            <View style={styles.quotaRow}>
                                <View style={styles.quotaItem}>
                                    <Text style={styles.quotaVal}>{evalStats.today}</Text>
                                    <Text style={styles.quotaLabel}>Today</Text>
                                </View>
                                <View style={styles.quotaDivider} />
                                <View style={styles.quotaItem}>
                                    <Text style={styles.quotaVal}>{evalStats.month}</Text>
                                    <Text style={styles.quotaLabel}>This Month</Text>
                                </View>
                                {currentLicense && currentLicense.max_evaluations_per_month && (
                                    <>
                                        <View style={styles.quotaDivider} />
                                        <View style={styles.quotaItem}>
                                            <Text style={styles.quotaVal}>{currentLicense.max_evaluations_per_month}</Text>
                                            <Text style={styles.quotaLabel}>License Limit</Text>
                                        </View>
                                    </>
                                )}
                            </View>
                            {currentLicense && currentLicense.max_evaluations_per_month && (
                                <View style={styles.meterContainer}>
                                    <View style={[styles.meterFill, {
                                        width: `${Math.min(100, (evalStats.month / currentLicense.max_evaluations_per_month) * 100)}%`,
                                        backgroundColor: (evalStats.month / currentLicense.max_evaluations_per_month) > 0.9 ? theme.colors.error : theme.colors.primary
                                    }]} />
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mistral API Key (Optional)</Text>
                        <View style={styles.inputContainer}>
                            <Key color={theme.colors.textSecondary} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Mistral API Key"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={mistralKey}
                                onChangeText={setMistralKey}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                        <TouchableOpacity onPress={() => openLink('https://docs.mistral.ai/getting-started/quickstart/')}>
                            <Text style={styles.linkText}>How to get Mistral API key →</Text>
                        </TouchableOpacity>
                        <Text style={styles.hint}>If not provided, Gemini will be used for all operations.</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Max Concurrent Evaluations</Text>
                        <View style={styles.inputContainer}>
                            <Database color={theme.colors.textSecondary} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="3"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={maxConcurrent}
                                onChangeText={setMaxConcurrent}
                                keyboardType="numeric"
                            />
                        </View>
                        <Text style={styles.hint}>Recommended: 1-5. Higher values may cause rate limits.</Text>
                    </View>
                </View>

                {/* Storage Management Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Storage Management</Text>
                    <View style={styles.storageCard}>
                        <View style={styles.storageInfo}>
                            <Database color={theme.colors.primary} size={24} />
                            <View>
                                <Text style={styles.storageUsageText}>{formatSize(storageUsage)}</Text>
                                <Text style={styles.storageSubtext}>Total app data & images</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.refreshBtn}
                            onPress={async () => {
                                const usage = await StorageService.getStorageUsage();
                                setStorageUsage(usage);
                            }}
                        >
                            <Text style={styles.refreshBtnText}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.hint}>Images and cached evaluations consume the most space.</Text>
                </View>

                {/* Privacy & Connection Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Privacy & Connection</Text>
                    <View style={styles.privacyCard}>
                        <View style={styles.privacyInfo}>
                            <Cloud color={offlineMode ? theme.colors.textSecondary : theme.colors.primary} size={24} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.privacyTitle}>Offline Mode</Text>
                                <Text style={styles.privacySubtext}>Disable all backend API calls (License checks, Profile sync, etc.)</Text>
                            </View>
                            <Switch
                                value={offlineMode}
                                onValueChange={setOfflineMode}
                                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '50' }}
                                thumbColor={offlineMode ? theme.colors.primary : '#f4f3f4'}
                            />
                        </View>
                        {offlineMode && (
                            <View style={styles.offlineWarning}>
                                <Text style={styles.offlineWarningText}>
                                    Note: You are currently running in purely local mode. AI extraction (Gemini) will still work if you have an internet connection, but backend account sync is paused.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                    onPress={saveSettings}
                    disabled={saving}
                >
                    <Save color="#fff" size={20} />
                    <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    title: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        padding: theme.spacing.lg,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    subText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    required: {
        color: theme.colors.error,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        color: theme.colors.text,
        fontSize: 16,
    },
    linkText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    hint: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
    saveBtn: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        padding: 18,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    accountCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 16,
        marginBottom: 16,
    },
    accountInfo: {
        gap: 4,
    },
    accountName: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '600',
    },
    accountEmail: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 16,
        marginBottom: 12,
        gap: 12,
    },
    actionButtonText: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    actionButtonSubtext: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    logoutButton: {
        borderColor: theme.colors.error,
    },
    logoutText: {
        color: theme.colors.error,
    },
    storageCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    storageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    storageUsageText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    storageSubtext: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    refreshBtn: {
        padding: 8,
    },
    refreshBtnText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    privacyCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    privacyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    privacyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    privacySubtext: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    offlineWarning: {
        marginTop: 16,
        padding: 12,
        backgroundColor: theme.colors.warning + '10',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.warning,
    },
    offlineWarningText: {
        fontSize: 12,
        color: theme.colors.text,
        lineHeight: 18,
    },
    quotaBox: {
        backgroundColor: theme.colors.surface + '60',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: theme.colors.border + '40',
    },
    quotaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    quotaTitle: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    quotaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    quotaItem: {
        alignItems: 'center',
        flex: 1,
    },
    quotaVal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    quotaLabel: {
        fontSize: 10,
        color: theme.colors.textSecondary,
    },
    quotaDivider: {
        width: 1,
        height: 20,
        backgroundColor: theme.colors.border + '60',
    },
    meterContainer: {
        height: 4,
        backgroundColor: theme.colors.border + '40',
        borderRadius: 2,
        marginTop: 12,
        overflow: 'hidden',
    },
    meterFill: {
        height: '100%',
    },
});
