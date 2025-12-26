import api from '../lib/api';

export interface Evaluation {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    assessment_id: string;
    assessment_title: string;
    student_name?: string;
    total_marks: number;
    obtained_marks: number;
    percentage: number;
    ai_model?: string;
    processing_time?: number;
    created_at: string;
}

export interface EvaluationDetail extends Evaluation {
    student_image?: string;
    results?: any;
    overall_feedback?: string;
}

export interface EvaluationStats {
    total: number;
    total_today: number;
    average_marks: number;
    average_percentage: number;
    by_assessment: Record<string, number>;
    recent_count: number;
}

class EvaluationsService {
    async listEvaluations(page: number = 1, pageSize: number = 20, search?: string, assessmentId?: string, userId?: string) {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString(),
        });

        if (search) params.append('search', search);
        if (assessmentId) params.append('assessment_id', assessmentId);
        if (userId) params.append('user_id', userId);

        const response = await api.get(`/api/evaluations?${params.toString()}`);
        return response.data;
    }

    async getEvaluation(id: string): Promise<EvaluationDetail> {
        const response = await api.get(`/api/evaluations/${id}`);
        return response.data;
    }

    async getStats(): Promise<EvaluationStats> {
        const response = await api.get('/api/evaluations/stats');
        return response.data;
    }

    async deleteEvaluation(id: string) {
        const response = await api.delete(`/api/evaluations/${id}`);
        return response.data;
    }
}

export const evaluationsService = new EvaluationsService();
export default evaluationsService;
