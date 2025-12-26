import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import authService from '../services/authService';
import { useConfig } from '../context/ConfigContext';

export default function LoginScreen({ navigation }: any) {
    const { config } = useConfig();
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);

    // Check if Google Sign-In is enabled via feature flag
    const googleSignInEnabled = config?.feature_flags?.google_signin_enabled ?? true;

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            await authService.initialize();
            const isAuth = await authService.isAuthenticated();

            if (isAuth) {
                navigation.replace('Home');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setInitializing(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const user = await authService.signInWithGoogle();

            if (user) {
                navigation.replace('Home');
            } else {
                // Show error
                alert('Sign in failed. Please try again.');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            alert('Sign in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
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
            <View style={styles.content}>
                {/* Logo/Branding */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>📝</Text>
                    </View>
                    <Text style={styles.title}>CheckerQ</Text>
                    <Text style={styles.subtitle}>AI-Powered Exam Evaluation</Text>
                </View>

                {/* Features */}
                <View style={styles.features}>
                    <View style={styles.feature}>
                        <Text style={styles.featureIcon}>✓</Text>
                        <Text style={styles.featureText}>Automated grading with AI</Text>
                    </View>
                    <View style={styles.feature}>
                        <Text style={styles.featureIcon}>✓</Text>
                        <Text style={styles.featureText}>Detailed feedback for students</Text>
                    </View>
                    <View style={styles.feature}>
                        <Text style={styles.featureIcon}>✓</Text>
                        <Text style={styles.featureText}>Analytics and insights</Text>
                    </View>
                </View>

                {/* Sign In Button - Only show if enabled via feature flag */}
                {googleSignInEnabled && (
                    <TouchableOpacity
                        style={[styles.signInButton, loading && styles.signInButtonDisabled]}
                        onPress={handleGoogleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.googleIcon}>G</Text>
                                <Text style={styles.signInButtonText}>Sign in with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* Development Notice */}
                <View style={styles.noticeContainer}>
                    <Text style={styles.noticeTitle}>⚠️ Development Notice</Text>
                    <Text style={styles.noticeText}>
                        Google Sign-In requires a development build or production APK.{'\n\n'}
                        For now, you can explore the app's features without authentication.
                    </Text>
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => navigation.replace('Home')}
                    >
                        <Text style={styles.skipButtonText}>Skip to App</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.terms}>
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </Text>
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
    content: {
        flex: 1,
        padding: theme.spacing.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: {
        fontSize: 50,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    features: {
        marginBottom: 40,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    featureIcon: {
        fontSize: 20,
        color: theme.colors.primary,
        marginRight: 12,
    },
    featureText: {
        fontSize: 16,
        color: theme.colors.text,
    },
    signInButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        padding: 18,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    signInButtonDisabled: {
        opacity: 0.6,
    },
    googleIcon: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    signInButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    noticeContainer: {
        marginTop: 24,
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fbbf24',
    },
    noticeTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fbbf24',
        marginBottom: 8,
    },
    noticeText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    skipButton: {
        backgroundColor: theme.colors.primary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    terms: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
        marginTop: 16,
    },
});
