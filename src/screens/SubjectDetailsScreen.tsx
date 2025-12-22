import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { ChevronLeft, User, FileText, ChevronRight } from 'lucide-react-native';
import { StorageService, Assessment, Evaluation } from '../services/storage';

export default function SubjectDetailsScreen({ route, navigation }: any) {
    const { subject, classRoom } = route.params;
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        const [aData, eData] = await Promise.all([
            StorageService.getAssessments(),
            StorageService.getEvaluations()
        ]);

        // Filter assessments for this subject (and class if provided)
        const relevantAssessments = aData.filter(a =>
            a.subject === subject &&
            (!classRoom || a.classRoom === classRoom)
        );

        // Filter evaluations that belong to these assessments
        const relevantEvaluations = eData.filter(e =>
            relevantAssessments.some(a => a.id === e.assessmentId)
        );

        setAssessments(relevantAssessments);
        setEvaluations(relevantEvaluations);
    }, [subject, classRoom]);

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

    // Group evaluations by Student
    // Since we might have multiple exams for the same student in this subject,
    // we should probably list "Students" and then show their latest exam?
    // OR just list every evaluation card with the student name prominently?
    // User asked "list all students... click student name show report"
    // So let's list unique students.

    const uniqueStudents = Array.from(new Set(evaluations.map(e => e.studentName))).filter(Boolean);

    // Map student to their evaluations
    const studentMap: Record<string, Evaluation[]> = {};
    evaluations.forEach(e => {
        if (!e.studentName) return;
        if (!studentMap[e.studentName]) studentMap[e.studentName] = [];
        studentMap[e.studentName].push(e);
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>{subject}</Text>
                    <Text style={styles.subtitle}>{classRoom || 'All Classes'}</Text>
                </View>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Text style={styles.sectionTitle}>Students ({uniqueStudents.length})</Text>

                {uniqueStudents.length === 0 ? (
                    <View style={styles.emptyState}>
                        <User color={theme.colors.border} size={48} />
                        <Text style={styles.emptyText}>No students evaluated yet.</Text>
                    </View>
                ) : (
                    uniqueStudents.map((studentName, index) => {
                        const studentEvals = studentMap[studentName as string];
                        // Get latest evaluation
                        const latestEval = studentEvals.sort((a, b) => b.createdAt - a.createdAt)[0];
                        const assessment = assessments.find(a => a.id === latestEval.assessmentId);

                        return (
                            <TouchableOpacity
                                key={index}
                                style={styles.studentCard}
                                onPress={() => navigation.navigate('EvaluationResult', {
                                    evaluation: latestEval,
                                    assessment: assessment,
                                    answerSheet: latestEval.studentImage // Fallback
                                })}
                            >
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{(studentName as string).charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName}>{studentName}</Text>
                                    <Text style={styles.examTitle}>{assessment?.title || 'Unknown Exam'}</Text>
                                    <View style={styles.marksContainer}>
                                        <Text style={styles.marksText}>
                                            {latestEval.obtainedMarks}/{latestEval.totalMarks}
                                        </Text>
                                        <Text style={styles.dateText}>
                                            {new Date(latestEval.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                                <ChevronRight color={theme.colors.textSecondary} size={20} />
                            </TouchableOpacity>
                        );
                    })
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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    content: {
        padding: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: theme.colors.primary,
        fontSize: 20,
        fontWeight: 'bold',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
    },
    examTitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    marksContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    marksText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.success,
    },
    dateText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
        marginTop: 16,
    },
});
