import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { Plus, FileText, Settings as SettingsIcon, History, ClipboardCheck, ChevronRight } from 'lucide-react-native';
import { StorageService, Assessment } from '../services/storage';

export default function HomeScreen({ navigation }: any) {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadAssessments = useCallback(async () => {
        const data = await StorageService.getAssessments();
        setAssessments(data);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadAssessments();
        }, [loadAssessments])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAssessments();
        setRefreshing(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello Teacher,</Text>
                    <Text style={styles.title}>CheckerQ Dashboard</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <SettingsIcon color={theme.colors.text} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{assessments.length}</Text>
                        <Text style={styles.statLabel}>Assessments</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>150</Text>
                        <Text style={styles.statLabel}>Evaluated</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('SetupAssessment')}
                >
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                        <FileText color={theme.colors.primary} size={28} />
                    </View>
                    <View style={styles.actionText}>
                        <Text style={styles.actionTitle}>New Exam Assessment</Text>
                        <Text style={styles.actionSub}>Upload question paper & set marking scheme</Text>
                    </View>
                    <Plus color={theme.colors.textSecondary} size={20} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('Evaluation')}
                >
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondary + '20' }]}>
                        <ClipboardCheck color={theme.colors.secondary} size={28} />
                    </View>
                    <View style={styles.actionText}>
                        <Text style={styles.actionTitle}>Start Evaluation</Text>
                        <Text style={styles.actionSub}>Scan answer sheets for an active assessment</Text>
                    </View>
                    <Plus color={theme.colors.textSecondary} size={20} />
                </TouchableOpacity>

                <View style={styles.recentSection}>
                    <Text style={styles.sectionTitle}>Recent Assessments</Text>
                    {assessments.length === 0 ? (
                        <View style={styles.emptyRecent}>
                            <History color={theme.colors.border} size={48} />
                            <Text style={styles.emptyText}>No assessments yet. Create one to get started!</Text>
                        </View>
                    ) : (
                        assessments.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.assessmentItem}
                                onPress={() => navigation.navigate('Evaluation', { assessment: item })}
                            >
                                <View style={styles.assessmentIcon}>
                                    <FileText color={theme.colors.primary} size={20} />
                                </View>
                                <View style={styles.assessmentInfo}>
                                    <Text style={styles.assessmentTitle}>{item.title}</Text>
                                    <Text style={styles.assessmentSub}>
                                        {item.subject} • {item.classRoom}
                                    </Text>
                                </View>
                                <ChevronRight color={theme.colors.textSecondary} size={20} />
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('SetupAssessment')}
            >
                <Plus color="#fff" size={32} />
            </TouchableOpacity>
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
        paddingTop: theme.spacing.xl,
    },
    greeting: {
        color: theme.colors.textSecondary,
        fontSize: 16,
    },
    title: {
        color: theme.colors.text,
        fontSize: 28,
        fontWeight: '800',
    },
    scrollContent: {
        padding: theme.spacing.lg,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    statValue: {
        color: theme.colors.primary,
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        marginTop: 4,
    },
    sectionTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: theme.spacing.md,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    actionText: {
        flex: 1,
    },
    actionTitle: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    actionSub: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    recentSection: {
        marginTop: theme.spacing.lg,
    },
    emptyRecent: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 16,
        fontSize: 14,
    },
    assessmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    assessmentIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: theme.colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    assessmentInfo: {
        flex: 1,
    },
    assessmentTitle: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    assessmentSub: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: theme.colors.primary,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.md,
    },
});
