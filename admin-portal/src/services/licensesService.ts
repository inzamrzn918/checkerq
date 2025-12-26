import api from '../lib/api';

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
    created_at: string;
}

export interface LicenseCreateRequest {
    type: 'free' | 'pro' | 'enterprise';
    expires_at?: string;
    max_assessments?: number;
    max_evaluations_per_month?: number;
}

export const licensesService = {
    async listLicenses(
        page: number = 1,
        pageSize: number = 20,
        status?: string
    ): Promise<License[]> {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString(),
        });

        if (status) {
            params.append('status', status);
        }

        const response = await api.get(`/api/licenses?${params.toString()}`);
        return response.data;
    },

    async generateLicenses(
        licenseData: LicenseCreateRequest,
        quantity: number = 1
    ): Promise<License[]> {
        const response = await api.post(
            `/api/licenses/generate?quantity=${quantity}`,
            licenseData
        );
        return response.data;
    },

    async revokeLicense(licenseId: string): Promise<void> {
        await api.put(`/api/licenses/${licenseId}/revoke`);
    },
};
