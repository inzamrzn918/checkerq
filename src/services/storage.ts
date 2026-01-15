import { getDB } from './db';
import { Question } from './gemini';
import * as FileSystem from 'expo-file-system/legacy';

export interface Assessment {
    id: string;
    title: string;
    teacherName: string;
    subject: string;
    classRoom: string;
    examType: string; // e.g. "Unit Test", "Pre Board", "Annual"
    academicYear?: string; // e.g. "2024-25"
    languages?: string[]; // Detected languages
    primaryLanguage?: string; // Selected evaluation language
    questions: Question[];
    paperImages: string[];
    createdAt: number;
}

export interface Student {
    id: string;
    name: string;
    rollNo?: string;
    classRoom?: string;
    academicYear?: string;
    createdAt: number;
}

export interface Evaluation {
    id: string;
    assessmentId: string;
    studentId?: string;
    assessmentTitle?: string; // Cache for easy display
    studentImage?: string; // Legacy support
    pages?: { uri: string; type: 'cover' | 'answer'; marks?: number[]; isMarked?: boolean }[];
    studentName?: string;
    studentRollNo?: string;
    totalMarks: number;
    obtainedMarks: number;
    overallFeedback: string;
    results: any[];
    createdAt: number;
    status: 'pending' | 'processing' | 'completed' | 'paused' | 'error';
    progress: number; // 0-100
    errorMessage?: string;
}

export const StorageService = {
    async saveAssessment(assessment: Assessment): Promise<void> {
        const db = await getDB();
        try {
            await db.withTransactionAsync(async () => {
                // Insert or Replace assessment
                await db.runAsync(
                    `INSERT OR REPLACE INTO assessments (id, title, teacherName, subject, classRoom, examType, academicYear, languages, primaryLanguage, paperImages, createdAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        String(assessment.id),
                        String(assessment.title || 'Untitled'),
                        assessment.teacherName || '',
                        assessment.subject || '',
                        assessment.classRoom || '',
                        assessment.examType || 'General',
                        assessment.academicYear || '',
                        JSON.stringify(assessment.languages || []),
                        assessment.primaryLanguage || 'English',
                        JSON.stringify(assessment.paperImages || []),
                        Number(assessment.createdAt || Date.now())
                    ]
                );

                // Delete old questions if updating
                await db.runAsync('DELETE FROM questions WHERE assessmentId = ?', [String(assessment.id)]);

                // Insert questions
                for (const q of assessment.questions) {
                    await db.runAsync(
                        `INSERT INTO questions (id, assessmentId, text, marks, type, instruction, options)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            String(q.id),
                            String(assessment.id),
                            String(q.text || ''),
                            Number(q.marks || 0),
                            String(q.type || 'Descriptive'),
                            q.instruction || '',
                            JSON.stringify(q.options || [])
                        ]
                    );
                }
            });
        } catch (error) {
            console.error('Error saving assessment to SQLite:', error);
            throw error;
        }
    },

    async getAssessments(): Promise<Assessment[]> {
        const db = await getDB();
        try {
            const rows: any[] = await db.getAllAsync('SELECT * FROM assessments ORDER BY createdAt DESC;');
            const assessments: Assessment[] = [];

            for (const row of rows) {
                const questRows: any[] = await db.getAllAsync('SELECT * FROM questions WHERE assessmentId = ?', [String(row.id)]);
                assessments.push({
                    ...row,
                    examType: row.examType || 'General',
                    paperImages: JSON.parse(row.paperImages || '[]'),
                    questions: questRows.map(q => ({
                        ...q,
                        options: JSON.parse(q.options || '[]')
                    }))
                });
            }
            return assessments;
        } catch (error) {
            console.error('Error getting assessments from SQLite:', error);
            return [];
        }
    },

    async getAssessmentById(id: string): Promise<Assessment | null> {
        const db = await getDB();
        try {
            const row: any = await db.getFirstAsync('SELECT * FROM assessments WHERE id = ?', [String(id)]);
            if (!row) return null;

            const questRows: any[] = await db.getAllAsync('SELECT * FROM questions WHERE assessmentId = ?', [String(id)]);
            return {
                ...row,
                examType: row.examType || 'General',
                paperImages: JSON.parse(row.paperImages || '[]'),
                questions: questRows.map(q => ({
                    ...q,
                    options: JSON.parse(q.options || '[]')
                }))
            };
        } catch (error) {
            console.error('Error getting assessment by ID:', error);
            return null;
        }
    },

    async deleteAssessment(id: string): Promise<void> {
        const db = await getDB();
        try {
            // 1. Get assessment to find paper images
            const assessment = await this.getAssessmentById(id);
            if (assessment && assessment.paperImages) {
                await this.deleteFiles(assessment.paperImages);
            }

            // 2. Get and individual delete all evaluations (cleans their images)
            const evaluations = await this.getEvaluations(id);
            for (const evaluation of evaluations) {
                await this.deleteEvaluation(evaluation.id);
            }

            // 3. Delete assessment and questions from DB
            await db.withTransactionAsync(async () => {
                await db.runAsync('DELETE FROM questions WHERE assessmentId = ?', [String(id)]);
                await db.runAsync('DELETE FROM assessments WHERE id = ?', [String(id)]);
            });
        } catch (error) {
            console.error('Error deleting assessment from SQLite:', error);
            throw error;
        }
    },

    async saveEvaluation(evaluation: Evaluation): Promise<void> {
        const db = await getDB();
        try {
            let studentId = evaluation.studentId;

            // 1. Find or create student if studentName is provided
            if (!studentId && evaluation.studentName) {
                // Get assessment for academicYear and classRoom if not provided in evaluation
                let classRoom = (evaluation.pages?.find(p => p.type === 'cover' && (p as any).classRoom) as any)?.classRoom || '';
                let academicYear = '';

                const assessment = await this.getAssessmentById(evaluation.assessmentId);
                if (assessment) {
                    classRoom = classRoom || assessment.classRoom;
                    academicYear = assessment.academicYear || '';
                }

                // Search for existing student
                const existingStudent: any = await db.getFirstAsync(
                    'SELECT id FROM students WHERE name = ? AND rollNo = ? AND classRoom = ? AND academicYear = ?',
                    [
                        String(evaluation.studentName),
                        String(evaluation.studentRollNo || ''),
                        String(classRoom),
                        String(academicYear)
                    ]
                );

                if (existingStudent) {
                    studentId = existingStudent.id;
                } else {
                    // Create new student
                    studentId = `std_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                    await db.runAsync(
                        'INSERT INTO students (id, name, rollNo, classRoom, academicYear, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                        [
                            studentId,
                            String(evaluation.studentName),
                            String(evaluation.studentRollNo || ''),
                            String(classRoom),
                            String(academicYear),
                            Date.now()
                        ]
                    );
                }
            }

            await db.runAsync(
                `INSERT OR REPLACE INTO evaluations (id, assessmentId, studentId, assessmentTitle, studentImage, studentName, studentRollNo, pages, totalMarks, obtainedMarks, overallFeedback, results, status, progress, errorMessage, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    String(evaluation.id),
                    String(evaluation.assessmentId),
                    studentId || null,
                    evaluation.assessmentTitle || '',
                    evaluation.studentImage || '',
                    evaluation.studentName || 'Unknown Student',
                    evaluation.studentRollNo || '',
                    JSON.stringify(evaluation.pages || []),
                    Number(evaluation.totalMarks || 0),
                    Number(evaluation.obtainedMarks || 0),
                    evaluation.overallFeedback || '',
                    JSON.stringify(evaluation.results || []),
                    evaluation.status || 'completed',
                    Number(evaluation.progress || 0),
                    evaluation.errorMessage || '',
                    Number(evaluation.createdAt || Date.now())
                ]
            );
        } catch (error) {
            console.error('Error saving evaluation:', error);
            throw error;
        }
    },

    async getStudents(filters: { academicYear?: string; classRoom?: string } = {}): Promise<Student[]> {
        const db = await getDB();
        try {
            let query = 'SELECT * FROM students';
            let params: any[] = [];
            let conditions: string[] = [];

            if (filters.academicYear) {
                conditions.push('academicYear = ?');
                params.push(filters.academicYear);
            }
            if (filters.classRoom) {
                conditions.push('classRoom = ?');
                params.push(filters.classRoom);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            query += ' ORDER BY name ASC';

            return await db.getAllAsync(query, params);
        } catch (error) {
            console.error('Error getting students:', error);
            return [];
        }
    },

    async getYears(): Promise<string[]> {
        const db = await getDB();
        try {
            const rows: any[] = await db.getAllAsync('SELECT DISTINCT academicYear FROM assessments WHERE academicYear IS NOT NULL AND academicYear != "" ORDER BY academicYear DESC');
            return rows.map(r => r.academicYear);
        } catch (error) {
            console.error('Error getting years:', error);
            return [];
        }
    },

    async getClasses(academicYear: string): Promise<string[]> {
        const db = await getDB();
        try {
            const rows: any[] = await db.getAllAsync('SELECT DISTINCT classRoom FROM assessments WHERE academicYear = ? ORDER BY classRoom ASC', [academicYear]);
            return rows.map(r => r.classRoom);
        } catch (error) {
            console.error('Error getting classes:', error);
            return [];
        }
    },

    async getExamTypes(academicYear: string, classRoom: string): Promise<string[]> {
        const db = await getDB();
        try {
            const rows: any[] = await db.getAllAsync('SELECT DISTINCT examType FROM assessments WHERE academicYear = ? AND classRoom = ? ORDER BY examType ASC', [academicYear, classRoom]);
            return rows.map(r => r.examType);
        } catch (error) {
            console.error('Error getting exam types:', error);
            return [];
        }
    },

    async getStudentsByExamType(academicYear: string, classRoom: string, examType: string): Promise<Student[]> {
        const db = await getDB();
        try {
            // Join evaluations, assessments and students to get students who have evaluations in this specific exam type
            const rows: any[] = await db.getAllAsync(
                `SELECT DISTINCT s.* FROM students s
                 JOIN evaluations e ON s.id = e.studentId
                 JOIN assessments a ON e.assessmentId = a.id
                 WHERE a.academicYear = ? AND a.classRoom = ? AND a.examType = ?
                 ORDER BY s.name ASC`,
                [academicYear, classRoom, examType]
            );
            return rows;
        } catch (error) {
            console.error('Error getting students by exam type:', error);
            return [];
        }
    },

    async getStudentEvaluations(studentId: string): Promise<Evaluation[]> {
        const db = await getDB();
        try {
            const rows: any[] = await db.getAllAsync(
                'SELECT * FROM evaluations WHERE studentId = ? ORDER BY createdAt DESC',
                [studentId]
            );
            return rows.map(r => ({
                ...r,
                results: JSON.parse(r.results || '[]'),
                pages: JSON.parse(r.pages || '[]'),
                status: r.status || 'completed',
                progress: r.progress || 0
            }));
        } catch (error) {
            console.error('Error getting student evaluations:', error);
            return [];
        }
    },

    async getEvaluations(assessmentId?: string): Promise<Evaluation[]> {
        const db = await getDB();
        try {
            let query = 'SELECT * FROM evaluations ORDER BY createdAt DESC;';
            let params: any[] = [];
            if (assessmentId) {
                query = 'SELECT * FROM evaluations WHERE assessmentId = ? ORDER BY createdAt DESC';
                params = [String(assessmentId)];
            }
            const rows: any[] = await db.getAllAsync(query, params);
            return rows.map(r => ({
                ...r,
                results: JSON.parse(r.results || '[]'),
                pages: JSON.parse(r.pages || '[]'),
                status: r.status || 'completed',
                progress: r.progress || 0
            }));
        } catch (error) {
            console.error('Error getting evaluations:', error);
            return [];
        }
    },

    async deleteEvaluation(id: string): Promise<void> {
        const db = await getDB();
        try {
            // 1. Get evaluation to find images
            const row: any = await db.getFirstAsync('SELECT studentImage, pages FROM evaluations WHERE id = ?', [String(id)]);
            if (row) {
                const imagesToDelete: string[] = [];
                if (row.studentImage) imagesToDelete.push(row.studentImage);
                if (row.pages) {
                    const pages = JSON.parse(row.pages);
                    pages.forEach((p: any) => { if (p.uri) imagesToDelete.push(p.uri); });
                }
                await this.deleteFiles(imagesToDelete);
            }

            // 2. Delete from DB
            await db.runAsync('DELETE FROM evaluations WHERE id = ?', [String(id)]);
        } catch (error) {
            console.error('Error deleting evaluation:', error);
            throw error;
        }
    },

    async deleteFiles(uris: string[]): Promise<void> {
        for (const uri of uris) {
            try {
                if (!uri) continue;
                // Only delete if it's a local file
                if (uri.startsWith('file://') || uri.startsWith('/')) {
                    const info = await FileSystem.getInfoAsync(uri);
                    if (info.exists) {
                        await FileSystem.deleteAsync(uri, { idempotent: true });
                    }
                }
            } catch (error) {
                console.warn(`Failed to delete file: ${uri}`, error);
            }
        }
    },

    async getStorageUsage(): Promise<number> {
        try {
            let totalSize = 0;

            // 1. Check Document Directory (usually where images are copied)
            const docDir = FileSystem.documentDirectory;
            if (docDir) {
                totalSize += await this.getDirSize(docDir);
            }

            // 2. Check Cache Directory (temporary pickings)
            const cacheDir = FileSystem.cacheDirectory;
            if (cacheDir) {
                totalSize += await this.getDirSize(cacheDir);
            }

            return totalSize;
        } catch (error) {
            console.error('Error calculating storage usage:', error);
            return 0;
        }
    },

    async getEvaluationStats(): Promise<{ today: number, month: number }> {
        const db = await getDB();
        try {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

            const [todayResult, monthResult]: any[] = await Promise.all([
                db.getFirstAsync('SELECT COUNT(*) as count FROM evaluations WHERE createdAt >= ?', [startOfDay]),
                db.getFirstAsync('SELECT COUNT(*) as count FROM evaluations WHERE createdAt >= ?', [startOfMonth])
            ]);

            return {
                today: todayResult?.count || 0,
                month: monthResult?.count || 0
            };
        } catch (error) {
            console.error('Error getting evaluation stats:', error);
            return { today: 0, month: 0 };
        }
    },

    async getDirSize(dirUri: string): Promise<number> {
        try {
            let size = 0;
            const files = await FileSystem.readDirectoryAsync(dirUri);

            for (const file of files) {
                const fileUri = dirUri.endsWith('/') ? `${dirUri}${file}` : `${dirUri}/${file}`;
                const info = await FileSystem.getInfoAsync(fileUri);
                if (info.exists) {
                    if (info.isDirectory) {
                        size += await this.getDirSize(`${fileUri}/`);
                    } else {
                        size += (info as any).size || 0;
                    }
                }
            }
            return size;
        } catch (error) {
            return 0;
        }
    }
};
