import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { ChevronLeft, FileText, Search, Trash2, Calendar } from 'lucide-react-native';
import { StorageService, Assessment, Evaluation } from '../services/storage';

export default function HistoryScreen({ navigation }: any) {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        const [eData, aData] = await Promise.all([
            StorageService.getEvaluations(),
            StorageService.getAssessments()
        ]);
        setEvaluations(eData);
        setAssessments(aData);
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

    const handleDelete = async (id: string) => {
        try {
            await StorageService.deleteEvaluation(id);
            loadData();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Evaluation History</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {evaluations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <FileText color={theme.colors.border} size={64} />
                        <Text style={styles.emptyText}>No evaluations yet.</Text>
                    </View>
                ) : (
                    evaluations.map(item => {
                        const assessment = assessments.find(a => a.id === item.assessmentId);
                        const score = Math.round((item.obtainedMarks / item.totalMarks) * 100);

                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.historyCard}
                                onPress={() => navigation.navigate('EvaluationResult', {
                                    evaluation: item,
                                    assessment,
                                    answerSheet: item.studentImage
                                })}
                            >
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={styles.subjectText}>{assessment?.subject || 'Unknown Subject'}</Text>
                                        <View style={styles.metaRow}>
                                            <Calendar size={12} color={theme.colors.textSecondary} />
                                            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.scoreBadge, { backgroundColor: score >= 50 ? theme.colors.success + '15' : theme.colors.error + '15' }]}>
                                        <Text style={[styles.scoreText, { color: score >= 50 ? theme.colors.success : theme.colors.error }]}>
                                            {score}%
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={() => handleDelete(item.id)}
                                    >
                                        <Trash2 size={20} color={theme.colors.error} />
                                    </TouchableOpacity>
                                </View>
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
    historyCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subjectText: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    scoreBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    scoreText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
        marginTop: 16,
    },
    deleteBtn: {
        marginLeft: 12,
        padding: 8,
    },
});
