import React, { useState, useEffect } from 'react';
import { Plus, Copy, Check, AlertCircle } from 'lucide-react';
import { licensesService, License } from '../services/licensesService';

export default function LicensesPage() {
    const [licenses, setLicenses] = useState<License[]>([]);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);

    // Form state
    const [licenseType, setLicenseType] = useState<'free' | 'pro' | 'enterprise'>('pro');
    const [quantity, setQuantity] = useState(1);
    const [expiresAt, setExpiresAt] = useState('');

    useEffect(() => {
        loadLicenses();
    }, []);

    const loadLicenses = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await licensesService.listLicenses();
            setLicenses(data);
        } catch (err: any) {
            console.error('Error loading licenses:', err);
            setError(err.response?.data?.detail || 'Failed to load licenses. Please ensure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateLicenses = async () => {
        try {
            setGenerating(true);
            const licenseData: any = {
                type: licenseType,
            };

            if (expiresAt) {
                licenseData.expires_at = new Date(expiresAt).toISOString();
            }

            const newLicenses = await licensesService.generateLicenses(licenseData, quantity);
            setLicenses([...newLicenses, ...licenses]);
            setShowGenerateModal(false);

            // Reset form
            setLicenseType('pro');
            setQuantity(1);
            setExpiresAt('');
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to generate licenses');
        } finally {
            setGenerating(false);
        }
    };

    const handleRevokeLicense = async (licenseId: string) => {
        if (!confirm('Are you sure you want to revoke this license?')) return;

        try {
            await licensesService.revokeLicense(licenseId);
            loadLicenses();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to revoke license');
        }
    };

    const copyToClipboard = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const getTypeBadge = (type: string) => {
        const colors = {
            free: 'bg-slate-600 text-white',
            pro: 'bg-primary-600 text-white',
            enterprise: 'bg-purple-600 text-white',
        };
        return colors[type as keyof typeof colors] || colors.free;
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            active: 'bg-green-600 text-white',
            expired: 'bg-yellow-600 text-white',
            revoked: 'bg-red-600 text-white',
        };
        return colors[status as keyof typeof colors] || colors.active;
    };

    if (error) {
        return (
            <div className="p-8">
                <div className="rounded-xl bg-red-900/20 border border-red-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="h-6 w-6 text-red-400" />
                        <h3 className="text-lg font-semibold text-red-400">Error Loading Licenses</h3>
                    </div>
                    <p className="text-red-300 mb-4">{error}</p>
                    <button
                        onClick={loadLicenses}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Licenses</h1>
                    <p className="mt-2 text-slate-400">Generate and manage license keys</p>
                </div>
                <button
                    onClick={() => setShowGenerateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-white font-medium transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Generate Licenses
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                    <p className="text-sm text-slate-400">Total Licenses</p>
                    <p className="mt-2 text-3xl font-bold text-white">{licenses.length}</p>
                </div>
                <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                    <p className="text-sm text-slate-400">Active</p>
                    <p className="mt-2 text-3xl font-bold text-green-400">
                        {licenses.filter((l) => l.status === 'active').length}
                    </p>
                </div>
                <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                    <p className="text-sm text-slate-400">Activated</p>
                    <p className="mt-2 text-3xl font-bold text-primary-400">
                        {licenses.filter((l) => l.user_id).length}
                    </p>
                </div>
            </div>

            {/* Licenses Table */}
            <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    License Key
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Activated
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Expires
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                                            <span className="ml-3 text-slate-400">Loading licenses...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : licenses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                        No licenses found. Generate some licenses to get started.
                                    </td>
                                </tr>
                            ) : (
                                licenses.map((license) => (
                                    <tr key={license.id} className="hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <code className="text-sm text-slate-300 font-mono">{license.license_key}</code>
                                                <button
                                                    onClick={() => copyToClipboard(license.license_key)}
                                                    className="text-slate-400 hover:text-white transition-colors"
                                                >
                                                    {copiedKey === license.license_key ? (
                                                        <Check className="h-4 w-4 text-green-400" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadge(license.type)}`}>
                                                {license.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(license.status)}`}>
                                                {license.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {license.activated_at ? new Date(license.activated_at).toLocaleDateString() : 'Not activated'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleRevokeLicense(license.id)}
                                                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                                            >
                                                Revoke
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Generate Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Generate Licenses</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">License Type</label>
                                <select
                                    value={licenseType}
                                    onChange={(e) => setLicenseType(e.target.value as any)}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="free">Free</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Expiration Date (Optional)</label>
                                <input
                                    type="date"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowGenerateModal(false)}
                                disabled={generating}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateLicenses}
                                disabled={generating}
                                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                            >
                                {generating ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
