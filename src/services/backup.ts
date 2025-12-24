import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { StorageService, Assessment, Evaluation } from './storage';
import { settingsService } from './settings';

export interface BackupData {
    version: string;
    timestamp: string;
    assessments: Assessment[];
    evaluations: Evaluation[];
    settings: {
        backupPreferences: any;
    };
}

export interface BackupPreferences {
    autoBackupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly' | 'manual';
    lastBackupTime?: string;
    googleDriveConnected: boolean;
    googleDriveEmail?: string;
}

const BACKUP_VERSION = '1.0.0';

export const BackupService = {
    async createBackup(): Promise<BackupData> {
        const [assessments, evaluations] = await Promise.all([
            StorageService.getAssessments(),
            StorageService.getEvaluations(),
        ]);

        const backupPreferences = await settingsService.getBackupPreferences();

        return {
            version: BACKUP_VERSION,
            timestamp: new Date().toISOString(),
            assessments,
            evaluations,
            settings: {
                backupPreferences,
            },
        };
    },

    async exportToJSON(): Promise<void> {
        try {
            const backup = await this.createBackup();
            const jsonString = JSON.stringify(backup, null, 2);

            const fileName = `checkerq_backup_${new Date().toISOString().split('T')[0]}.json`;
            const fileUri = FileSystem.documentDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, jsonString);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Save Backup File',
                });
            }

            // Update last backup time
            await settingsService.updateLastBackupTime();
        } catch (error) {
            console.error('Export backup error:', error);
            throw new Error('Failed to export backup. Please try again.');
        }
    },

    async importFromJSON(): Promise<void> {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                return;
            }

            const fileUri = result.assets[0].uri;
            const jsonString = await FileSystem.readAsStringAsync(fileUri);
            const backupData: BackupData = JSON.parse(jsonString);

            // Validate backup data
            if (!backupData.version || !backupData.assessments || !backupData.evaluations) {
                throw new Error('Invalid backup file format');
            }

            await this.restoreBackup(backupData);
        } catch (error) {
            console.error('Import backup error:', error);
            throw new Error('Failed to import backup. Please check the file and try again.');
        }
    },

    async restoreBackup(data: BackupData): Promise<void> {
        try {
            // Restore assessments
            for (const assessment of data.assessments) {
                await StorageService.saveAssessment(assessment);
            }

            // Restore evaluations
            for (const evaluation of data.evaluations) {
                await StorageService.saveEvaluation(evaluation);
            }

            // Restore backup preferences
            if (data.settings?.backupPreferences) {
                await settingsService.setBackupPreferences(data.settings.backupPreferences);
            }
        } catch (error) {
            console.error('Restore backup error:', error);
            throw new Error('Failed to restore backup. Please try again.');
        }
    },

    async clearAllData(): Promise<void> {
        try {
            // Get all data to delete
            const [assessments, evaluations] = await Promise.all([
                StorageService.getAssessments(),
                StorageService.getEvaluations(),
            ]);

            // Delete all evaluations
            for (const evaluation of evaluations) {
                await StorageService.deleteEvaluation(evaluation.id);
            }

            // Delete all assessments
            for (const assessment of assessments) {
                await StorageService.deleteAssessment(assessment.id);
            }
        } catch (error) {
            console.error('Clear data error:', error);
            throw new Error('Failed to clear data. Please try again.');
        }
    },

    validateBackupData(data: any): boolean {
        return (
            data &&
            typeof data === 'object' &&
            data.version &&
            Array.isArray(data.assessments) &&
            Array.isArray(data.evaluations)
        );
    },
};
