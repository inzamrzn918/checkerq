import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Image, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { ChevronLeft, CheckCircle, Award, Share2, Plus, Minus, Download, Save, AlertTriangle, X } from 'lucide-react-native';
import { PaperEvaluation } from '../services/gemini';
import { StorageService, Assessment, Evaluation } from '../services/storage';
import { exportGradeCardToPDF } from '../utils/export';
import { MarkOverlay } from '../components/MarkOverlay';
import { PageMarker } from '../components/PageMarker';

const { width, height: screenHeight } = Dimensions.get('window');

const CroppedImage = ({ uri, boundingBox, style }: { uri: string, boundingBox: [number, number, number, number], style?: any }) => {
    // boundingBox: [ymin, xmin, ymax, xmax] in 0-1000
    const [ymin, xmin, ymax, xmax] = boundingBox;
    const cropWidth = (xmax - xmin) / 10; // percent
    const cropHeight = (ymax - ymin) / 10; // percent

    return (
        <View style={[{ overflow: 'hidden', backgroundColor: '#000' }, style]}>
            <Image
                source={{ uri }}
                style={{
                    position: 'absolute',
                    left: `${-xmin / 10}%`,
                    top: `${-ymin / 10}%`,
                    width: `${100000 / (xmax - xmin)}%`,
                    height: `${100000 / (ymax - ymin)}%`,
                }}
                resizeMode="stretch"
            />
        </View>
    );
};

export default function EvaluationResultScreen({ route, navigation }: any) {
    // Params validation
    const { evaluation: initialEval, assessment: initialAssessment, answerSheet, isResuming }: { evaluation: any, assessment?: Assessment, answerSheet?: string, isResuming?: boolean } = route.params;
    const [evaluation, setEvaluation] = React.useState(initialEval);
    const [assessment, setAssessment] = React.useState<Assessment | null>(initialAssessment || null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(!initialAssessment);
    const [selectedPreviewImage, setSelectedPreviewImage] = React.useState<string | null>(null);
    const [detailIndex, setDetailIndex] = React.useState<number | null>(null);
    const [processingQueue, setProcessingQueue] = React.useState<number[]>([]);
    const [processingIndex, setProcessingIndex] = React.useState<number>(0);
    const [tempPages, setTempPages] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (!assessment && evaluation.assessmentId) {
            loadAssessment();
        }
    }, [evaluation.assessmentId]);

    const loadAssessment = async () => {
        setIsLoading(true);
        try {
            const data = await StorageService.getAssessmentById(evaluation.assessmentId);
            setAssessment(data);
        } catch (error) {
            console.error('Failed to load assessment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || !assessment) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text, marginTop: 16 }}>Loading Assessment...</Text>
            </View>
        );
    }

    // Identify if this is a new or existing evaluation
    const isExisting = !!initialEval.id && initialEval.id !== 'temp';

    // Normalize pages
    const pages = evaluation.pages || (evaluation.studentImage ? [{ uri: evaluation.studentImage, type: 'answer' }] : []);

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

        const newMark = Math.max(0, Math.min(maxMarks, res.obtainedMarks + (delta * 0.5)));
        if (newMark === res.obtainedMarks) return;

        res.obtainedMarks = parseFloat(newMark.toFixed(1));
        newResults[resIdx] = res;

        // Recalculate total
        const newTotalObtained = newResults.reduce((acc, curr) => acc + curr.obtainedMarks, 0);

        setEvaluation({
            ...evaluation,
            results: newResults,
            obtainedMarks: newTotalObtained
        });
    };



    const handleSave = async () => {
        setIsSaving(true);
        // Initialize queue with answer page indices that haven't been marked yet
        const indices = pages.map((p: any, i: number) => {
            // Only process answer pages that haven't been marked yet
            if (p.type === 'answer' && !p.isMarked) return i;
            return -1;
        }).filter((i: number) => i !== -1);

        if (indices.length === 0) {
            // No new answer pages to process, save directly
            // Ensure we don't accidentally re-save temp pages if queue was empty
            finalizeSave(pages);
            return;
        }

        setTempPages([...pages]);
        setProcessingQueue(indices);
        setProcessingIndex(0);
        // The effect hook below will handle the sequential processing via PageMarker rendering
    };

    const handlePageCaptured = (newUri: string) => {
        const currentIndex = processingQueue[processingIndex];
        const updatedPages = [...tempPages];
        // Update URI and set isMarked to true
        updatedPages[currentIndex] = { ...updatedPages[currentIndex], uri: newUri, isMarked: true };
        setTempPages(updatedPages);

        if (processingIndex < processingQueue.length - 1) {
            // Process next
            setProcessingIndex(processingIndex + 1);
        } else {
            // Finished
            setProcessingQueue([]);
            finalizeSave(updatedPages);
        }
    };

    const finalizeSave = async (finalPages: any[]) => {
        try {
            const evalData: Evaluation = {
                id: isExisting ? initialEval.id : Math.random().toString(36).substr(2, 9),
                assessmentId: assessment.id,
                studentImage: finalPages.length > 0 ? finalPages[0].uri : answerSheet,
                pages: finalPages,
                studentName: evaluation.studentName,
                totalMarks: evaluation.totalMarks,
                obtainedMarks: evaluation.obtainedMarks,
                overallFeedback: evaluation.overallFeedback,
                results: evaluation.results,
                createdAt: evaluation.createdAt || Date.now(),
                status: 'completed',
                progress: 100
            };

            await StorageService.saveEvaluation(evalData);
            navigation.navigate('Home');
        } catch (error) {
            console.error('Save failed:', error);
            setIsSaving(false);
        }
    };


    const handleExport = async () => {
        try {
            const evForStorage = { ...evaluation, id: 'temp', createdAt: Date.now() };
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

                {/* Pages Preview with Overlays */}
                <Text style={styles.sectionTitle}>Evaluated Pages</Text>
                {/* Pages Preview with Overlays */}
                <Text style={styles.sectionTitle}>Evaluated Pages</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pagesScroll}>
                    {pages.map((page: any, idx: number) => {
                        // Calculate relative answer page index
                        // Filter pages up to current index that are of type 'answer'
                        const answerPagesBefore = pages.slice(0, idx + 1).filter((p: any) => p.type === 'answer');
                        const isAnswerPage = page.type === 'answer';
                        // The index the AI validates against is 0-based index of ONLY answer pages
                        const answerPageIndex = isAnswerPage ? answerPagesBefore.length - 1 : -1;

                        // Filter results for this specific page
                        // If result has NO answerRegions (legacy), show on first answer page (index 0)
                        const pageResults = isAnswerPage ? evaluation.results.filter((r: any) => {
                            if (!r.answerRegions || r.answerRegions.length === 0) return answerPageIndex === 0;
                            return r.answerRegions.some((reg: any) => reg.pageIndex === answerPageIndex);
                        }) : [];

                        return (
                            <TouchableOpacity
                                key={idx}
                                style={styles.pagePreviewCard}
                                onPress={() => setSelectedPreviewImage(page.uri)}
                                activeOpacity={0.9}
                            >
                                <Image source={{ uri: page.uri }} style={styles.pageImage} />
                                {isAnswerPage && (
                                    <MarkOverlay
                                        results={pageResults}
                                        questions={assessment.questions}
                                        height={300}
                                        width={220}
                                    />
                                )}
                                <View style={styles.pageLabel}>
                                    <Text style={styles.pageLabelText}>{page.type === 'cover' ? 'Info' : `Page ${idx + (pages[0].type === 'cover' ? 0 : 1)}`}</Text>
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>

                {/* Processing Logic for Burning Marks */}
                {
                    processingQueue.length > 0 && (
                        <View style={{ position: 'absolute', opacity: 0, zIndex: -1 }}>
                            {(() => {
                                const rawIndex = processingQueue[processingIndex];
                                // Calculate answer index for the processing page
                                const answerPagesBefore = pages.slice(0, rawIndex + 1).filter((p: any) => p.type === 'answer');
                                const procAnsIndex = answerPagesBefore.length - 1;

                                const procPageResults = evaluation.results.filter((r: any) => {
                                    if (!r.answerRegions || r.answerRegions.length === 0) return procAnsIndex === 0;
                                    return r.answerRegions.some((reg: any) => reg.pageIndex === procAnsIndex);
                                });

                                return (
                                    <PageMarker
                                        key={rawIndex}
                                        uri={tempPages[rawIndex].uri}
                                        results={procPageResults}
                                        questions={assessment.questions}
                                        onCapture={handlePageCaptured}
                                    />
                                );
                            })()}
                        </View>
                    )
                }

                <View style={{ height: 40 }} />
            </ScrollView >

            {/* Bottom Actions */}
            <TouchableOpacity
                style={[styles.doneBtn, isSaving && styles.disabledBtn]}
                onPress={handleSave}
                disabled={isSaving}
            >
                {isSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <>
                        {isExisting ? <Save color="#fff" size={20} /> : <CheckCircle color="#fff" size={20} />}
                        <Text style={styles.doneBtnText}>
                            {isExisting ? 'Update & Close' : 'Save Results & Close'}
                        </Text>
                    </>
                )}
            </TouchableOpacity>

            {/* Image Preview Modal */}
            <Modal
                visible={!!selectedPreviewImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedPreviewImage(null)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalCloseOverlay}
                        activeOpacity={1}
                        onPress={() => setSelectedPreviewImage(null)}
                    />
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setSelectedPreviewImage(null)}
                        >
                            <X color="#fff" size={28} />
                        </TouchableOpacity>
                        {selectedPreviewImage && (
                            <Image
                                source={{ uri: selectedPreviewImage }}
                                style={styles.fullImage}
                                resizeMode="contain"
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* Question Detail Modal */}
            <Modal
                visible={detailIndex !== null}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setDetailIndex(null)}
            >
                <SafeAreaView style={[styles.container, { padding: 0 }]}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setDetailIndex(null)}>
                            <X color={theme.colors.text} size={28} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Detail Review</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    {detailIndex !== null && (
                        <ScrollView contentContainerStyle={styles.detailContent}>
                            <View style={styles.detailQuestionSection}>
                                <Text style={styles.detailQNum}>Question {evaluation.results[detailIndex].questionNumber}</Text>
                                <Text style={styles.detailQText}>{assessment.questions.find(foundQ => foundQ.id === evaluation.results[detailIndex].questionId)?.text}</Text>
                            </View>

                            {/* Question Paper Crop */}
                            <View style={styles.detailCropSection}>
                                <Text style={styles.detailLabel}>Question Paper View:</Text>
                                {assessment.questions.find(foundQ => foundQ.id === evaluation.results[detailIndex].questionId)?.regions ? (
                                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                                        {assessment.questions.find(foundQ => foundQ.id === evaluation.results[detailIndex].questionId)?.regions?.map((reg: any, rIdx: number) => (
                                            <View key={rIdx} style={{ width: width - 40, height: 120 }}>
                                                <CroppedImage
                                                    uri={reg.uri || assessment.paperImages[reg.pageIndex || 0]} // Use correct page index
                                                    boundingBox={reg.boundingBox}
                                                    style={{ width: '100%', height: '100%', borderRadius: 12 }}
                                                />
                                            </View>
                                        ))}
                                    </ScrollView>
                                ) : (
                                    <View style={[styles.noCropBox, { height: 60 }]}>
                                        <Text style={styles.noCropText}>No question crop available.</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.detailCropSection}>
                                <Text style={styles.detailLabel}>Student Answer View:</Text>
                                {evaluation.results[detailIndex].answerRegions ? (
                                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                                        {evaluation.results[detailIndex].answerRegions.map((reg: any, rIdx: number) => (
                                            <View key={rIdx} style={{ width: width - 40, height: 250 }}>
                                                <CroppedImage
                                                    uri={pages[reg.pageIndex]?.uri}
                                                    boundingBox={reg.boundingBox}
                                                    style={{ width: '100%', height: '100%', borderRadius: 12 }}
                                                />
                                                {evaluation.results[detailIndex].answerRegions.length > 1 && (
                                                    <View style={styles.pageIndicator}>
                                                        <Text style={styles.pageIndicatorText}>{rIdx + 1} / {evaluation.results[detailIndex].answerRegions.length}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        ))}
                                    </ScrollView>
                                ) : (
                                    <View style={styles.noCropBox}>
                                        <Text style={styles.noCropText}>No precise cropping data available.</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.detailReviewSection}>
                                <Text style={styles.detailLabel}>AI Analysis:</Text>
                                <View style={styles.detailFeedbackBox}>
                                    <Text style={styles.detailFeedbackText}>{evaluation.results[detailIndex].feedback}</Text>
                                </View>

                                <Text style={styles.detailLabel}>Student Answer:</Text>
                                <View style={styles.detailAnswerBox}>
                                    <Text style={styles.detailAnswerText}>{evaluation.results[detailIndex].studentAnswer}</Text>
                                </View>
                            </View>

                            <View style={styles.detailMarkSection}>
                                <Text style={styles.detailLabel}>Adjust Marks (Step 0.5):</Text>
                                <View style={styles.bigMarkAdjustment}>
                                    <TouchableOpacity
                                        style={styles.bigAdjBtn}
                                        onPress={() => adjustMark(detailIndex, -1)}
                                    >
                                        <Minus size={32} color={theme.colors.text} />
                                    </TouchableOpacity>

                                    <View style={styles.bigMarkDisplay}>
                                        <Text style={styles.bigMarkVal}>{evaluation.results[detailIndex].obtainedMarks}</Text>
                                        <Text style={styles.bigMarkMax}>/ {assessment.questions.find(q => q.id === evaluation.results[detailIndex].questionId)?.marks}</Text>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.bigAdjBtn}
                                        onPress={() => adjustMark(detailIndex, 1)}
                                    >
                                        <Plus size={32} color={theme.colors.text} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    )}
                </SafeAreaView>
            </Modal>
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
    pagesScroll: {
        marginBottom: 24,
    },
    pagePreviewCard: {
        width: 220,
        marginRight: 16,
    },
    pageImage: {
        width: 220,
        height: 300,
        borderRadius: 12,
        backgroundColor: '#eee',
    },
    pageLabel: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    pageLabelText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600'
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
    studentNameContainer: {
        width: '100%',
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    studentNameLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    studentNameInput: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingBottom: 8,
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
    feedbackHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.warning + '15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    reviewBadgeText: {
        color: theme.colors.warning,
        fontSize: 12,
        fontWeight: 'bold',
    },
    reviewFeedbackCard: {
        borderLeftColor: theme.colors.warning,
        backgroundColor: theme.colors.warning + '05',
    },
    tinyReviewBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.warning + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 2,
    },
    tinyReviewBadgeText: {
        color: theme.colors.warning,
        fontSize: 10,
        fontWeight: 'bold',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    fullImage: {
        width: width,
        height: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    detailContent: {
        padding: 20,
        paddingBottom: 40,
    },
    detailQuestionSection: {
        marginBottom: 24,
    },
    detailQNum: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    detailQText: {
        color: theme.colors.text,
        fontSize: 20,
        fontWeight: '700',
        lineHeight: 28,
    },
    detailCropSection: {
        marginBottom: 32,
    },
    detailLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 1,
    },
    pageIndicator: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    pageIndicatorText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    noCropBox: {
        height: 150,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
    },
    noCropText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    detailReviewSection: {
        marginBottom: 32,
    },
    detailFeedbackBox: {
        backgroundColor: theme.colors.success + '15',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    detailFeedbackText: {
        color: theme.colors.text,
        fontSize: 15,
        lineHeight: 22,
    },
    detailAnswerBox: {
        backgroundColor: theme.colors.background,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    detailAnswerText: {
        color: theme.colors.text,
        fontSize: 15,
        fontStyle: 'italic',
        lineHeight: 22,
    },
    detailMarkSection: {
        backgroundColor: theme.colors.surface,
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    bigMarkAdjustment: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bigAdjBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    bigMarkDisplay: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    bigMarkVal: {
        color: theme.colors.text,
        fontSize: 48,
        fontWeight: '800',
    },
    bigMarkMax: {
        color: theme.colors.textSecondary,
        fontSize: 24,
        fontWeight: '600',
        marginLeft: 8,
        marginTop: 12,
    },
});
