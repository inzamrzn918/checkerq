export interface User {
    id: string;
    email: string;
    name: string;
    photo_url?: string;
    role: 'user' | 'admin' | 'super_admin';
    status: 'active' | 'suspended' | 'deleted';
    created_at: string;
    last_login?: string;
}

export interface License {
    id: string;
    license_key: string;
    user_id?: string;
    type: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'expired' | 'revoked';
    activated_at?: string;
    expires_at?: string;
    max_assessments?: number;
    max_evaluations_per_month?: number;
    features?: Record<string, boolean>;
    created_at: string;
}

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

export interface AnalyticsEvent {
    id: string;
    user_id?: string;
    event_type: string;
    event_data?: Record<string, any>;
    timestamp: string;
}
