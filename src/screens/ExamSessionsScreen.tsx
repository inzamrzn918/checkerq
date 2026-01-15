import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { ChevronLeft, BookOpen, ChevronRight, Trash2 } from 'lucide-react-native';
import { StorageService, Assessment } from '../services/storage';

export default function ExamSessionsScreen({ route, navigation }: any) {
    const { examType, classRoom } = route.params;
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        const aData = await StorageService.getAssessments();

        // Filter assessments for this examType and class
        const relevantAssessments = aData.filter(a =>
            a.examType === examType &&
            a.classRoom === classRoom
        );

        setAssessments(relevantAssessments);
    }, [examType, classRoom]);

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

    const handleDeleteSubjectExams = async (subjectName: string) => {
        const examsToDelete = subjectGroups[subjectName] || [];
        Alert.alert(
            'Delete Subject Exams?',
            `Are you sure you want to delete all ${examsToDelete.length} exams and their results for ${subjectName} in this session? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            for (const assessment of examsToDelete) {
                                await StorageService.deleteAssessment(assessment.id);
                                // Also delete evaluations for this assessment
                                const evals = await StorageService.getEvaluations(assessment.id);
                                for (const e of evals) {
                                    await StorageService.deleteEvaluation(e.id);
                                }
                            }
                            loadData();
                        } catch (error) {
                            console.error('Delete assessment failed:', error);
                        }
                    }
                }
            ]
        );
    };

    // Group by Subject
    const subjectGroups: Record<string, Assessment[]> = {};
    assessments.forEach(a => {
        if (!a.subject) return;
        if (!subjectGroups[a.subject]) subjectGroups[a.subject] = [];
        subjectGroups[a.subject].push(a);
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.title}>{examType}</Text>
                    <Text style={styles.subtitle}>{classRoom}</Text>
                </View>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Text style={styles.sectionTitle}>Subjects</Text>

                {Object.keys(subjectGroups).length === 0 ? (
                    <View style={styles.emptyState}>
                        <BookOpen color={theme.colors.border} size={48} />
                        <Text style={styles.emptyText}>No subjects found for this session.</Text>
                    </View>
                ) : (
                    Object.keys(subjectGroups).map((subject, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.subjectCard}
                            onPress={() => navigation.navigate('SubjectDetails', {
                                subject,
                                classRoom,
                                examType
                            })}
                        >
                            <View style={styles.subjectIconBox}>
                                <BookOpen color={theme.colors.primary} size={24} />
                            </View>
                            <View style={styles.subjectInfo}>
                                <Text style={styles.subjectName}>{subject}</Text>
                                <Text style={styles.examCount}>{subjectGroups[subject].length} Exams recorded</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => handleDeleteSubjectExams(subject)}
                            >
                                <Trash2 size={18} color={theme.colors.error} />
                            </TouchableOpacity>
                            <ChevronRight color={theme.colors.textSecondary} size={20} />
                        </TouchableOpacity>
                    ))
                )}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    content: {
        padding: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    subjectCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    subjectIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    subjectInfo: {
        flex: 1,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 2,
    },
    examCount: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
        marginTop: 16,
    },
    deleteBtn: {
        padding: 8,
        marginRight: 8,
    },
});
