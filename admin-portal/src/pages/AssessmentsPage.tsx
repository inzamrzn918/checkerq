import { useState, useEffect } from 'react';
import { Search, Archive, Trash2, AlertCircle } from 'lucide-react';
import { assessmentsService, Assessment, AssessmentStats } from '../services/assessmentsService';

export default function AssessmentsPage() {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [stats, setStats] = useState<AssessmentStats | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);

    useEffect(() => {
        loadData();
    }, [page, searchTerm, statusFilter]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [assessmentsData, statsData] = await Promise.all([
                assessmentsService.listAssessments(page, pageSize, searchTerm || undefined, statusFilter || undefined),
                assessmentsService.getStats()
            ]);
            setAssessments(assessmentsData.assessments);
            setTotal(assessmentsData.total);
            setStats(statsData);
        } catch (err: any) {
            console.error('Error loading assessments:', err);
            setError(err.response?.data?.detail || 'Failed to load assessments');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        if (!confirm(`Are you sure you want to ${status} this assessment?`)) return;
        try {
            await assessmentsService.updateStatus(id, status);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this assessment? This will also delete all related evaluations.')) return;
        try {
            await assessmentsService.deleteAssessment(id);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to delete assessment');
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            active: 'bg-green-600 text-white',
            draft: 'bg-yellow-600 text-white',
            archived: 'bg-slate-600 text-white',
        };
        return colors[status as keyof typeof colors] || colors.active;
    };

    if (error) {
        return (
            <div className="p-8">
                <div className="rounded-xl bg-red-900/20 border border-red-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="h-6 w-6 text-red-400" />
                        <h3 className="text-lg font-semibold text-red-400">Error Loading Assessments</h3>
                    </div>
                    <p className="text-red-300 mb-4">{error}</p>
                    <button
                        onClick={loadData}
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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Assessments</h1>
                <p className="mt-2 text-slate-400">Manage question papers and assessments</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                        <p className="text-sm text-slate-400">Total</p>
                        <p className="mt-2 text-3xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                        <p className="text-sm text-slate-400">Active</p>
                        <p className="mt-2 text-3xl font-bold text-green-400">{stats.active}</p>
                    </div>
                    <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                        <p className="text-sm text-slate-400">Draft</p>
                        <p className="mt-2 text-3xl font-bold text-yellow-400">{stats.draft}</p>
                    </div>
                    <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                        <p className="text-sm text-slate-400">Archived</p>
                        <p className="mt-2 text-3xl font-bold text-slate-400">{stats.archived}</p>
                    </div>
                </div>
            )}

            {/* Search and Filter */}
            <div className="mb-6 flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search assessments..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            {/* Assessments Table */}
            <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Assessment
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Teacher
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Evaluations
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                                            <span className="ml-3 text-slate-400">Loading assessments...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : assessments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                                        No assessments found
                                    </td>
                                </tr>
                            ) : (
                                assessments.map((assessment) => (
                                    <tr key={assessment.id} className="hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-white">{assessment.title}</div>
                                                <div className="text-sm text-slate-400">{assessment.user_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {assessment.teacher_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {assessment.subject || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(assessment.status)}`}>
                                                {assessment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {assessment.evaluation_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {new Date(assessment.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {assessment.status !== 'archived' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(assessment.id, 'archived')}
                                                        className="text-slate-400 hover:text-white transition-colors"
                                                        title="Archive"
                                                    >
                                                        <Archive className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(assessment.id)}
                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                    Showing <span className="font-medium text-white">{assessments.length}</span> of{' '}
                    <span className="font-medium text-white">{total}</span> assessments
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={assessments.length < pageSize}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
