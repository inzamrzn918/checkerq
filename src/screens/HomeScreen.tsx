import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { Plus, FileText, Settings as SettingsIcon, ClipboardCheck, ChevronRight, BookOpen, HelpCircle, Users } from 'lucide-react-native';
import { StorageService, Assessment, Evaluation } from '../services/storage';
import { settingsService } from '../services/settings';
import ApiKeyPrompt from '../components/ApiKeyPrompt';
import SearchBar from '../components/SearchBar';
import OnboardingTutorial, { checkOnboardingStatus } from '../components/OnboardingTutorial';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedClass, setSelectedClass] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        // Check if API keys are configured
        const hasKeys = await settingsService.hasValidKeys();
        setShowApiKeyPrompt(!hasKeys);

        // Check if onboarding has been shown
        if (hasKeys) {
            const onboardingCompleted = await checkOnboardingStatus();
            if (!onboardingCompleted) {
                setShowOnboarding(true);
            }
        }

        const [aData, eData] = await Promise.all([
            StorageService.getAssessments(),
            StorageService.getEvaluations()
        ]);
        // Sort by newest first
        setAssessments(aData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setEvaluations(eData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

        // Auto-select first class if available and none selected
        if (!selectedClass && aData.length > 0) {
            const classes = Array.from(new Set(aData.map(a => a.classRoom).filter(Boolean)));
            if (classes.length > 0) setSelectedClass(classes[0]);
        }
    }, [selectedClass]);

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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Filter Data by Class
    const filteredAssessments = selectedClass
        ? assessments.filter(a => a.classRoom === selectedClass)
        : assessments;

    // Filter by search query
    const searchFilteredAssessments = searchQuery.trim()
        ? filteredAssessments.filter(a =>
            a.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.teacherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.classRoom?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : filteredAssessments;

    // Group assessments by Subject (Filtered)
    const subjects: Record<string, Assessment[]> = {};
    searchFilteredAssessments.forEach(a => {
        if (!a.subject) return;
        if (!subjects[a.subject]) subjects[a.subject] = [];
        subjects[a.subject].push(a);
    });

    const uniqueClasses = Array.from(new Set(assessments.map(a => a.classRoom).filter(Boolean)));

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{getGreeting()}, Teacher</Text>
                    <Text style={styles.subGreeting}>Ready to assess some papers today?</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => setShowOnboarding(true)}
                    >
                        <HelpCircle color={theme.colors.text} size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <SettingsIcon color={theme.colors.text} size={24} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Class Tabs */}
            {uniqueClasses.length > 0 && (
                <View style={styles.tabContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
                        {uniqueClasses.map(cls => (
                            <TouchableOpacity
                                key={cls}
                                style={[styles.tabItem, selectedClass === cls && styles.tabItemActive]}
                                onPress={() => {
                                    setSelectedClass(cls);
                                }}
                            >
                                <Text style={[styles.tabText, selectedClass === cls && styles.tabTextActive]}>
                                    {cls}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search by subject, teacher, or class..."
                />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Main Action Cards */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={[styles.mainCard, { backgroundColor: theme.colors.primary }]}
                        onPress={() => navigation.navigate('SetupAssessment')}
                        activeOpacity={0.9}
                    >
                        <View style={styles.mainCardContent}>
                            <View style={[styles.mainCardIconCircle, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                                <Plus color={theme.colors.primary} size={32} strokeWidth={3} />
                            </View>
                            <View>
                                <Text style={styles.mainCardTitle}>Create Exam</Text>
                                <Text style={styles.mainCardSub}>Set up a new assessment</Text>
                            </View>
                        </View>
                        <View style={[styles.mainCardDecoration, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.mainCard, { backgroundColor: theme.colors.secondary, marginTop: 16 }]}
                        onPress={() => navigation.navigate('Evaluation')}
                        activeOpacity={0.9}
                    >
                        <View style={styles.mainCardContent}>
                            <View style={[styles.mainCardIconCircle, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                                <ClipboardCheck color={theme.colors.secondary} size={32} strokeWidth={3} />
                            </View>
                            <View>
                                <Text style={styles.mainCardTitle}>Check Papers</Text>
                                <Text style={styles.mainCardSub}>Scan & evaluate sheets</Text>
                            </View>
                        </View>
                        <View style={[styles.mainCardDecoration, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                    </TouchableOpacity>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => navigation.navigate('Analytics')}
                    >
                        <ClipboardCheck color={theme.colors.primary} size={20} />
                        <Text style={styles.quickActionText}>Analytics</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionBtn}>
                        <BookOpen color={theme.colors.primary} size={20} />
                        <Text style={styles.quickActionText}>Export</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickActionBtn}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <SettingsIcon color={theme.colors.primary} size={20} />
                        <Text style={styles.quickActionText}>Settings</Text>
                    </TouchableOpacity>
                </View>

                {/* Enhanced Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#dbeafe' }]}>
                            <FileText color="#3b82f6" size={24} />
                        </View>
                        <Text style={styles.statCardValue}>{assessments.length}</Text>
                        <Text style={styles.statCardLabel}>Total Exams</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#dcfce7' }]}>
                            <ClipboardCheck color="#10b981" size={24} />
                        </View>
                        <Text style={styles.statCardValue}>{evaluations.length}</Text>
                        <Text style={styles.statCardLabel}>Papers Checked</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#fef3c7' }]}>
                            <Users color="#f59e0b" size={24} />
                        </View>
                        <Text style={styles.statCardValue}>{new Set(evaluations.map(e => e.studentName)).size}</Text>
                        <Text style={styles.statCardLabel}>Students</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconCircle, { backgroundColor: '#ddd6fe' }]}>
                            <BookOpen color="#8b5cf6" size={24} />
                        </View>
                        <Text style={styles.statCardValue}>{Object.keys(subjects).length}</Text>
                        <Text style={styles.statCardLabel}>Subjects</Text>
                    </View>
                </View>

                {/* Subjects Grid */}
                {Object.keys(subjects).length > 0 && (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>My Subjects</Text>
                    </View>
                )}

                <View style={styles.subjectsGrid}>
                    {Object.keys(subjects).map(subject => {
                        const subjectAssessments = assessments.filter(a => a.subject === subject);
                        const subjectEvals = evaluations.filter(e => subjectAssessments.find(a => a.id === e.assessmentId));

                        return (
                            <TouchableOpacity
                                key={subject}
                                style={[styles.subjectCard]}
                                onPress={() => navigation.navigate('SubjectDetails', { subject, classRoom: selectedClass })}
                            >
                                <View style={[styles.subjectIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                                    <BookOpen color={theme.colors.primary} size={24} />
                                </View>
                                <View style={styles.subjectInfo}>
                                    <Text style={styles.subjectTitle}>{subject}</Text>
                                    <Text style={styles.subjectStats}>
                                        {subjectAssessments.length} Exams • {subjectEvals.length} Checked
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Recent Exams List */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Exams</Text>
                    {filteredAssessments.length > 5 && (
                        <Text style={styles.viewAll}>View All</Text>
                    )}
                </View>

                {filteredAssessments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <BookOpen color={theme.colors.border} size={48} />
                        <Text style={styles.emptyText}>No exams found.</Text>
                        <Text style={styles.emptySubText}>Tap "Create Exam" to get started.</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {filteredAssessments.slice(0, 5).map((assessment) => (
                            <TouchableOpacity
                                key={assessment.id}
                                style={styles.assessmentCard}
                                onPress={() => navigation.navigate('Evaluation', { assessment })}
                            >
                                <View style={styles.assessmentIcon}>
                                    <FileText color="#fff" size={20} />
                                </View>
                                <View style={styles.assessmentContent}>
                                    <Text style={styles.assessmentTitle} numberOfLines={1}>{assessment.title}</Text>
                                    <View style={styles.assessmentMeta}>
                                        <Text style={styles.assessmentMetaText}>{assessment.subject} • {assessment.classRoom}</Text>
                                        <View style={styles.dot} />
                                        <Text style={styles.assessmentMetaText}>{new Date(assessment.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                                <ChevronRight color={theme.colors.textSecondary} size={20} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            <ApiKeyPrompt
                visible={showApiKeyPrompt}
                onKeysConfigured={() => {
                    setShowApiKeyPrompt(false);
                    loadData();
                }}
            />

            <OnboardingTutorial
                visible={showOnboarding}
                onComplete={() => setShowOnboarding(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.xl,
        paddingBottom: theme.spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    greeting: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.text,
        marginBottom: 4,
    },
    subGreeting: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    settingsButton: {
        padding: 8,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchContainer: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
    },
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: 100,
    },
    actionContainer: {
        marginBottom: theme.spacing.xl,
    },
    mainCard: {
        borderRadius: 20,
        padding: 24,
        height: 110,
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    mainCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 2,
    },
    mainCardIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    mainCardTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    mainCardSub: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
    },
    mainCardDecoration: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.15)',
        zIndex: 1,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.lg,
        gap: 12,
    },
    quickActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 8,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: theme.spacing.xl,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    statIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statCardValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    statCardLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: theme.colors.border,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },
    viewAll: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    listContainer: {
        gap: 12,
    },
    subjectsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    subjectCard: {
        width: (width - theme.spacing.lg * 2 - 12) / 2, // 2 columns
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    subjectIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    subjectInfo: {
        gap: 4,
    },
    subjectTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
    },
    subjectStats: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    assessmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    tabContainer: {
        marginBottom: 8,
    },
    tabScroll: {
        paddingHorizontal: theme.spacing.xl,
        gap: 12,
        paddingBottom: 8,
    },
    tabItem: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    tabItemActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    tabText: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },
    tabTextActive: {
        color: '#fff',
    },
    assessmentIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: theme.colors.text,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    assessmentContent: {
        flex: 1,
    },
    assessmentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 6,
    },
    assessmentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    assessmentMetaText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: theme.colors.textSecondary,
        marginHorizontal: 6,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
});
