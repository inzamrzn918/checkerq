import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { ChevronLeft, Save, Plus, Trash2 } from 'lucide-react-native';
import { Question } from '../services/gemini';
import { StorageService } from '../services/storage';

export default function ReviewQuestionsScreen({ route, navigation }: any) {
    const { questions: initialQuestions, paperImages, metadata } = route.params;
    const [questions, setQuestions] = useState<Question[]>(initialQuestions);
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
                questions,
                paperImages,
                createdAt: Date.now(),
            };
            await StorageService.saveAssessment(assessment);
            setIsSaved(true);
            navigation.navigate('Home', { refresh: true });
        } catch (error) {
            console.error('Error saving assessment:', error);
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
                <Text style={styles.instruction}>Step 2: Verify Marking Scheme</Text>

                {questions.map((q, index) => (
                    <View key={q.id} style={styles.qCard}>
                        <View style={styles.qHeader}>
                            <Text style={styles.qNumber}>Q{index + 1}</Text>
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
    qNumber: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
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
});
