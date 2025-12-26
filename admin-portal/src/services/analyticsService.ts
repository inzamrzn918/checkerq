import api from '../lib/api';

export interface DashboardStats {
    total_users: number;
    active_users: number;
    new_users_today: number;
    total_licenses: number;
    active_licenses: number;
    total_assessments: number;
    total_evaluations: number;
    evaluations_today: number;
}

export interface UserGrowthData {
    month: string;
    users: number;
}

export interface EvaluationsTrendData {
    day: string;
    count: number;
}

export interface LicenseDistribution {
    name: string;
    value: number;
    color: string;
}

export interface RecentActivity {
    user: string;
    action: string;
    time: string;
}

export const analyticsService = {
    async getStats(): Promise<DashboardStats> {
        const response = await api.get('/api/analytics/stats');
        return response.data;
    },

    async getUserGrowth(months: number = 6): Promise<UserGrowthData[]> {
        const response = await api.get(`/api/analytics/user-growth?months=${months}`);
        return response.data;
    },

    async getEvaluationsTrend(days: number = 7): Promise<EvaluationsTrendData[]> {
        const response = await api.get(`/api/analytics/evaluations-trend?days=${days}`);
        return response.data;
    },

    async getLicenseDistribution(): Promise<LicenseDistribution[]> {
        const response = await api.get('/api/analytics/license-distribution');
        return response.data;
    },

    async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
        const response = await api.get(`/api/analytics/recent-activity?limit=${limit}`);
        return response.data;
    },
};
