import { getDB } from './db';
import { Question } from './gemini';

export interface Assessment {
    id: string;
    title: string;
    teacherName: string;
    subject: string;
    classRoom: string;
    questions: Question[];
    paperImages: string[];
    createdAt: number;
}

export interface Evaluation {
    id: string;
    assessmentId: string;
    studentImage?: string; // Legacy support
    pages?: { uri: string; type: 'cover' | 'answer'; marks?: number[] }[];
    studentName?: string;
    totalMarks: number;
    obtainedMarks: number;
    overallFeedback: string;
    results: any[];
    createdAt: number;
}

export const StorageService = {
    async saveAssessment(assessment: Assessment): Promise<void> {
        const db = await getDB();
        try {
            await db.withTransactionAsync(async () => {
                // Insert or Replace assessment
                await db.runAsync(
                    `INSERT OR REPLACE INTO assessments (id, title, teacherName, subject, classRoom, paperImages, createdAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        String(assessment.id),
                        String(assessment.title || 'Untitled'),
                        assessment.teacherName || '',
                        assessment.subject || '',
                        assessment.classRoom || '',
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
            await db.runAsync('DELETE FROM assessments WHERE id = ?', [String(id)]);
        } catch (error) {
            console.error('Error deleting assessment from SQLite:', error);
            throw error;
        }
    },

    async saveEvaluation(evaluation: Evaluation): Promise<void> {
        const db = await getDB();
        try {
            await db.runAsync(
                `INSERT OR REPLACE INTO evaluations (id, assessmentId, studentImage, studentName, pages, totalMarks, obtainedMarks, overallFeedback, results, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    String(evaluation.id),
                    String(evaluation.assessmentId),
                    evaluation.studentImage || '',
                    evaluation.studentName || 'Unknown Student',
                    JSON.stringify(evaluation.pages || []),
                    Number(evaluation.totalMarks || 0),
                    Number(evaluation.obtainedMarks || 0),
                    evaluation.overallFeedback || '',
                    JSON.stringify(evaluation.results || []),
                    Number(evaluation.createdAt || Date.now())
                ]
            );
        } catch (error) {
            console.error('Error saving evaluation:', error);
            throw error;
        }
    },

    async getEvaluations(assessmentId?: string): Promise<Evaluation[]> {
        const db = await getDB();
        try {
            let query = 'SELECT * FROM evaluations ORDER BY createdAt DESC;';
            let params: any[] = [];
            if (assessmentId) {
                query = 'SELECT * FROM evaluations WHERE assessmentId = ? ORDER BY createdAt DESC';
                const rows: any[] = await db.getAllAsync(query, [String(assessmentId)]);
                return rows.map(r => ({
                    ...r,
                    results: JSON.parse(r.results || '[]'),
                    pages: JSON.parse(r.pages || '[]')
                }));
            }
            const rows: any[] = await db.getAllAsync(query, []);
            return rows.map(r => ({
                ...r,
                results: JSON.parse(r.results || '[]'),
                pages: JSON.parse(r.pages || '[]')
            }));
        } catch (error) {
            console.error('Error getting evaluations:', error);
            return [];
        }
    },

    async deleteEvaluation(id: string): Promise<void> {
        const db = await getDB();
        try {
            await db.runAsync('DELETE FROM evaluations WHERE id = ?', [String(id)]);
        } catch (error) {
            console.error('Error deleting evaluation:', error);
            throw error;
        }
    }
};
