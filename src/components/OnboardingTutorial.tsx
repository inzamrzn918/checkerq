import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme/theme';
import { CheckCircle, X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const ONBOARDING_KEY = 'onboarding_completed';

interface OnboardingStep {
    title: string;
    description: string;
    icon: string;
}

const steps: OnboardingStep[] = [
    {
        title: 'Welcome to CheckerQ',
        description: 'AI-powered exam evaluation made easy. Scan, evaluate, and export results in minutes.',
        icon: '👋',
    },
    {
        title: 'Create an Assessment',
        description: 'Upload your question paper and let AI extract questions automatically. Review and save.',
        icon: '📝',
    },
    {
        title: 'Evaluate Students',
        description: 'Scan student cover page, then scan answer sheets. AI evaluates and provides detailed feedback.',
        icon: '✅',
    },
    {
        title: 'View & Export Results',
        description: 'View detailed reports with visual marks. Export to PDF or Excel for record-keeping.',
        icon: '📊',
    },
];

interface OnboardingTutorialProps {
    visible: boolean;
    onComplete: () => void;
}

export default function OnboardingTutorial({ visible, onComplete }: OnboardingTutorialProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        onComplete();
    };

    const step = steps[currentStep];

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>

                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        <Text style={styles.icon}>{step.icon}</Text>
                        <Text style={styles.title}>{step.title}</Text>
                        <Text style={styles.description}>{step.description}</Text>
                    </ScrollView>

                    <View style={styles.footer}>
                        <View style={styles.pagination}>
                            {steps.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        index === currentStep && styles.dotActive,
                                    ]}
                                />
                            ))}
                        </View>

                        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                            <Text style={styles.nextButtonText}>
                                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export const checkOnboardingStatus = async (): Promise<boolean> => {
    const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
    return completed === 'true';
};

export const resetOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.9,
        maxWidth: 400,
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: 24,
        maxHeight: height * 0.7,
    },
    skipButton: {
        alignSelf: 'flex-end',
        padding: 8,
    },
    skipText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    icon: {
        fontSize: 80,
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        marginTop: 24,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.border,
    },
    dotActive: {
        backgroundColor: theme.colors.primary,
        width: 24,
    },
    nextButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
