import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme/theme';
import { Camera as CameraIcon, ChevronLeft, Scan, ClipboardCheck } from 'lucide-react-native';
import { GeminiService } from '../services/gemini';

export default function EvaluationScreen({ route, navigation }: any) {
    const assessment = route.params?.assessment;
    const questions = assessment?.questions || [];
    const [answerSheet, setAnswerSheet] = useState<string | null>(null);
    const [evaluating, setEvaluating] = useState(false);

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
        if (!answerSheet) return;

        setEvaluating(true);
        try {
            // Dummy questions if none provided for testing
            const targetQuestions = questions.length > 0 ? questions : [
                { id: '1', text: 'Sample Question', marks: 5, type: 'Descriptive' }
            ];

            const evaluation = await GeminiService.evaluatePaper(answerSheet, targetQuestions);
            navigation.navigate('EvaluationResult', { evaluation, answerSheet });
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
                    <Text style={styles.statusText}>
                        Assessment: {assessment?.title || 'Unknown'}
                    </Text>
                </View>

                {!answerSheet ? (
                    <View style={styles.scannerInterface}>
                        <View style={styles.scanTarget}>
                            <Scan color={theme.colors.border} size={100} strokeWidth={1} />
                            <Text style={styles.scanHint}>Align answer sheet within the frame</Text>
                        </View>

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
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    statusText: {
        color: theme.colors.text,
        marginLeft: 12,
        fontWeight: '500',
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
