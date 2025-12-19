import AsyncStorage from '@react-native-async-storage/async-storage';
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

const STORAGE_KEY = 'checkerq_assessments';

export const StorageService = {
    async saveAssessment(assessment: Assessment): Promise<void> {
        try {
            const existing = await this.getAssessments();
            const updated = [assessment, ...existing.filter(a => a.id !== assessment.id)];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Error saving assessment:', error);
            throw error;
        }
    },

    async getAssessments(): Promise<Assessment[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting assessments:', error);
            return [];
        }
    },

    async deleteAssessment(id: string): Promise<void> {
        try {
            const existing = await this.getAssessments();
            const filtered = existing.filter(a => a.id !== id);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('Error deleting assessment:', error);
            throw error;
        }
    }
};
