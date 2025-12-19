import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { ChevronLeft, Save, Key } from 'lucide-react-native';
import { GeminiService } from '../services/gemini';

export default function SettingsScreen({ navigation }: any) {
    const [apiKey, setApiKey] = useState('');

    const saveSettings = () => {
        if (!apiKey) {
            Alert.alert('Error', 'Please enter an API key');
            return;
        }
        GeminiService.setApiKey(apiKey);
        Alert.alert('Success', 'API Key saved successfully!');
        navigation.goBack();
    };

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
                    <Text style={styles.sectionTitle}>Gemini AI Configuration</Text>
                    <Text style={styles.subText}>Enter your Google Gemini API Key to enable automated evaluation.</Text>

                    <View style={styles.inputContainer}>
                        <Key color={theme.colors.textSecondary} size={20} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter API Key"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={apiKey}
                            onChangeText={setApiKey}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity style={styles.keyLink}>
                        <Text style={styles.linkText}>Where do I get an API Key?</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
                    <Save color="#fff" size={20} />
                    <Text style={styles.saveBtnText}>Save Settings</Text>
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
    keyLink: {
        marginTop: 12,
    },
    linkText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
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
    saveBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
