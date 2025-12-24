import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { ChevronLeft, TrendingUp, Users, Award, FileText } from 'lucide-react-native';
import { StorageService, Assessment, Evaluation } from '../services/storage';
import { AnalyticsService } from '../services/analytics';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';

export default function AnalyticsScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setLoading(true);
        const [aData, eData] = await Promise.all([
            StorageService.getAssessments(),
            StorageService.getEvaluations(),
        ]);
        setAssessments(aData);
        setEvaluations(eData);
        setLoading(false);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading analytics...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (evaluations.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ChevronLeft color={theme.colors.text} size={28} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Analytics</Text>
                    <View style={{ width: 28 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <FileText color={theme.colors.textSecondary} size={64} />
                    <Text style={styles.emptyText}>No Data Available</Text>
                    <Text style={styles.emptySubText}>
                        Start evaluating students to see analytics
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Calculate analytics
    const classPerformance = AnalyticsService.getClassPerformance(evaluations, assessments);
    const topPerformers = AnalyticsService.getTopPerformers(evaluations, 5);
    const subjectInsights = AnalyticsService.getSubjectInsights(evaluations, assessments);

    // Overall stats
    const totalEvaluations = evaluations.length;
    const totalStudents = new Set(evaluations.map(e => e.studentName)).size;
    const avgScore = evaluations.reduce((sum, e) => sum + (e.obtainedMarks / e.totalMarks) * 100, 0) / evaluations.length;
    const passRate = (evaluations.filter(e => (e.obtainedMarks / e.totalMarks) * 100 >= 60).length / evaluations.length) * 100;

    // Grade distribution data
    const allGrades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    evaluations.forEach(e => {
        const percentage = (e.obtainedMarks / e.totalMarks) * 100;
        let grade = 'F';
        if (percentage >= 90) grade = 'A';
        else if (percentage >= 80) grade = 'B';
        else if (percentage >= 70) grade = 'C';
        else if (percentage >= 60) grade = 'D';
        allGrades[grade as keyof typeof allGrades]++;
    });

    const gradeChartData = [
        { name: 'A', population: allGrades.A, color: '#10b981', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'B', population: allGrades.B, color: '#3b82f6', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'C', population: allGrades.C, color: '#f59e0b', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'D', population: allGrades.D, color: '#ef4444', legendFontColor: theme.colors.text, legendFontSize: 12 },
        { name: 'F', population: allGrades.F, color: '#991b1b', legendFontColor: theme.colors.text, legendFontSize: 12 },
    ].filter(g => g.population > 0);

    // Class performance chart data
    const classChartData = {
        labels: classPerformance.map(c => c.className),
        datasets: [{ data: classPerformance.map(c => c.averageScore) }],
    };

    // Subject performance chart data
    const subjectChartData = {
        labels: subjectInsights.slice(0, 5).map(s => s.subject),
        datasets: [{ data: subjectInsights.slice(0, 5).map(s => s.avgScore) }],
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Analytics</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Overview Cards */}
                <View style={styles.cardsContainer}>
                    <View style={[styles.card, { backgroundColor: '#dbeafe' }]}>
                        <FileText color="#3b82f6" size={24} />
                        <Text style={styles.cardValue}>{totalEvaluations}</Text>
                        <Text style={styles.cardLabel}>Evaluations</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: '#ddd6fe' }]}>
                        <Users color="#8b5cf6" size={24} />
                        <Text style={styles.cardValue}>{totalStudents}</Text>
                        <Text style={styles.cardLabel}>Students</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: '#dcfce7' }]}>
                        <TrendingUp color="#10b981" size={24} />
                        <Text style={styles.cardValue}>{Math.round(avgScore)}%</Text>
                        <Text style={styles.cardLabel}>Avg Score</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: '#fef3c7' }]}>
                        <Award color="#f59e0b" size={24} />
                        <Text style={styles.cardValue}>{Math.round(passRate)}%</Text>
                        <Text style={styles.cardLabel}>Pass Rate</Text>
                    </View>
                </View>

                {/* Class Performance */}
                {classPerformance.length > 0 && (
                    <View style={styles.section}>
                        <BarChart data={classChartData} title="Class Performance" yAxisSuffix="%" />
                    </View>
                )}

                {/* Grade Distribution */}
                {gradeChartData.length > 0 && (
                    <View style={styles.section}>
                        <PieChart data={gradeChartData} title="Grade Distribution" />
                    </View>
                )}

                {/* Subject Performance */}
                {subjectInsights.length > 0 && (
                    <View style={styles.section}>
                        <BarChart data={subjectChartData} title="Top 5 Subjects" yAxisSuffix="%" />
                    </View>
                )}

                {/* Top Performers */}
                {topPerformers.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Top Performers</Text>
                        {topPerformers.map((student, index) => (
                            <View key={index} style={styles.performerCard}>
                                <View style={styles.rankBadge}>
                                    <Text style={styles.rankText}>#{index + 1}</Text>
                                </View>
                                <Text style={styles.performerName}>{student.name}</Text>
                                <Text style={styles.performerScore}>{student.avgScore}%</Text>
                            </View>
                        ))}
                    </View>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: 40,
    },
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    card: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cardValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 8,
    },
    cardLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
    },
    performerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    performerName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    performerScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
});
