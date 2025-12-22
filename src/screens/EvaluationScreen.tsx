import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme/theme';
import { Camera as CameraIcon, ChevronLeft, Scan, ClipboardCheck, ArrowRight, Check, Trash2, Plus } from 'lucide-react-native';
import { GeminiService, PaperEvaluation } from '../services/gemini';
import { MistralService } from '../services/mistral';
import { StorageService, Assessment } from '../services/storage';
import { useFocusEffect } from '@react-navigation/native';

type Step = 'SELECT' | 'COVER_SCAN' | 'COVER_VERIFY' | 'ANSWER_SCAN' | 'ANSWER_VERIFY' | 'SUMMARY';

export default function EvaluationScreen({ route, navigation }: any) {
    const [step, setStep] = useState<Step>('SELECT');
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(route.params?.assessment || null);

    // Session Data
    const [studentInfo, setStudentInfo] = useState<{ name: string; rollNo?: string; class?: string }>({ name: '' });
    const [pages, setPages] = useState<{ uri: string; type: 'cover' | 'answer'; evaluation?: PaperEvaluation }[]>([]);
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    useFocusEffect(
        useCallback(() => {
            const fetchAssessments = async () => {
                const data = await StorageService.getAssessments();
                setAssessments(data);
                if (route.params?.assessment) {
                    setSelectedAssessment(route.params.assessment);
                    setStep('COVER_SCAN');
                }
            };
            fetchAssessments();
        }, [route.params?.assessment])
    );

    const pickImage = async (camera: boolean) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required');
            return;
        }

        const result = camera
            ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
            : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

        if (!result.canceled) {
            setCurrentImage(result.assets[0].uri);
            if (step === 'COVER_SCAN') processCoverPage(result.assets[0].uri);
            if (step === 'ANSWER_SCAN') processAnswerPage(result.assets[0].uri);
        }
    };

    const processCoverPage = async (uri: string) => {
        setLoading(true);
        setStatusMsg('Extracting Student Info...');
        try {
            const info = await GeminiService.extractStudentInfo(uri);
            setStudentInfo({
                name: info.name || '',
                rollNo: info.rollNo,
                class: info.class
            });
            setStatusMsg('');
            setStep('COVER_VERIFY');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to extract info. Please enter manually.');
            setStep('COVER_VERIFY');
        } finally {
            setLoading(false);
        }
    };

    const confirmCoverPage = () => {
        setPages([...pages, { uri: currentImage!, type: 'cover' }]);
        setCurrentImage(null);
        setStep('ANSWER_SCAN');
    };

    const processAnswerPage = async (uri: string) => {
        if (!selectedAssessment) return;
        setLoading(true);
        setStatusMsg('Evaluating Answer Sheet...');

        try {
            // 1. OCR
            setStatusMsg('Reading handwriting (Mistral)...');
            const text = await MistralService.extractText(uri);

            // 2. Evaluate
            setStatusMsg('Grading (Gemini)...');
            const evalResult = await GeminiService.evaluatePaperText(text, selectedAssessment.questions);

            // Add to pages temporarily for verification
            setPages([...pages, { uri, type: 'answer', evaluation: evalResult }]);
            setStep('SUMMARY'); // For now, go straight to summary/next loop, typically we'd verify each page
        } catch (error) {
            Alert.alert('Evaluation Failed', 'Try again or skip this page.');
        } finally {
            setLoading(false);
            setCurrentImage(null);
        }
    };

    const handleFinish = async () => {
        // Aggregate results
        const answerPages = pages.filter(p => p.type === 'answer');
        const aggregatedEval = {
            id: Math.random().toString(36).substr(2, 9),
            assessmentId: selectedAssessment!.id,
            studentImage: pages.length > 0 ? pages[0].uri : '', // cover or first page
            pages: pages,
            studentName: studentInfo.name,
            totalMarks: selectedAssessment!.questions.reduce((sum, q) => sum + q.marks, 0),
            obtainedMarks: answerPages.reduce((sum, p) => sum + (p.evaluation?.obtainedMarks || 0), 0),
            overallFeedback: "Evaluated across " + answerPages.length + " pages.",
            results: answerPages.flatMap(p => p.evaluation?.results || []),
            createdAt: Date.now()
        };

        // Navigate to result screen for final save
        navigation.navigate('EvaluationResult', {
            evaluation: aggregatedEval,
            assessment: selectedAssessment,
            answerSheet: aggregatedEval.studentImage // pass cover as main image for now
        });
    };

    const renderSelectAssessment = () => (
        <View style={styles.selectionCard}>
            <Text style={styles.sectionTitle}>Select Exam</Text>
            <ScrollView style={{ maxHeight: 400 }}>
                {assessments.map(a => (
                    <TouchableOpacity
                        key={a.id}
                        style={styles.pickerItem}
                        onPress={() => {
                            setSelectedAssessment(a);
                            setStep('COVER_SCAN');
                        }}
                    >
                        <Text style={styles.pickerTitle}>{a.title}</Text>
                        <Text style={styles.pickerSub}>{a.subject} • {a.classRoom}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderCoverVerify = () => (
        <View style={styles.verifyContainer}>
            <Text style={styles.stepTitle}>Confirm Student Details</Text>
            <Image source={{ uri: currentImage! }} style={styles.miniPreview} />

            <View style={styles.formGroup}>
                <Text style={styles.label}>Student Name</Text>
                <TextInput
                    style={styles.input}
                    value={studentInfo.name}
                    onChangeText={t => setStudentInfo({ ...studentInfo, name: t })}
                    placeholder="Enter Name"
                />
            </View>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Roll No / ID</Text>
                <TextInput
                    style={styles.input}
                    value={studentInfo.rollNo}
                    onChangeText={t => setStudentInfo({ ...studentInfo, rollNo: t })}
                    placeholder="Enter Roll No"
                />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={confirmCoverPage}>
                <Text style={styles.btnText}>Confirm & Start Scanning Answers</Text>
                <ArrowRight color="#fff" size={20} />
            </TouchableOpacity>
        </View>
    );

    const renderScanner = (mode: 'COVER' | 'ANSWER') => (
        <View style={styles.scannerInterface}>
            <View style={styles.scanTarget}>
                <Scan color={theme.colors.border} size={80} />
                <Text style={styles.scanHint}>
                    {mode === 'COVER' ? 'Scan the Cover Page (Student Info)' : 'Scan an Answer Page'}
                </Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity style={styles.circleBtn} onPress={() => pickImage(false)}>
                    <Image source={{ uri: 'https://img.icons8.com/ios-filled/50/ffffff/gallery.png' }} style={{ width: 24, height: 24, tintColor: '#fff' }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.captureBtn} onPress={() => pickImage(true)}>
                    <CameraIcon color="#fff" size={32} />
                </TouchableOpacity>
                <View style={styles.circleBtn} />
            </View>

            {/* Skip Cover Option */}
            {mode === 'COVER' && (
                <TouchableOpacity onPress={() => setStep('ANSWER_SCAN')} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.colors.textSecondary }}>Skip Cover Page</Text>
                </TouchableOpacity>
            )}

            {mode === 'ANSWER' && pages.length > 0 && (
                <TouchableOpacity onPress={() => setStep('SUMMARY')} style={styles.finishLink}>
                    <Text style={styles.finishLinkText}>Finish Scanning ({pages.filter(p => p.type === 'answer').length} pages done)</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderSummary = () => (
        <View style={styles.summaryContainer}>
            <Text style={styles.stepTitle}>Scanned Pages</Text>
            <Text style={styles.summarySub}>Total Pages: {pages.length}</Text>

            <ScrollView horizontal style={styles.pageList}>
                {pages.map((p, i) => (
                    <View key={i} style={styles.pageCard}>
                        <Image source={{ uri: p.uri }} style={styles.pageThumb} />
                        <View style={styles.pageBadge}>
                            <Text style={styles.pageBadgeText}>{p.type === 'cover' ? 'Cover' : `Page ${i}`}</Text>
                        </View>
                        {p.evaluation && (
                            <View style={styles.markBadge}>
                                <Text style={styles.markText}>{p.evaluation.obtainedMarks} Marks</Text>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>

            <TouchableOpacity style={styles.addPageBtn} onPress={() => setStep('ANSWER_SCAN')}>
                <Plus color={theme.colors.primary} size={20} />
                <Text style={styles.addPageText}>Scan Another Page</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish}>
                <Text style={styles.btnText}>Complete Evaluation</Text>
                <Check color="#fff" size={20} />
            </TouchableOpacity>
        </View>
    );

    // Main Render
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>
                    {step === 'SELECT' ? 'New Evaluation' : selectedAssessment?.title}
                </Text>
                <View style={{ width: 28 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>{statusMsg}</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {step === 'SELECT' && renderSelectAssessment()}
                    {step === 'COVER_SCAN' && renderScanner('COVER')}
                    {step === 'COVER_VERIFY' && renderCoverVerify()}
                    {step === 'ANSWER_SCAN' && renderScanner('ANSWER')}
                    {step === 'SUMMARY' && renderSummary()}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.lg },
    title: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
    content: { padding: theme.spacing.lg },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, color: theme.colors.textSecondary },

    // Select
    selectionCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: theme.colors.text },
    pickerItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    pickerTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
    pickerSub: { fontSize: 12, color: theme.colors.textSecondary },

    // Scanner
    scannerInterface: { alignItems: 'center', marginTop: 40 },
    scanTarget: { width: 300, height: 400, borderWidth: 2, borderColor: theme.colors.primary, borderStyle: 'dashed', borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface },
    scanHint: { marginTop: 16, color: theme.colors.textSecondary },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 32, marginTop: 40 },
    captureBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
    circleBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
    finishLink: { marginTop: 32, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 8 },
    finishLinkText: { color: theme.colors.primary, fontWeight: '600' },

    // Forms
    verifyContainer: { padding: 16 },
    stepTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 24, color: theme.colors.text },
    miniPreview: { width: 100, height: 140, borderRadius: 8, alignSelf: 'center', marginBottom: 24, backgroundColor: '#eee' },
    formGroup: { marginBottom: 16 },
    label: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', fontWeight: 'bold' },
    input: { backgroundColor: theme.colors.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, fontSize: 16, color: theme.colors.text },

    primaryBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Summary
    summaryContainer: {},
    summarySub: { color: theme.colors.textSecondary, marginBottom: 16 },
    pageList: { flexDirection: 'row', marginBottom: 24 },
    pageCard: { width: 120, marginRight: 12 },
    pageThumb: { width: 120, height: 160, borderRadius: 8, backgroundColor: '#eee' },
    pageBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 4 },
    pageBadgeText: { color: '#fff', fontSize: 10 },
    markBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: theme.colors.success, padding: 4, borderRadius: 4 },
    markText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    addPageBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 12, borderStyle: 'dashed', marginBottom: 16 },
    addPageText: { color: theme.colors.primary, fontWeight: '600' },
});
