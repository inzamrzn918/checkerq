import { useState, useEffect } from 'react';
import { Search, Trash2, AlertCircle } from 'lucide-react';
import { evaluationsService, Evaluation, EvaluationStats } from '../services/evaluationsService';

export default function EvaluationsPage() {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [stats, setStats] = useState<EvaluationStats | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);

    useEffect(() => {
        loadData();
    }, [page, searchTerm]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [evaluationsData, statsData] = await Promise.all([
                evaluationsService.listEvaluations(page, pageSize, searchTerm || undefined),
                evaluationsService.getStats()
            ]);
            setEvaluations(evaluationsData.evaluations);
            setTotal(evaluationsData.total);
            setStats(statsData);
        } catch (err: any) {
            console.error('Error loading evaluations:', err);
            setError(err.response?.data?.detail || 'Failed to load evaluations');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this evaluation?')) return;
        try {
            await evaluationsService.deleteEvaluation(id);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to delete evaluation');
        }
    };

    const getPercentageColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-400';
        if (percentage >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    if (error) {
        return (
            <div className="p-8">
                <div className="rounded-xl bg-red-900/20 border border-red-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="h-6 w-6 text-red-400" />
                        <h3 className="text-lg font-semibold text-red-400">Error Loading Evaluations</h3>
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
                <h1 className="text-3xl font-bold text-white">Evaluations</h1>
                <p className="mt-2 text-slate-400">View and manage student evaluations</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                        <p className="text-sm text-slate-400">Total Evaluations</p>
                        <p className="mt-2 text-3xl font-bold text-white">{stats.total}</p>
                        <p className="mt-1 text-xs text-slate-400">+{stats.total_today} today</p>
                    </div>
                    <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                        <p className="text-sm text-slate-400">Average Marks</p>
                        <p className="mt-2 text-3xl font-bold text-primary-400">{stats.average_marks}</p>
                    </div>
                    <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                        <p className="text-sm text-slate-400">Average %</p>
                        <p className="mt-2 text-3xl font-bold text-green-400">{stats.average_percentage}%</p>
                    </div>
                    <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                        <p className="text-sm text-slate-400">This Week</p>
                        <p className="mt-2 text-3xl font-bold text-slate-300">{stats.recent_count}</p>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search evaluations..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {/* Evaluations Table */}
            <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Assessment
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Teacher
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Marks
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Percentage
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    AI Model
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                                            <span className="ml-3 text-slate-400">Loading evaluations...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : evaluations.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                                        No evaluations found
                                    </td>
                                </tr>
                            ) : (
                                evaluations.map((evaluation) => (
                                    <tr key={evaluation.id} className="hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-white">
                                                {evaluation.student_name || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300">{evaluation.assessment_title}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {evaluation.user_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {evaluation.obtained_marks}/{evaluation.total_marks}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-semibold ${getPercentageColor(evaluation.percentage)}`}>
                                                {evaluation.percentage}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {evaluation.ai_model || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {new Date(evaluation.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(evaluation.id)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
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
                    Showing <span className="font-medium text-white">{evaluations.length}</span> of{' '}
                    <span className="font-medium text-white">{total}</span> evaluations
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
                        disabled={evaluations.length < pageSize}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
