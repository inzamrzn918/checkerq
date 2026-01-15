import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { Calendar, ChevronRight, History } from 'lucide-react-native';
import { StorageService } from '../services/storage';

export default function YearBrowserScreen({ navigation }: any) {
    const [years, setYears] = useState<string[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        const data = await StorageService.getYears();
        setYears(data);
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>History</Text>
                    <Text style={styles.subtitle}>Browse by Academic Year</Text>
                </View>
                <View style={styles.headerIcon}>
                    <History size={24} color={theme.colors.primary} />
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                }
            >
                {years.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Calendar size={64} color={theme.colors.textSecondary} strokeWidth={1} />
                        <Text style={styles.emptyText}>No evaluations found yet.</Text>
                        <Text style={styles.emptySubtext}>Start an evaluation to see it in history.</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {years.map((year) => (
                            <TouchableOpacity
                                key={year}
                                style={styles.card}
                                onPress={() => navigation.navigate('ClassBrowser', { academicYear: year })}
                            >
                                <View style={styles.cardContent}>
                                    <View style={styles.iconContainer}>
                                        <Calendar size={20} color={theme.colors.primary} />
                                    </View>
                                    <View style={styles.textContainer}>
                                        <Text style={styles.cardTitle}>{year}</Text>
                                        <Text style={styles.cardSubtitle}>Academic Year</Text>
                                    </View>
                                </View>
                                <ChevronRight size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
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
        backgroundColor: '#0f172a',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.primary + '30',
    },
    content: {
        flex: 1,
    },
    listContainer: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 100,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface + '80',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    cardSubtitle: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginTop: 24,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
});
