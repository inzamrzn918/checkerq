import * as SecureStore from 'expo-secure-store';
import apiClient from './apiClient';

interface License {
    id: string;
    license_key: string;
    type: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'expired' | 'revoked';
    max_assessments?: number;
    max_evaluations_per_month?: number;
    features?: Record<string, boolean>;
    expires_at?: string;
}

class LicenseService {
    private cachedLicense: License | null = null;

    async activateLicense(licenseKey: string): Promise<boolean> {
        try {
            const response = await apiClient.post('/api/licenses/activate', {
                license_key: licenseKey,
            });

            this.cachedLicense = response.data;
            await SecureStore.setItemAsync('license', JSON.stringify(response.data));
            return true;
        } catch (error) {
            console.error('License activation failed:', error);
            return false;
        }
    }

    async validateLicense(): Promise<License | null> {
        try {
            const response = await apiClient.get('/api/licenses/validate');

            if (response.data.valid) {
                this.cachedLicense = response.data.license;
                await SecureStore.setItemAsync('license', JSON.stringify(response.data.license));
                return response.data.license;
            }

            return null;
        } catch (error) {
            console.error('License validation failed:', error);
            return null;
        }
    }

    async getCurrentLicense(): Promise<License | null> {
        if (this.cachedLicense) {
            return this.cachedLicense;
        }

        try {
            const cached = await SecureStore.getItemAsync('license');
            if (cached) {
                this.cachedLicense = JSON.parse(cached);
                return this.cachedLicense;
            }
        } catch (error) {
            console.error('Failed to get cached license:', error);
        }

        return await this.validateLicense();
    }

    async hasFeature(feature: string): Promise<boolean> {
        const license = await this.getCurrentLicense();
        if (!license) return false;

        return license.features?.[feature] === true;
    }

    async canCreateAssessment(): Promise<boolean> {
        const license = await this.getCurrentLicense();
        if (!license) return false;

        // Check if unlimited or within limits
        if (license.max_assessments === null || license.max_assessments === undefined) {
            return true; // Unlimited
        }

        // TODO: Check current assessment count against limit
        return true;
    }

    getLicenseFeatures(type: 'free' | 'pro' | 'enterprise') {
        const features = {
            free: {
                max_assessments: 5,
                max_evaluations_per_month: 50,
                export_pdf: false,
                export_excel: false,
                analytics: false,
            },
            pro: {
                max_assessments: 100,
                max_evaluations_per_month: 1000,
                export_pdf: true,
                export_excel: true,
                analytics: true,
                bulk_operations: true,
            },
            enterprise: {
                max_assessments: null, // Unlimited
                max_evaluations_per_month: null, // Unlimited
                export_pdf: true,
                export_excel: true,
                analytics: true,
                bulk_operations: true,
                api_access: true,
                priority_support: true,
            },
        };

        return features[type];
    }
}

export const licenseService = new LicenseService();
export default licenseService;
