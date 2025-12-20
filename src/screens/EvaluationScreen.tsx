import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme/theme';
import { Camera as CameraIcon, ChevronLeft, Scan, ClipboardCheck } from 'lucide-react-native';
import { GeminiService } from '../services/gemini';
import { StorageService, Assessment } from '../services/storage';
import { useFocusEffect } from '@react-navigation/native';

export default function EvaluationScreen({ route, navigation }: any) {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(route.params?.assessment || null);
    const [answerSheet, setAnswerSheet] = useState<string | null>(null);
    const [evaluating, setEvaluating] = useState(false);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchAssessments = async () => {
                const data = await StorageService.getAssessments();
                setAssessments(data);
                if (route.params?.assessment) {
                    setSelectedAssessment(route.params.assessment);
                }
                setLoading(false);
            };
            fetchAssessments();
        }, [route.params?.assessment])
    );

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
        });

        if (!result.canceled) {
            setAnswerSheet(result.assets[0].uri);
        }
    };

    const uploadFromGallery = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
        });

        if (!result.canceled) {
            setAnswerSheet(result.assets[0].uri);
        }
    };

    const startEvaluation = async () => {
        if (!answerSheet || !selectedAssessment) return;

        setEvaluating(true);
        try {
            const evaluation = await GeminiService.evaluatePaper(answerSheet, selectedAssessment.questions);
            // We pass the full assessment object so results screen can show question details
            navigation.navigate('EvaluationResult', { evaluation, assessment: selectedAssessment, answerSheet });
        } catch (error) {
            Alert.alert('Error', 'Evaluation failed. Please try again.');
            console.error(error);
        } finally {
            setEvaluating(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Scan Answer Sheet</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.statusBox}>
                    <ClipboardCheck color={theme.colors.primary} size={24} />
                    <View style={styles.statusInfo}>
                        <Text style={styles.statusLabel}>Evaluating for:</Text>
                        <Text style={styles.statusValue}>
                            {selectedAssessment?.title || 'No Assessment Selected'}
                        </Text>
                    </View>
                </View>

                {!selectedAssessment ? (
                    <View style={styles.selectionCard}>
                        <Text style={styles.selectionTitle}>Select an Assessment</Text>
                        <Text style={styles.selectionSub}>You must pick a question paper template before scanning answers.</Text>

                        {assessments.length === 0 ? (
                            <TouchableOpacity
                                style={styles.createBtn}
                                onPress={() => navigation.navigate('SetupAssessment')}
                            >
                                <Text style={styles.createBtnText}>+ Create New Assessment</Text>
                            </TouchableOpacity>
                        ) : (
                            <ScrollView style={styles.pickerList} nestedScrollEnabled>
                                {assessments.map(a => (
                                    <TouchableOpacity
                                        key={a.id}
                                        style={styles.pickerItem}
                                        onPress={() => setSelectedAssessment(a)}
                                    >
                                        <Text style={styles.pickerItemTitle}>{a.title}</Text>
                                        <Text style={styles.pickerItemSub}>{a.subject} • {a.questions.length} Qs</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                ) : !answerSheet ? (
                    <View style={styles.scannerInterface}>
                        <View style={styles.scanTarget}>
                            <Scan color={theme.colors.border} size={100} strokeWidth={1} />
                            <Text style={styles.scanHint}>Align answer sheet within the frame</Text>
                        </View>

                        <TouchableOpacity style={styles.changeAssessmentBtn} onPress={() => setSelectedAssessment(null)}>
                            <Text style={styles.changeAssessmentText}>Change Assessment</Text>
                        </TouchableOpacity>

                        <View style={styles.controls}>
                            <TouchableOpacity style={styles.circleBtn} onPress={uploadFromGallery}>
                                <Image source={{ uri: 'https://img.icons8.com/ios-filled/50/ffffff/gallery.png' }} style={{ width: 24, height: 24, tintColor: '#fff' }} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
                                <View style={styles.captureBtnInner}>
                                    <CameraIcon color="#fff" size={32} />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.circleBtn} />
                        </View>
                    </View>
                ) : (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: answerSheet }} style={styles.preview} />
                        <TouchableOpacity style={styles.retakeBtn} onPress={() => setAnswerSheet(null)}>
                            <Text style={styles.retakeBtnText}>Retake Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.evaluateBtn, evaluating && styles.disabledBtn]}
                            onPress={startEvaluation}
                            disabled={evaluating}
                        >
                            {evaluating ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.evaluateBtnText}>Evaluate Now</Text>
                                    <Text style={styles.evaluateBtnSub}>Uses AI to grade handwritten answers</Text>
                                </>
                            )}
                        </TouchableOpacity>
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
    statusBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    statusInfo: {
        marginLeft: 12,
    },
    statusLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    statusValue: {
        color: theme.colors.text,
        fontWeight: '700',
        fontSize: 16,
    },
    scannerInterface: {
        alignItems: 'center',
        marginTop: 40,
    },
    scanTarget: {
        width: '100%',
        aspectRatio: 3 / 4,
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanHint: {
        color: theme.colors.textSecondary,
        marginTop: 20,
    },
    selectionCard: {
        backgroundColor: theme.colors.surface,
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    selectionTitle: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    selectionSub: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    pickerList: {
        maxHeight: 300,
    },
    pickerItem: {
        padding: 16,
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    pickerItemTitle: {
        color: theme.colors.text,
        fontWeight: '600',
        fontSize: 16,
    },
    pickerItemSub: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    createBtn: {
        backgroundColor: theme.colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    createBtnText: {
        color: '#fff',
        fontWeight: '700',
    },
    changeAssessmentBtn: {
        padding: 16,
    },
    changeAssessmentText: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 40,
        marginTop: 40,
    },
    captureBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary + '30',
        padding: 6,
    },
    captureBtnInner: {
        flex: 1,
        borderRadius: 34,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    previewContainer: {
        alignItems: 'center',
    },
    preview: {
        width: '100%',
        height: 450,
        borderRadius: 20,
    },
    retakeBtn: {
        marginTop: 20,
        padding: 12,
    },
    retakeBtnText: {
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    evaluateBtn: {
        backgroundColor: theme.colors.primary,
        width: '100%',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        ...theme.shadows.md,
    },
    disabledBtn: {
        backgroundColor: theme.colors.border,
    },
    evaluateBtnText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    evaluateBtnSub: {
        color: '#ffffff80',
        fontSize: 12,
        marginTop: 4,
    }
});
