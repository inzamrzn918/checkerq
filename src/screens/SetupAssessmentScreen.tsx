import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { theme } from '../theme/theme';
import { Upload, ChevronLeft, FileImage, FileText } from 'lucide-react-native';
import { GeminiService } from '../services/gemini';
import { useConfig } from '../context/ConfigContext';

export default function SetupAssessmentScreen({ navigation }: any) {
    const { config } = useConfig();
    const [images, setImages] = useState<string[]>([]);
    const [teacherName, setTeacherName] = useState('');
    const [subject, setSubject] = useState('');
    const [classRoom, setClassRoom] = useState('');
    const [loading, setLoading] = useState(false);

    // Get upload limits from config
    const uploadLimits = config?.upload_limits;
    const maxFileSize = uploadLimits?.max_file_size ?? 10485760; // 10MB default
    const allowedTypes = uploadLimits?.allowed_file_types ?? ['pdf', 'jpg', 'jpeg', 'png'];
    const maxFiles = uploadLimits?.max_files_per_assessment ?? 10;

    // Helper function to format bytes
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Helper function to get file extension
    const getFileExtension = (uri: string): string => {
        return uri.split('.').pop()?.toLowerCase() ?? '';
    };

    // Helper function to validate file
    const validateFile = async (uri: string): Promise<boolean> => {
        try {
            // Check file count
            if (images.length >= maxFiles) {
                Alert.alert('Too Many Files', `Maximum ${maxFiles} files allowed per assessment`);
                return false;
            }

            // Check file type
            const ext = getFileExtension(uri);
            if (!allowedTypes.includes(ext)) {
                Alert.alert(
                    'Invalid File Type',
                    `Only ${allowedTypes.join(', ').toUpperCase()} files are allowed`
                );
                return false;
            }

            // Check file size
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (fileInfo.exists && 'size' in fileInfo && fileInfo.size > maxFileSize) {
                Alert.alert(
                    'File Too Large',
                    `Maximum file size is ${formatBytes(maxFileSize)}. This file is ${formatBytes(fileInfo.size)}`
                );
                return false;
            }

            return true;
        } catch (error) {
            console.error('File validation error:', error);
            return true; // Allow on error to not block user
        }
    };

    const isFormFilled = teacherName.trim() !== '' || subject.trim() !== '' || classRoom.trim() !== '' || images.length > 0;

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            if (!isFormFilled || loading) {
                // If the form is empty, or we're currently processing, don't show the alert
                return;
            }

            // Prevent default behavior of leaving the screen
            e.preventDefault();

            // Prompt the user before leaving the screen
            Alert.alert(
                'Discard changes?',
                'You have unsaved changes. Are you sure you want to discard them and leave the screen?',
                [
                    { text: "Don't leave", style: 'cancel', onPress: () => { } },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        // If the user confirms, then we can continue the action
                        onPress: () => navigation.dispatch(e.data.action),
                    },
                ]
            );
        });

        return unsubscribe;
    }, [navigation, isFormFilled, loading]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            // Validate each selected image
            const validatedUris: string[] = [];
            for (const asset of result.assets) {
                const isValid = await validateFile(asset.uri);
                if (isValid) {
                    validatedUris.push(asset.uri);
                }
            }
            if (validatedUris.length > 0) {
                setImages(prev => [...prev, ...validatedUris]);
            }
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required to take photos of question papers');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
        });

        if (!result.canceled) {
            const isValid = await validateFile(result.assets[0].uri);
            if (isValid) {
                setImages(prev => [...prev, result.assets[0].uri]);
            }
        }
    };

    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf',
            copyToCacheDirectory: true,
        });

        if (!result.canceled) {
            const isValid = await validateFile(result.assets[0].uri);
            if (isValid) {
                // For now, we'll treat PDF as a single entry in images array
                // GeminiService will need to handle it
                setImages(prev => [...prev, result.assets[0].uri]);
            }
        }
    };

    const processPaper = async () => {
        if (images.length === 0) return;
        if (!teacherName || !subject || !classRoom) {
            Alert.alert('Missing Info', 'Please fill in all details');
            return;
        }

        setLoading(true);
        try {
            // We'll pass all images to extraction
            const questions = await GeminiService.extractQuestions(images);
            navigation.navigate('ReviewQuestions', {
                questions,
                paperImages: images,
                metadata: { teacherName, subject, classRoom }
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to extract questions. Please check your API key and try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft color={theme.colors.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>New Assessment</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.instruction}>
                    Assessment Details
                </Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Teacher Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. John Doe"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={teacherName}
                        onChangeText={setTeacherName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Subject</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Mathematics"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={subject}
                        onChangeText={setSubject}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Class / Section</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 10th A"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={classRoom}
                        onChangeText={setClassRoom}
                    />
                </View>

                <Text style={[styles.instruction, { marginTop: 24 }]}>
                    Upload Question Paper
                </Text>
                <Text style={styles.subInstruction}>
                    Upload images or a PDF. System will extract questions.
                </Text>

                <View style={styles.uploadOptions}>
                    <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                        <FileImage color={theme.colors.primary} size={32} />
                        <Text style={styles.uploadBoxText}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.uploadBox} onPress={takePhoto}>
                        <Upload color={theme.colors.secondary} size={32} />
                        <Text style={styles.uploadBoxText}>Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
                        <FileText color={theme.colors.accent} size={32} />
                        <Text style={styles.uploadBoxText}>PDF</Text>
                    </TouchableOpacity>
                </View>

                {images.length > 0 && (
                    <View style={styles.imageList}>
                        <Text style={styles.listTitle}>{images.length} Pages Uploaded</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {images.map((uri, idx) => (
                                <View key={idx} style={styles.thumbnailContainer}>
                                    <Image source={{ uri }} style={styles.thumbnail} />
                                    <TouchableOpacity
                                        style={styles.removeThumbnail}
                                        onPress={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 10 }}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.processBtn, (images.length === 0 || loading) && styles.disabledBtn]}
                        onPress={processPaper}
                        disabled={images.length === 0 || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.processBtnText}>Extract Questions</Text>
                        )}
                    </TouchableOpacity>
                </View>
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
        flex: 1,
        padding: theme.spacing.lg,
    },
    instruction: {
        color: theme.colors.text,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subInstruction: {
        color: theme.colors.textSecondary,
        fontSize: 16,
        marginBottom: 32,
    },
    uploadOptions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        height: 200,
    },
    uploadBox: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
    },
    uploadBoxText: {
        color: theme.colors.text,
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
    },
    previewContainer: {
        flex: 1,
        alignItems: 'center',
    },
    preview: {
        width: '100%',
        height: 400,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.surface,
    },
    changeBtn: {
        marginTop: 16,
        padding: 12,
    },
    changeBtnText: {
        color: theme.colors.secondary,
        fontWeight: '600',
    },
    footer: {
        marginTop: 'auto',
        paddingBottom: theme.spacing.xl,
    },
    processBtn: {
        backgroundColor: theme.colors.primary,
        padding: 18,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    disabledBtn: {
        backgroundColor: theme.colors.border,
    },
    processBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    inputGroup: {
        marginBottom: theme.spacing.md,
    },
    label: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: 14,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
        fontSize: 16,
    },
    imageList: {
        marginTop: 24,
    },
    listTitle: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    thumbnailContainer: {
        marginRight: 12,
        position: 'relative',
    },
    thumbnail: {
        width: 80,
        height: 100,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
    },
    removeThumbnail: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: theme.colors.error,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
});
