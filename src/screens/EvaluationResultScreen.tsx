import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { ChevronLeft, CheckCircle, XCircle, Award, Share2 } from 'lucide-react-native';
import { PaperEvaluation } from '../services/gemini';

export default function EvaluationResultScreen({ route, navigation }: any) {
    const { evaluation }: { evaluation: PaperEvaluation } = route.params;

    const scorePercentage = (evaluation.obtainedMarks / evaluation.totalMarks) * 100;

    const getScoreColor = () => {
        if (scorePercentage >= 80) return theme.colors.success;
        if (scorePercentage >= 50) return theme.colors.warning;
        return theme.colors.error;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Evaluation Result</Text>
                <TouchableOpacity>
                    <Share2 color={theme.colors.text} size={24} />
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

                <Text style={styles.sectionTitle}>Question Breakdown</Text>
                {evaluation.results.map((res, idx) => (
                    <View key={idx} style={styles.breakdownCard}>
                        <View style={styles.resHeader}>
                            <Text style={styles.resQNum}>Question {idx + 1}</Text>
                            <View style={styles.resMarkBadge}>
                                <Text style={styles.resMarkText}>{res.obtainedMarks} pts</Text>
                            </View>
                        </View>

                        <Text style={styles.ansLabel}>Student Answer:</Text>
                        <Text style={styles.ansText}>"{res.studentAnswer}"</Text>

                        <View style={styles.aiFeedback}>
                            <Text style={styles.aiLabel}>AI Feedback:</Text>
                            <Text style={styles.aiText}>{res.feedback}</Text>
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => navigation.navigate('Home')}
                >
                    <CheckCircle color="#fff" size={20} />
                    <Text style={styles.doneBtnText}>Back to Dashboard</Text>
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
