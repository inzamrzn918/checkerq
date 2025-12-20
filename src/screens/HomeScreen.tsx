import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { Plus, FileText, Settings as SettingsIcon, History, ClipboardCheck, ChevronRight, Filter, Download } from 'lucide-react-native';
import { StorageService, Assessment, Evaluation } from '../services/storage';
import { exportAllAssessmentsToExcel } from '../utils/export';

export default function HomeScreen({ navigation }: any) {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [filterSubject, setFilterSubject] = useState<string>('');
    const [filterClass, setFilterClass] = useState<string>('');

    const loadData = useCallback(async () => {
        const [aData, eData] = await Promise.all([
            StorageService.getAssessments(),
            StorageService.getEvaluations()
        ]);
        setAssessments(aData);
        setEvaluations(eData);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleExportExcel = async () => {
        try {
            await exportAllAssessmentsToExcel(assessments, evaluations);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const subjects = Array.from(new Set(assessments.map(a => a.subject).filter(Boolean)));
    const classes = Array.from(new Set(assessments.map(a => a.classRoom).filter(Boolean)));

    const filteredAssessments = assessments.filter(a => {
        const matchSubject = !filterSubject || a.subject === filterSubject;
        const matchClass = !filterClass || a.classRoom === filterClass;
        return matchSubject && matchClass;
    });

    const totalQuestions = assessments.reduce((acc, curr) => acc + curr.questions.length, 0);

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
                        <View style={[styles.statIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                            <FileText color={theme.colors.primary} size={20} />
                        </View>
                        <View>
                            <Text style={styles.statValue}>{assessments.length}</Text>
                            <Text style={styles.statLabel}>Assessments</Text>
                        </View>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                            <ClipboardCheck color={theme.colors.secondary} size={20} />
                        </View>
                        <View>
                            <Text style={styles.statValue}>{evaluations.length}</Text>
                            <Text style={styles.statLabel}>Evaluated</Text>
                        </View>
                    </View>
                </View>

                {assessments.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Filters</Text>
                            <TouchableOpacity onPress={handleExportExcel} style={styles.exportLink}>
                                <Download size={16} color={theme.colors.primary} />
                                <Text style={styles.exportText}>Export All</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                            <TouchableOpacity
                                style={[styles.filterChip, !filterSubject && styles.filterChipActive]}
                                onPress={() => setFilterSubject('')}
                            >
                                <Text style={[styles.filterChipText, !filterSubject && styles.filterChipTextActive]}>All Subjects</Text>
                            </TouchableOpacity>
                            {subjects.map(sub => (
                                <TouchableOpacity
                                    key={sub}
                                    style={[styles.filterChip, filterSubject === sub && styles.filterChipActive]}
                                    onPress={() => setFilterSubject(sub)}
                                >
                                    <Text style={[styles.filterChipText, filterSubject === sub && styles.filterChipTextActive]}>{sub}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterContainer, { marginTop: 8, marginBottom: 24 }]}>
                            <TouchableOpacity
                                style={[styles.filterChip, !filterClass && styles.filterChipActive]}
                                onPress={() => setFilterClass('')}
                            >
                                <Text style={[styles.filterChipText, !filterClass && styles.filterChipTextActive]}>All Classes</Text>
                            </TouchableOpacity>
                            {classes.map(cls => (
                                <TouchableOpacity
                                    key={cls}
                                    style={[styles.filterChip, filterClass === cls && styles.filterChipActive]}
                                    onPress={() => setFilterClass(cls)}
                                >
                                    <Text style={[styles.filterChipText, filterClass === cls && styles.filterChipTextActive]}>{cls}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}

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

                {evaluations.length > 0 && (
                    <View style={styles.recentSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Evaluations</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('History')}>
                                <Text style={styles.viewAll}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evalScroll}>
                            {evaluations.slice(0, 5).map(evalItem => {
                                const assessment = assessments.find(a => a.id === evalItem.assessmentId);
                                return (
                                    <TouchableOpacity
                                        key={evalItem.id}
                                        style={styles.evalCard}
                                        onPress={() => navigation.navigate('EvaluationResult', {
                                            evaluation: evalItem,
                                            assessment,
                                            answerSheet: evalItem.studentImage
                                        })}
                                    >
                                        <View style={styles.evalScoreCircle}>
                                            <Text style={styles.evalScoreText}>
                                                {Math.round((evalItem.obtainedMarks / evalItem.totalMarks) * 100)}%
                                            </Text>
                                        </View>
                                        <Text style={styles.evalTitle} numberOfLines={1}>
                                            {assessment?.subject || 'Unknown'}
                                        </Text>
                                        <Text style={styles.evalSub}>
                                            {new Date(evalItem.createdAt).toLocaleDateString()}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.recentSection}>
                    <Text style={styles.sectionTitle}>Assessments ({filteredAssessments.length})</Text>
                    {filteredAssessments.length === 0 ? (
                        <View style={styles.emptyRecent}>
                            <History color={theme.colors.border} size={48} />
                            <Text style={styles.emptyText}>No matching assessments found.</Text>
                        </View>
                    ) : (
                        filteredAssessments.map(item => (
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
                                    <View style={styles.metaRow}>
                                        <Text style={styles.assessmentSub}>
                                            {item.subject} • {item.classRoom}
                                        </Text>
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{item.questions.length} Qs</Text>
                                        </View>
                                    </View>
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
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 12,
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
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
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 8,
    },
    badge: {
        backgroundColor: theme.colors.primary + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: '700',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    exportLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    exportText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    filterContainer: {
        marginBottom: theme.spacing.md,
    },
    filterChip: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    filterChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterChipText: {
        color: theme.colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#fff',
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
    evalScroll: {
        marginBottom: theme.spacing.lg,
    },
    evalCard: {
        width: 140,
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 16,
        marginRight: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    evalScoreCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    evalScoreText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    evalTitle: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    evalSub: {
        color: theme.colors.textSecondary,
        fontSize: 11,
    },
    viewAll: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
