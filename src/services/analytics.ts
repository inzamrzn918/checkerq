import { Assessment, Evaluation } from './storage';

export interface ClassPerformance {
    className: string;
    averageScore: number;
    passRate: number;
    totalStudents: number;
    totalEvaluations: number;
    gradeDistribution: {
        A: number;
        B: number;
        C: number;
        D: number;
        F: number;
    };
}

export interface QuestionStats {
    questionId: string;
    questionText: string;
    maxMarks: number;
    averageMarks: number;
    successRate: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    attemptedBy: number;
}

export interface StudentProgress {
    studentName: string;
    evaluations: {
        date: string;
        subject: string;
        score: number;
        totalMarks: number;
        percentage: number;
    }[];
    averageScore: number;
    trend: 'improving' | 'declining' | 'stable';
    subjectPerformance: Record<string, number>;
}

const getGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
};

export const AnalyticsService = {
    getClassPerformance(evaluations: Evaluation[], assessments: Assessment[], className?: string): ClassPerformance[] {
        const filtered = className
            ? evaluations.filter(e => {
                const assessment = assessments.find(a => a.id === e.assessmentId);
                return assessment?.classRoom === className;
            })
            : evaluations;

        // Group by class
        const byClass: Record<string, Evaluation[]> = {};
        filtered.forEach(ev => {
            const assessment = assessments.find(a => a.id === ev.assessmentId);
            const cls = assessment?.classRoom || 'Unknown';
            if (!byClass[cls]) byClass[cls] = [];
            byClass[cls].push(ev);
        });

        return Object.entries(byClass).map(([cls, evals]) => {
            const scores = evals.map(e => (e.obtainedMarks / e.totalMarks) * 100);
            const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            const passRate = (scores.filter(s => s >= 60).length / scores.length) * 100;

            const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
            scores.forEach(score => {
                const grade = getGrade(score);
                grades[grade as keyof typeof grades]++;
            });

            return {
                className: cls,
                averageScore: Math.round(averageScore * 10) / 10,
                passRate: Math.round(passRate * 10) / 10,
                totalStudents: new Set(evals.map(e => e.studentName)).size,
                totalEvaluations: evals.length,
                gradeDistribution: grades,
            };
        });
    },

    getQuestionAnalysis(evaluations: Evaluation[], assessmentId: string, questions: any[]): QuestionStats[] {
        const filtered = evaluations.filter(e => e.assessmentId === assessmentId);
        if (filtered.length === 0) return [];

        return questions.map(q => {
            const results = filtered
                .map(e => e.results?.find(r => r.questionId === q.id))
                .filter(Boolean);

            const totalMarks = results.reduce((sum, r) => sum + (r?.obtainedMarks || 0), 0);
            const avgMarks = results.length > 0 ? totalMarks / results.length : 0;
            const successRate = (avgMarks / q.marks) * 100;

            let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
            if (successRate >= 70) difficulty = 'Easy';
            else if (successRate < 50) difficulty = 'Hard';

            return {
                questionId: q.id,
                questionText: q.text,
                maxMarks: q.marks,
                averageMarks: Math.round(avgMarks * 10) / 10,
                successRate: Math.round(successRate * 10) / 10,
                difficulty,
                attemptedBy: results.length,
            };
        });
    },

    getStudentProgress(evaluations: Evaluation[], studentName: string, assessments: Assessment[]): StudentProgress | null {
        const studentEvals = evaluations.filter(e => e.studentName === studentName);
        if (studentEvals.length === 0) return null;

        const evalData = studentEvals.map(e => {
            const assessment = assessments.find(a => a.id === e.assessmentId);
            const percentage = (e.obtainedMarks / e.totalMarks) * 100;
            return {
                date: e.createdAt,
                subject: assessment?.subject || 'Unknown',
                score: e.obtainedMarks,
                totalMarks: e.totalMarks,
                percentage: Math.round(percentage * 10) / 10,
            };
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const avgScore = evalData.reduce((sum, e) => sum + e.percentage, 0) / evalData.length;

        // Calculate trend
        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        if (evalData.length >= 3) {
            const recent = evalData.slice(-3).map(e => e.percentage);
            const isImproving = recent[2] > recent[1] && recent[1] > recent[0];
            const isDeclining = recent[2] < recent[1] && recent[1] < recent[0];
            if (isImproving) trend = 'improving';
            else if (isDeclining) trend = 'declining';
        }

        // Subject performance
        const subjectPerf: Record<string, number[]> = {};
        evalData.forEach(e => {
            if (!subjectPerf[e.subject]) subjectPerf[e.subject] = [];
            subjectPerf[e.subject].push(e.percentage);
        });

        const subjectPerformance: Record<string, number> = {};
        Object.entries(subjectPerf).forEach(([subject, scores]) => {
            subjectPerformance[subject] = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
        });

        return {
            studentName,
            evaluations: evalData,
            averageScore: Math.round(avgScore * 10) / 10,
            trend,
            subjectPerformance,
        };
    },

    getTopPerformers(evaluations: Evaluation[], limit: number = 5): { name: string; avgScore: number }[] {
        const byStudent: Record<string, number[]> = {};

        evaluations.forEach(e => {
            const percentage = (e.obtainedMarks / e.totalMarks) * 100;
            if (!byStudent[e.studentName]) byStudent[e.studentName] = [];
            byStudent[e.studentName].push(percentage);
        });

        return Object.entries(byStudent)
            .map(([name, scores]) => ({
                name,
                avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
            }))
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, limit);
    },

    getSubjectInsights(evaluations: Evaluation[], assessments: Assessment[]): { subject: string; avgScore: number; count: number }[] {
        const bySubject: Record<string, number[]> = {};

        evaluations.forEach(e => {
            const assessment = assessments.find(a => a.id === e.assessmentId);
            const subject = assessment?.subject || 'Unknown';
            const percentage = (e.obtainedMarks / e.totalMarks) * 100;

            if (!bySubject[subject]) bySubject[subject] = [];
            bySubject[subject].push(percentage);
        });

        return Object.entries(bySubject)
            .map(([subject, scores]) => ({
                subject,
                avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
                count: scores.length,
            }))
            .sort((a, b) => b.avgScore - a.avgScore);
    },
};
