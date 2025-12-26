import api from '../lib/api';

export interface Assessment {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    title: string;
    teacher_name?: string;
    subject?: string;
    class_room?: string;
    status: string;
    created_at: string;
    updated_at: string;
    evaluation_count: number;
}

export interface AssessmentDetail extends Assessment {
    paper_images?: any;
    questions?: any;
    evaluations: Array<{
        id: string;
        student_name?: string;
        total_marks: number;
        obtained_marks: number;
        created_at: string;
    }>;
}

export interface AssessmentStats {
    total: number;
    active: number;
    draft: number;
    archived: number;
    by_subject: Record<string, number>;
    recent_count: number;
}

class AssessmentsService {
    async listAssessments(page: number = 1, pageSize: number = 20, search?: string, status?: string, userId?: string) {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString(),
        });

        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (userId) params.append('user_id', userId);

        const response = await api.get(`/api/assessments?${params.toString()}`);
        return response.data;
    }

    async getAssessment(id: string): Promise<AssessmentDetail> {
        const response = await api.get(`/api/assessments/${id}`);
        return response.data;
    }

    async getStats(): Promise<AssessmentStats> {
        const response = await api.get('/api/assessments/stats');
        return response.data;
    }

    async updateStatus(id: string, status: string) {
        const response = await api.put(`/api/assessments/${id}/status`, { status });
        return response.data;
    }

    async deleteAssessment(id: string) {
        const response = await api.delete(`/api/assessments/${id}`);
        return response.data;
    }
}

export const assessmentsService = new AssessmentsService();
export default assessmentsService;
