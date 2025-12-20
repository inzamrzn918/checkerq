import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { ChevronLeft, CheckCircle, Award, Share2, Plus, Minus, Download, Save } from 'lucide-react-native';
import { PaperEvaluation, Question as GeminiQuestion } from '../services/gemini';
import { StorageService, Assessment, Evaluation } from '../services/storage';
import { exportGradeCardToPDF } from '../utils/export';

export default function EvaluationResultScreen({ route, navigation }: any) {
    const { evaluation: initialEval, assessment, answerSheet, isResuming }: { evaluation: any, assessment: Assessment, answerSheet: string, isResuming?: boolean } = route.params;
    const [evaluation, setEvaluation] = React.useState(initialEval);
    const [isSaving, setIsSaving] = React.useState(false);

    const isExisting = !!initialEval.id && initialEval.id !== 'temp';

    const scorePercentage = (evaluation.obtainedMarks / evaluation.totalMarks) * 100;

    const getScoreColor = () => {
        if (scorePercentage >= 80) return theme.colors.success;
        if (scorePercentage >= 50) return theme.colors.warning;
        return theme.colors.error;
    };

    const adjustMark = (resIdx: number, delta: number) => {
        const newResults = [...evaluation.results];
        const res = { ...newResults[resIdx] };

        // Find max marks for this question
        const q = assessment.questions.find(q => q.id === res.questionId);
        const maxMarks = q?.marks || 10;

        const newMark = Math.max(0, Math.min(maxMarks, res.obtainedMarks + delta));
        if (newMark === res.obtainedMarks) return;

        res.obtainedMarks = newMark;
        newResults[resIdx] = res;

        const newTotalObtained = newResults.reduce((acc, curr) => acc + curr.obtainedMarks, 0);

        setEvaluation({
            ...evaluation,
            results: newResults,
            obtainedMarks: newTotalObtained
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const evalData: Evaluation = {
                id: isExisting ? initialEval.id : Math.random().toString(36).substr(2, 9),
                assessmentId: assessment.id,
                studentImage: answerSheet,
                totalMarks: evaluation.totalMarks,
                obtainedMarks: evaluation.obtainedMarks,
                overallFeedback: evaluation.overallFeedback,
                results: evaluation.results,
                createdAt: evaluation.createdAt || Date.now()
            };

            if (isExisting) {
                // In a real app we might need an updateEvaluation method, 
                // but saveEvaluation uses INSERT OR REPLACE if we set it up correctly in storage.ts
                await StorageService.saveEvaluation(evalData);
            } else {
                await StorageService.saveEvaluation(evalData);
            }
            navigation.navigate('Home');
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        try {
            const evForStorage = {
                id: 'temp',
                assessmentId: assessment.id,
                studentImage: answerSheet,
                totalMarks: evaluation.totalMarks,
                obtainedMarks: evaluation.obtainedMarks,
                overallFeedback: evaluation.overallFeedback,
                results: evaluation.results,
                createdAt: Date.now()
            };
            await exportGradeCardToPDF(evForStorage, assessment);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Evaluation Result</Text>
                <TouchableOpacity onPress={handleExport}>
                    <Download color={theme.colors.text} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.scoreSection}>
                    <View style={[styles.scoreBadge, { borderColor: getScoreColor() }]}>
                        <Text style={[styles.scoreText, { color: getScoreColor() }]}>
                            {evaluation.obtainedMarks}/{evaluation.totalMarks}
                        </Text>
                        <Text style={styles.scoreLabel}>Final Mark</Text>
                    </View>

                    <Award color={getScoreColor()} size={48} style={styles.medalIcon} />
                </View>

                <View style={styles.feedbackCard}>
                    <Text style={styles.feedbackTitle}>Overall Performance</Text>
                    <Text style={styles.feedbackText}>{evaluation.overallFeedback}</Text>
                </View>

                <Text style={styles.sectionTitle}>Review & Adjust Marks</Text>
                {evaluation.results.map((res: any, idx: number) => {
                    const q = assessment.questions.find(foundQ => foundQ.id === res.questionId);
                    return (
                        <View key={idx} style={styles.breakdownCard}>
                            <View style={styles.resHeader}>
                                <View style={styles.qInfo}>
                                    <Text style={styles.resQNum}>Question {idx + 1}</Text>
                                    <Text style={styles.qText} numberOfLines={2}>{q?.text}</Text>
                                </View>
                                <View style={styles.markAdjustment}>
                                    <TouchableOpacity style={styles.adjBtn} onPress={() => adjustMark(idx, -1)}>
                                        <Minus size={16} color={theme.colors.text} />
                                    </TouchableOpacity>
                                    <View style={styles.resMarkBadge}>
                                        <Text style={styles.resMarkText}>{res.obtainedMarks}/{q?.marks || '?'}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.adjBtn} onPress={() => adjustMark(idx, 1)}>
                                        <Plus size={16} color={theme.colors.text} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <Text style={styles.ansLabel}>Student Answer:</Text>
                            <Text style={styles.ansText}>"{res.studentAnswer}"</Text>

                            <View style={styles.aiFeedback}>
                                <Text style={styles.aiLabel}>AI Feedback:</Text>
                                <Text style={styles.aiText}>{res.feedback}</Text>
                            </View>
                        </View>
                    );
                })}

                <TouchableOpacity
                    style={[styles.doneBtn, isSaving && styles.disabledBtn]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? <ActivityIndicator color="#fff" /> : (
                        <>
                            {isExisting ? <Save color="#fff" size={20} /> : <CheckCircle color="#fff" size={20} />}
                            <Text style={styles.doneBtnText}>
                                {isExisting ? 'Update & Close' : 'Save Results & Close'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
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
    scoreSection: {
        alignItems: 'center',
        marginVertical: 32,
        position: 'relative',
    },
    scoreBadge: {
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
    },
    scoreText: {
        fontSize: 42,
        fontWeight: '800',
    },
    scoreLabel: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        marginTop: 4,
    },
    medalIcon: {
        position: 'absolute',
        bottom: -10,
        right: '25%',
    },
    feedbackCard: {
        backgroundColor: theme.colors.surface,
        padding: 20,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
        marginBottom: 32,
    },
    feedbackTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    feedbackText: {
        color: theme.colors.textSecondary,
        fontSize: 15,
        lineHeight: 22,
    },
    sectionTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    breakdownCard: {
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    resHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    resQNum: {
        color: theme.colors.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    resMarkBadge: {
        backgroundColor: theme.colors.primary + '20',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    resMarkText: {
        color: theme.colors.primary,
        fontWeight: '700',
    },
    ansLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    ansText: {
        color: theme.colors.text,
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 12,
        backgroundColor: theme.colors.background,
        padding: 10,
        borderRadius: 8,
    },
    aiLabel: {
        color: theme.colors.success,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    aiFeedback: {
        backgroundColor: theme.colors.success + '10',
        padding: 12,
        borderRadius: 8,
    },
    aiText: {
        color: theme.colors.text,
        fontSize: 14,
    },
    qInfo: {
        flex: 1,
        marginRight: 8,
    },
    qText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    markAdjustment: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    adjBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    disabledBtn: {
        backgroundColor: theme.colors.border,
    },
    doneBtn: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        padding: 18,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        gap: 12,
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
