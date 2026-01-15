import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { User, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { StorageService, Student } from '../services/storage';

export default function StudentBrowserScreen({ navigation, route }: any) {
    const { academicYear, classRoom, examType } = route.params;
    const [students, setStudents] = useState<Student[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        const data = await StorageService.getStudentsByExamType(academicYear, classRoom, examType);
        setStudents(data);
    }, [academicYear, classRoom, examType]);

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
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>{examType}</Text>
                    <Text style={styles.subtitle}>{classRoom} • {students.length} Students</Text>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                }
            >
                {students.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <User size={64} color={theme.colors.textSecondary} strokeWidth={1} />
                        <Text style={styles.emptyText}>No students found for this exam.</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {students.map((student) => (
                            <TouchableOpacity
                                key={student.id}
                                style={styles.card}
                                onPress={() => navigation.navigate('History', { studentId: student.id, studentName: student.name })}
                            >
                                <View style={styles.cardContent}>
                                    <View style={styles.iconContainer}>
                                        <User size={20} color={theme.colors.primary} />
                                    </View>
                                    <View style={styles.textContainer}>
                                        <Text style={styles.cardTitle}>{student.name}</Text>
                                        <Text style={styles.cardSubtitle}>
                                            {student.rollNo ? `Roll No: ${student.rollNo}` : 'No Roll No'}
                                        </Text>
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
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    listContainer: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 40,
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
});
