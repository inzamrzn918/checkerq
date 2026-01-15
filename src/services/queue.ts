import { StorageService, Evaluation } from './storage';
import { GeminiService } from './gemini';
import { MistralService } from './mistral';
import { settingsService } from './settings';

export interface ScanJob {
    id: string;
    assessmentId: string;
    assessmentTitle: string;
    pages: { uri: string; type: 'cover' | 'answer' }[];
    language: string;
    studentName?: string;
    studentRollNo?: string;
}

class EvaluationQueueService {
    private queue: Evaluation[] = [];
    private activeJobs = 0;
    private maxConcurrent = 3;
    private listeners: ((evaluations: Evaluation[]) => void)[] = [];

    constructor() {
        this.loadQueue();
    }

    private async loadQueue() {
        const mc = await settingsService.getMaxConcurrent();
        this.maxConcurrent = mc;

        const evals = await StorageService.getEvaluations();
        this.queue = evals.filter(e => e.status === 'pending' || e.status === 'processing');
        // Reset processing to pending on restart
        this.queue.forEach(e => {
            if (e.status === 'processing') e.status = 'pending';
        });
        this.processNext();
    }

    setMaxConcurrent(count: number) {
        this.maxConcurrent = count;
        this.processNext();
    }

    addListener(callback: (evaluations: Evaluation[]) => void) {
        this.listeners.push(callback);
        callback([...this.queue]);
    }

    removeListener(callback: (evaluations: Evaluation[]) => void) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    private notify() {
        this.listeners.forEach(l => l([...this.queue]));
    }

    async addJob(job: ScanJob) {
        const evaluation: Evaluation = {
            id: job.id,
            assessmentId: job.assessmentId,
            assessmentTitle: job.assessmentTitle,
            studentName: job.studentName,
            studentRollNo: job.studentRollNo,
            pages: job.pages,
            totalMarks: 0,
            obtainedMarks: 0,
            overallFeedback: '',
            results: [],
            createdAt: Date.now(),
            status: 'pending',
            progress: 0
        };

        this.queue.push(evaluation);
        await StorageService.saveEvaluation(evaluation);
        this.notify();
        this.processNext();
    }

    private async processNext() {
        if (this.activeJobs >= this.maxConcurrent) return;

        const nextJob = this.queue.find(j => j.status === 'pending');
        if (!nextJob) return;

        this.activeJobs++;
        await this.runJob(nextJob);
        this.activeJobs--;
        this.processNext();
    }

    private async runJob(evaluation: Evaluation) {
        try {
            evaluation.status = 'processing';
            evaluation.progress = 10;
            this.notify();
            await StorageService.saveEvaluation(evaluation);

            const assessment = await StorageService.getAssessmentById(evaluation.assessmentId);
            if (!assessment) throw new Error("Assessment not found");

            // 1. OCR all answer pages
            const answerPages = evaluation.pages?.filter(p => p.type === 'answer') || [];
            let fullText = "";

            for (let i = 0; i < answerPages.length; i++) {
                const page = answerPages[i];
                evaluation.progress = 10 + Math.round((i / answerPages.length) * 40);
                this.notify();

                // Using Gemini OCR as fallback or Mistral
                let text = "";
                const mistralKey = MistralService.getApiKey();
                if (mistralKey) {
                    text = await MistralService.extractText(page.uri);
                } else {
                    text = await GeminiService.extractText(page.uri);
                }
                fullText += `\n--- Page ${i + 1} ---\n${text}`;
            }

            // 2. Evaluate
            evaluation.progress = 60;
            this.notify();

            const result = await GeminiService.evaluatePaperText(fullText, assessment.questions);

            // 3. Complete
            evaluation.status = 'completed';
            evaluation.progress = 100;
            evaluation.studentName = evaluation.studentName || result.studentName;
            evaluation.totalMarks = result.totalMarks;
            evaluation.obtainedMarks = result.obtainedMarks;
            evaluation.overallFeedback = result.overallFeedback;
            evaluation.results = result.results;

            await StorageService.saveEvaluation(evaluation);
            this.queue = this.queue.filter(j => j.id !== evaluation.id);
            this.notify();

        } catch (error: any) {
            console.error("Job Error:", error);
            evaluation.status = 'error';
            evaluation.errorMessage = error.message;
            await StorageService.saveEvaluation(evaluation);
            this.notify();
        }
    }

    async pauseJob(id: string) {
        const job = this.queue.find(j => j.id === id);
        if (job && job.status === 'pending') {
            job.status = 'paused';
            await StorageService.saveEvaluation(job);
            this.notify();
        }
    }

    async resumeJob(id: string) {
        const job = this.queue.find(j => j.id === id);
        if (job && job.status === 'paused') {
            job.status = 'pending';
            await StorageService.saveEvaluation(job);
            this.notify();
            this.processNext();
        }
    }

    async cancelJob(id: string) {
        const job = this.queue.find(j => j.id === id);
        if (job) {
            // Remove from local queue
            this.queue = this.queue.filter(j => j.id !== id);
            // Delete from storage
            await StorageService.deleteEvaluation(id);
            this.notify();
        }
    }
}

export const evaluationQueue = new EvaluationQueueService();
