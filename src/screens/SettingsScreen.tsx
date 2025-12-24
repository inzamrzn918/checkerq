import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { ChevronLeft, Save, Key } from 'lucide-react-native';
import { settingsService } from '../services/settings';

export default function SettingsScreen({ navigation }: any) {
    const [geminiKey, setGeminiKey] = useState('');
    const [mistralKey, setMistralKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadKeys();
    }, []);

    const loadKeys = async () => {
        try {
            const keys = await settingsService.getApiKeys();
            setGeminiKey(keys.gemini || '');
            setMistralKey(keys.mistral || '');
        } catch (error) {
            Alert.alert('Error', 'Failed to load API keys');
        } finally {
            setLoading(false);
        }
    };

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

            <View style={styles.content}>
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
            </View>
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
});
