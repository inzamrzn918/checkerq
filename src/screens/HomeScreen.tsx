import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Dimensions, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { Plus, FileText, Settings as SettingsIcon, ClipboardCheck, ChevronRight, BookOpen, HelpCircle, Users, Pause, Play, Clock, Zap, Home, History, BarChart2, Scan, AlertCircle, Activity, CheckCircle, Trash2 } from 'lucide-react-native';
import { StorageService, Assessment, Evaluation } from '../services/storage';
import { settingsService } from '../services/settings';
import ApiKeyPrompt from '../components/ApiKeyPrompt';
import SearchBar from '../components/SearchBar';
import OnboardingTutorial, { checkOnboardingStatus } from '../components/OnboardingTutorial';
import { useConfig } from '../context/ConfigContext';
import { evaluationQueue } from '../services/queue';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [activeJobs, setActiveJobs] = useState<Evaluation[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedClass, setSelectedClass] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = evaluationQueue.addListener((jobs) => {
            setActiveJobs(jobs);
        });
        return unsubscribe;
    }, []);

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

    const handleDelete = async (id: string, name?: string) => {
        Alert.alert(
            'Delete Result?',
            `Are you sure you want to delete the result for ${name || 'this student'}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Optimistic update
                            setEvaluations(prev => prev.filter(e => e.id !== id));
                            await StorageService.deleteEvaluation(id);
                            loadData();
                        } catch (error) {
                            console.error('Delete failed:', error);
                        }
                    }
                }
            ]
        );
    };

    const handleCancelJob = async (id: string) => {
        Alert.alert(
            'Abort Job?',
            'Are you sure you want to cancel this processing job?',
            [
                { text: 'Keep It', style: 'cancel' },
                {
                    text: 'Abort',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await evaluationQueue.cancelJob(id);
                        } catch (error) {
                            console.error('Cancel failed:', error);
                        }
                    }
                }
            ]
        );
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

    // Group assessments by Exam Type -> Subject
    const examGroups: Record<string, Record<string, Assessment[]>> = {};
    searchFilteredAssessments.forEach(a => {
        const et = a.examType || 'General';
        const sub = a.subject || 'General';
        if (!examGroups[et]) examGroups[et] = {};
        if (!examGroups[et][sub]) examGroups[et][sub] = [];
        examGroups[et][sub].push(a);
    });

    const uniqueClasses = Array.from(new Set(assessments.map(a => a.classRoom).filter(Boolean)));

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.greeting}>Good Morning,</Text>
                    <Text style={styles.userName}>Teacher</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryIconBox}>
                            <Clock size={16} color={theme.colors.text} />
                        </View>
                        <View style={styles.summaryText}>
                            <Text style={styles.summaryVal}>{evaluations.filter(e => e.status === 'pending').length}</Text>
                            <Text style={styles.summaryLabel}>Pending</Text>
                        </View>
                    </View>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryIconBox}>
                            <Zap size={16} color={theme.colors.accent} />
                        </View>
                        <View style={styles.summaryText}>
                            <Text style={styles.summaryVal}>{activeJobs.length}</Text>
                            <Text style={styles.summaryLabel}>Active</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.heroActions}>
                    <TouchableOpacity
                        style={styles.heroCard}
                        onPress={() => navigation.navigate('SetupAssessment')}
                    >
                        <View style={styles.glassEffect} />
                        <View style={styles.heroCardIcon}>
                            <Plus size={32} color={theme.colors.text} />
                        </View>
                        <View>
                            <Text style={styles.heroCardTitle}>New Assessment</Text>
                            <Text style={styles.heroCardSub}>Create quiz or assignment</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.heroCard, { backgroundColor: theme.colors.primary + '30' }]}
                        onPress={() => navigation.navigate('Evaluation')}
                    >
                        <View style={styles.glassEffect} />
                        <View style={styles.heroCardIcon}>
                            <Scan size={32} color={theme.colors.text} />
                        </View>
                        <View>
                            <Text style={styles.heroCardTitle}>Evaluate Papers</Text>
                            <Text style={styles.heroCardSub}>Scan and analyze sheets</Text>
                        </View>
                    </TouchableOpacity>
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

                {/* Exam Types Grid */}
                {Object.keys(examGroups).length > 0 && (
                    <View style={styles.subjectsSection}>
                        <Text style={styles.sectionTitle}>Exam Sessions</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectsScroll}>
                            {Object.keys(examGroups).map(et => (
                                <TouchableOpacity
                                    key={et}
                                    style={styles.subjectCardSmall}
                                    onPress={() => navigation.navigate('ExamSessions', { examType: et, classRoom: selectedClass })}
                                >
                                    <View style={[styles.subjectIconSmall, { backgroundColor: theme.colors.accent + '20' }]}>
                                        <ClipboardCheck color={theme.colors.accent} size={20} />
                                    </View>
                                    <Text style={styles.subjectCardTitle}>{et}</Text>
                                    <Text style={styles.subjectCardCount}>
                                        {Object.keys(examGroups[et]).length} Subjects
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Unified Activity Feed */}
                <View style={styles.activityFeed}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>

                    {(() => {
                        // Unique-ify evaluations and active jobs to prevent duplicate key errors
                        const combined = [...activeJobs, ...evaluations.slice(0, 10)];
                        const uniqueMap = new Map();
                        combined.forEach(item => {
                            if (!uniqueMap.has(item.id)) {
                                uniqueMap.set(item.id, item);
                            }
                        });
                        const items = Array.from(uniqueMap.values());

                        if (items.length === 0) {
                            return (
                                <View style={styles.emptyState}>
                                    <Activity color={theme.colors.border} size={48} />
                                    <Text style={styles.emptyText}>No activity yet.</Text>
                                    <Text style={styles.emptySubText}>Try scanning a paper to see it here.</Text>
                                </View>
                            );
                        }

                        return items.map((item, idx) => {
                            const isJob = 'progress' in item && item.status !== 'completed';
                            const needsReview = item.results?.some((r: any) => r.needsReview);

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.activityCard}
                                    onPress={() => isJob ? null : navigation.navigate('EvaluationResult', { evaluation: item })}
                                >
                                    <View style={styles.activityIconBox}>
                                        {isJob ? <Zap size={20} color={theme.colors.accent} /> :
                                            needsReview ? <AlertCircle size={20} color={theme.colors.warning} /> :
                                                <CheckCircle size={20} color={theme.colors.success} />}
                                    </View>

                                    <View style={styles.activityInfo}>
                                        <Text style={styles.activityTitle} numberOfLines={1}>
                                            {item.assessmentTitle || 'Untitled Assessment'}
                                        </Text>
                                        <Text style={styles.activitySub}>
                                            Student: {item.studentName || 'Unknown'} - {' '}
                                            {item.status === 'completed' ? (needsReview ? 'Needs Review' : 'Done') :
                                                item.status === 'processing' ? 'Processing' :
                                                    item.status === 'pending' ? 'Pending' :
                                                        item.status === 'paused' ? 'Paused' :
                                                            (item.status === 'error' ? (() => {
                                                                const err = item.errorMessage || 'Unknown Error';
                                                                if (err.includes('quota')) return 'Quota Limit Exceeded. Try again later.';
                                                                if (err.includes('JSON')) return 'AI Parsing Error. Please retry.';
                                                                if (err.includes('Network')) return 'Network Issue. Check internet.';
                                                                return 'Evaluation Failed';
                                                            })() : 'Unknown')}
                                        </Text>

                                        {isJob && (
                                            <View style={styles.activityProgressContainer}>
                                                <View style={[styles.activityProgressBar, { width: `${item.progress}%` }]} />
                                            </View>
                                        )}
                                    </View>

                                    {!isJob && (
                                        <View style={styles.activityActions}>
                                            <TouchableOpacity
                                                style={styles.deleteAction}
                                                onPress={() => handleDelete(item.id, item.studentName)}
                                            >
                                                <Trash2 size={16} color={theme.colors.error} />
                                            </TouchableOpacity>
                                            <ChevronRight size={18} color={theme.colors.textSecondary} />
                                        </View>
                                    )}

                                    {isJob && (
                                        <TouchableOpacity
                                            style={styles.cancelJobBtn}
                                            onPress={() => handleCancelJob(item.id)}
                                        >
                                            <Trash2 size={16} color={theme.colors.error} />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            );
                        });
                    })()}
                </View>
            </ScrollView>

            {/* Persistent Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
                    <Home size={24} color={theme.colors.primary} />
                    <Text style={[styles.navText, { color: theme.colors.primary }]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('YearBrowser')}>
                    <History size={24} color={theme.colors.textSecondary} />
                    <Text style={styles.navText}>History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Analytics')}>
                    <BarChart2 size={24} color={theme.colors.textSecondary} />
                    <Text style={styles.navText}>Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Settings')}>
                    <SettingsIcon size={24} color={theme.colors.textSecondary} />
                    <Text style={styles.navText}>Settings</Text>
                </TouchableOpacity>
            </View>

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
        paddingBottom: theme.spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.text,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    summaryCard: {
        backgroundColor: theme.colors.surface + '80', // Glass effect
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: theme.colors.border + '50',
    },
    summaryIconBox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryText: {
        justifyContent: 'center',
    },
    summaryVal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text,
        lineHeight: 16,
    },
    summaryLabel: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        marginTop: -1,
    },
    heroActions: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.xl,
        gap: 16,
        marginBottom: 24,
    },
    heroCard: {
        flex: 1,
        height: 120,
        borderRadius: 24,
        backgroundColor: theme.colors.primary + '50', // Glass effect
        padding: 16,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        position: 'relative',
        overflow: 'hidden',
    },
    glassEffect: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    heroCardIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroCardTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    heroCardSub: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
    },
    tabContainer: {
        marginBottom: 24,
    },
    tabScroll: {
        paddingHorizontal: theme.spacing.xl,
        gap: 12,
    },
    tabItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: theme.colors.surface + '80',
        borderWidth: 1,
        borderColor: theme.colors.border + '50',
    },
    tabItemActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    tabText: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
        fontSize: 12,
    },
    tabTextActive: {
        color: '#fff',
    },
    searchContainer: {
        paddingHorizontal: theme.spacing.xl,
        marginBottom: 24,
    },
    subjectsSection: {
        marginBottom: 24,
        paddingHorizontal: theme.spacing.xl,
    },
    subjectsScroll: {
        marginHorizontal: -theme.spacing.xl,
        paddingHorizontal: theme.spacing.xl,
        gap: 12,
    },
    subjectCardSmall: {
        width: 110,
        padding: 16,
        borderRadius: 20,
        backgroundColor: theme.colors.surface + '50',
        borderWidth: 1,
        borderColor: theme.colors.border + '30',
        alignItems: 'center',
    },
    subjectIconSmall: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    subjectCardTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
    },
    subjectCardCount: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    activityFeed: {
        paddingHorizontal: theme.spacing.xl,
    },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface + '50',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border + '30',
    },
    activityIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 2,
    },
    activitySub: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    activityProgressContainer: {
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        marginTop: 8,
        width: '100%',
    },
    activityProgressBar: {
        height: '100%',
        backgroundColor: theme.colors.accent,
        borderRadius: 2,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 30,
        left: 24,
        right: 24,
        height: 64,
        backgroundColor: theme.colors.surface + 'CC',
        borderRadius: 32,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    navItem: {
        alignItems: 'center',
        gap: 4,
    },
    navText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
    },
    scrollContent: {
        paddingTop: 10,
        paddingBottom: 150,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        backgroundColor: theme.colors.surface + '30',
        borderRadius: 24,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    activityActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deleteAction: {
        padding: 4,
    },
    cancelJobBtn: {
        padding: 8,
    },
});
