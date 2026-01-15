import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { ChevronLeft, Save, Plus, Trash2, Globe, Check } from 'lucide-react-native';
import { Question } from '../services/gemini';
import { StorageService } from '../services/storage';

export default function ReviewQuestionsScreen({ route, navigation }: any) {
    const { questions: initialQuestions, paperImages, metadata, languages: detectedLanguages = [] } = route.params;
    const [questions, setQuestions] = useState<Question[]>(initialQuestions);
    const [languages, setLanguages] = useState<string[]>(detectedLanguages.length > 0 ? detectedLanguages : ['English']);
    const [primaryLanguage, setPrimaryLanguage] = useState(
        detectedLanguages.includes('English') ? 'English' : (detectedLanguages[0] || 'English')
    );
    const [newLang, setNewLang] = useState('');
    const [showAddLang, setShowAddLang] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            if (isSaved) {
                return;
            }

            e.preventDefault();

            Alert.alert(
                'Discard extracted questions?',
                'Going back will discard the extracted questions and you will need to process the paper again. Are you sure?',
                [
                    { text: "Stay here", style: 'cancel', onPress: () => { } },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => navigation.dispatch(e.data.action),
                    },
                ]
            );
        });

        return unsubscribe;
    }, [navigation, isSaved]);

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const removeQuestion = (id: string) => {
        setQuestions(prev => prev.filter(q => q.id !== id));
    };

    const addQuestion = () => {
        const newQ: Question = {
            id: `q${Date.now()}`,
            text: '',
            marks: 0,
            type: 'Descriptive'
        };
        setQuestions([...questions, newQ]);
    };

    const saveAssessment = async () => {
        try {
            const assessment = {
                id: `asmt_${Date.now()}`,
                title: `${metadata.subject} - ${metadata.classRoom}`,
                teacherName: metadata.teacherName,
                subject: metadata.subject,
                classRoom: metadata.classRoom,
                examType: metadata.examType || 'General',
                academicYear: metadata.academicYear,
                languages,
                primaryLanguage,
                questions,
                paperImages,
                createdAt: Date.now(),
            };
            await StorageService.saveAssessment(assessment as any);
            setIsSaved(true);
            navigation.navigate('Home', { refresh: true });
        } catch (error) {
            console.error('Error saving assessment:', error);
        }
    };

    const addLanguage = () => {
        if (newLang.trim() && !languages.includes(newLang.trim())) {
            setLanguages([...languages, newLang.trim()]);
            setNewLang('');
            setShowAddLang(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Review Questions</Text>
                <TouchableOpacity onPress={saveAssessment}>
                    <Save color={theme.colors.primary} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.instruction}>Step 2: Language & Scheme</Text>

                {/* Language Selection */}
                <View style={[styles.qCard, { marginBottom: 24 }]}>
                    <View style={styles.sectionHeader}>
                        <Globe size={18} color={theme.colors.primary} />
                        <Text style={styles.sectionTitle}>Select Evaluation Language</Text>
                    </View>
                    <Text style={styles.sectionSub}>English is default. AI will evaluate student answers in this language.</Text>

                    <View style={styles.langList}>
                        {languages.map(lang => (
                            <TouchableOpacity
                                key={lang}
                                style={[styles.langChip, primaryLanguage === lang && styles.langChipActive]}
                                onPress={() => setPrimaryLanguage(lang)}
                            >
                                <Text style={[styles.langText, primaryLanguage === lang && styles.langTextActive]}>{lang}</Text>
                                {primaryLanguage === lang && <Check size={14} color="#fff" style={{ marginLeft: 4 }} />}
                            </TouchableOpacity>
                        ))}

                        {!showAddLang ? (
                            <TouchableOpacity style={styles.addLangToggle} onPress={() => setShowAddLang(true)}>
                                <Plus size={14} color={theme.colors.primary} />
                                <Text style={styles.addLangToggleText}>Add Language</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.addLangInputRow}>
                                <TextInput
                                    style={styles.addLangInput}
                                    placeholder="Language name..."
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={newLang}
                                    onChangeText={setNewLang}
                                    autoFocus
                                />
                                <TouchableOpacity style={styles.addLangBtn} onPress={addLanguage}>
                                    <Text style={styles.addLangBtnText}>Add</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelLangBtn} onPress={() => setShowAddLang(false)}>
                                    <Text style={styles.cancelLangBtnText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {questions.map((q, index) => (
                    <View key={q.id} style={styles.qCard}>
                        <View style={styles.qHeader}>
                            <View style={styles.qNumContainer}>
                                <Text style={styles.qNumLabel}>No.</Text>
                                <TextInput
                                    style={styles.qNumInput}
                                    value={q.questionNumber || (index + 1).toString()}
                                    onChangeText={(val) => updateQuestion(q.id, 'questionNumber', val)}
                                    placeholder="?"
                                />
                            </View>
                            <TouchableOpacity onPress={() => removeQuestion(q.id)}>
                                <Trash2 color={theme.colors.error} size={18} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.textInput}
                            value={q.text}
                            placeholder="Question text"
                            placeholderTextColor={theme.colors.textSecondary}
                            multiline
                            onChangeText={(val) => updateQuestion(q.id, 'text', val)}
                        />

                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Max Marks</Text>
                                <TextInput
                                    style={styles.marksInput}
                                    value={q.marks.toString()}
                                    keyboardType="numeric"
                                    onChangeText={(val) => updateQuestion(q.id, 'marks', parseInt(val) || 0)}
                                />
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Type</Text>
                                <Text style={styles.typeText}>{q.type}</Text>
                            </View>
                        </View>

                        {q.instruction && (
                            <View style={styles.field}>
                                <Text style={styles.label}>Instruction</Text>
                                <TextInput
                                    style={styles.instructionInput}
                                    value={q.instruction}
                                    onChangeText={(val) => updateQuestion(q.id, 'instruction', val)}
                                />
                            </View>
                        )}
                    </View>
                ))}

                <TouchableOpacity style={styles.addBtn} onPress={addQuestion}>
                    <Plus color={theme.colors.text} size={20} />
                    <Text style={styles.addBtnText}>Add Question</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.confirmBtn} onPress={saveAssessment}>
                    <Text style={styles.confirmBtnText}>Confirm & Start Evaluating</Text>
                </TouchableOpacity>
            </View>
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
    instruction: {
        color: theme.colors.text,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    qCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    qHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    qNumContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.colors.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    qNumLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.primary,
        textTransform: 'uppercase',
    },
    qNumInput: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
        minWidth: 40,
        textAlign: 'center',
    },
    textInput: {
        color: theme.colors.text,
        fontSize: 16,
        backgroundColor: theme.colors.background,
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    field: {
        flex: 1,
    },
    label: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginBottom: 4,
    },
    marksInput: {
        color: theme.colors.text,
        backgroundColor: theme.colors.background,
        padding: 8,
        borderRadius: 8,
        textAlign: 'center',
    },
    typeText: {
        color: theme.colors.accent,
        fontWeight: '600',
        padding: 8,
    },
    instructionInput: {
        color: theme.colors.textSecondary,
        backgroundColor: theme.colors.background,
        padding: 8,
        borderRadius: 8,
        fontSize: 14,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        borderStyle: 'dashed',
        marginTop: 8,
    },
    addBtnText: {
        color: theme.colors.text,
        marginLeft: 8,
        fontSize: 16,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    confirmBtn: {
        backgroundColor: theme.colors.success,
        padding: 18,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    sectionSub: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 16,
    },
    langList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
    },
    langChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },
    langChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    langText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    langTextActive: {
        color: '#fff',
    },
    addLangToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    addLangToggleText: {
        fontSize: 13,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    addLangInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingLeft: 12,
        paddingRight: 4,
        height: 36,
    },
    addLangInput: {
        color: theme.colors.text,
        fontSize: 13,
        width: 100,
        paddingVertical: 0,
    },
    addLangBtn: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    addLangBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cancelLangBtn: {
        paddingHorizontal: 8,
    },
    cancelLangBtnText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
});
