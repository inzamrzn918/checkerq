import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { ChevronLeft, Key, Check } from 'lucide-react-native';
import licenseService from '../services/licenseService';

export default function LicenseActivationScreen({ navigation }: any) {
    const [licenseKey, setLicenseKey] = useState('');
    const [loading, setLoading] = useState(false);

    const handleActivate = async () => {
        if (!licenseKey.trim()) {
            Alert.alert('Error', 'Please enter a license key');
            return;
        }

        setLoading(true);
        try {
            const success = await licenseService.activateLicense(licenseKey.trim());

            if (success) {
                Alert.alert('Success', 'License activated successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert('Error', 'Invalid or already activated license key');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to activate license. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const features = {
        free: [
            '5 assessments',
            '50 evaluations/month',
            'Basic features',
        ],
        pro: [
            '100 assessments',
            '1000 evaluations/month',
            'PDF & Excel export',
            'Analytics dashboard',
            'Bulk operations',
        ],
        enterprise: [
            'Unlimited assessments',
            'Unlimited evaluations',
            'All Pro features',
            'API access',
            'Priority support',
        ],
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Activate License</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* License Key Input */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Enter License Key</Text>
                    <View style={styles.inputContainer}>
                        <Key color={theme.colors.textSecondary} size={20} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="CKERQ-XXXXX-XXXXX-XXXXX-XXXXX"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={licenseKey}
                            onChangeText={setLicenseKey}
                            autoCapitalize="characters"
                            autoCorrect={false}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.activateBtn, loading && styles.activateBtnDisabled]}
                        onPress={handleActivate}
                        disabled={loading}
                    >
                        <Text style={styles.activateBtnText}>
                            {loading ? 'Activating...' : 'Activate License'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Feature Comparison */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>License Tiers</Text>

                    {/* Free */}
                    <View style={styles.tierCard}>
                        <View style={styles.tierHeader}>
                            <Text style={styles.tierName}>Free</Text>
                            <Text style={styles.tierPrice}>$0</Text>
                        </View>
                        {features.free.map((feature, index) => (
                            <View key={index} style={styles.featureRow}>
                                <Check color={theme.colors.textSecondary} size={16} />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Pro */}
                    <View style={[styles.tierCard, styles.tierCardPro]}>
                        <View style={styles.tierHeader}>
                            <Text style={styles.tierName}>Pro</Text>
                            <Text style={styles.tierPrice}>Contact Sales</Text>
                        </View>
                        {features.pro.map((feature, index) => (
                            <View key={index} style={styles.featureRow}>
                                <Check color={theme.colors.primary} size={16} />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Enterprise */}
                    <View style={styles.tierCard}>
                        <View style={styles.tierHeader}>
                            <Text style={styles.tierName}>Enterprise</Text>
                            <Text style={styles.tierPrice}>Contact Sales</Text>
                        </View>
                        {features.enterprise.map((feature, index) => (
                            <View key={index} style={styles.featureRow}>
                                <Check color={theme.colors.primary} size={16} />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
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
        flex: 1,
        padding: theme.spacing.lg,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        color: theme.colors.text,
        fontSize: 14,
    },
    activateBtn: {
        backgroundColor: theme.colors.primary,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    activateBtnDisabled: {
        opacity: 0.6,
    },
    activateBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    tierCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 20,
        marginBottom: 16,
    },
    tierCardPro: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },
    tierHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tierName: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: '700',
    },
    tierPrice: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    featureText: {
        color: theme.colors.text,
        fontSize: 14,
    },
});
