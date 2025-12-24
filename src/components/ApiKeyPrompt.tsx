import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Linking,
    Alert,
} from 'react-native';
import { theme } from '../theme/theme';
import { settingsService } from '../services/settings';

interface ApiKeyPromptProps {
    visible: boolean;
    onKeysConfigured: () => void;
}

export default function ApiKeyPrompt({ visible, onKeysConfigured }: ApiKeyPromptProps) {
    const [geminiKey, setGeminiKey] = useState('');
    const [mistralKey, setMistralKey] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!geminiKey.trim()) {
            Alert.alert('Required', 'Gemini API key is required to use the app.');
            return;
        }

        setLoading(true);
        try {
            await settingsService.setApiKeys({
                gemini: geminiKey.trim(),
                mistral: mistralKey.trim() || undefined,
            });
            onKeysConfigured();
        } catch (error) {
            Alert.alert('Error', 'Failed to save API keys. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const openLink = (url: string) => {
        Linking.openURL(url);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Welcome to CheckerQ</Text>
                    <Text style={styles.subtitle}>
                        To use this app, you need to provide your own AI API keys.
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>
                            Gemini API Key <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={geminiKey}
                            onChangeText={setGeminiKey}
                            placeholder="Enter your Gemini API key"
                            placeholderTextColor={theme.colors.textSecondary}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            onPress={() => openLink('https://ai.google.dev/gemini-api/docs/api-key')}
                        >
                            <Text style={styles.link}>How to get Gemini API key →</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Mistral API Key (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={mistralKey}
                            onChangeText={setMistralKey}
                            placeholder="Enter your Mistral API key"
                            placeholderTextColor={theme.colors.textSecondary}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            onPress={() => openLink('https://docs.mistral.ai/getting-started/quickstart/')}
                        >
                            <Text style={styles.link}>How to get Mistral API key →</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.note}>
                        Note: If Mistral key is not provided, Gemini will be used for all operations.
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Saving...' : 'Save and Continue'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
    },
    required: {
        color: theme.colors.error,
    },
    input: {
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    link: {
        fontSize: 14,
        color: theme.colors.primary,
        marginTop: 4,
    },
    note: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: 24,
    },
    button: {
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
