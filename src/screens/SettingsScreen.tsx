import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Linking, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { ChevronLeft, Save, Key, Trash2, ExternalLink, Download, Upload, Cloud, Database, LogOut, Award } from 'lucide-react-native';
import { settingsService } from '../services/settings';
import { BackupService } from '../services/backup';
import { showError, showSuccess, showConfirm } from '../utils/errorHandler';
import authService from '../services/authService';
import licenseService from '../services/licenseService';

export default function SettingsScreen({ navigation }: any) {
    const [geminiKey, setGeminiKey] = useState('');
    const [mistralKey, setMistralKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [backupPrefs, setBackupPrefs] = useState<any>(null);
    const [backupLoading, setBackupLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentLicense, setCurrentLicense] = useState<any>(null);

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

            setGeminiKey(keys.gemini || '');
            setMistralKey(keys.mistral || '');
            setBackupPrefs(prefs);
            setCurrentUser(user);
            setCurrentLicense(license);
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
            Alert.alert('Success', 'API keys saved successfully!');
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
});
