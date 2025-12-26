import React, { useEffect, useState } from 'react';
import { Users, Key, FileText, CheckCircle, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import StatCard from '../components/StatCard';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsService, DashboardStats, UserGrowthData, EvaluationsTrendData, LicenseDistribution, RecentActivity } from '../services/analyticsService';

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
    const [evaluationsData, setEvaluationsData] = useState<EvaluationsTrendData[]>([]);
    const [licenseDistribution, setLicenseDistribution] = useState<LicenseDistribution[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all data in parallel
            const [statsData, userGrowth, evalsTrend, licenseDist, activity] = await Promise.all([
                analyticsService.getStats(),
                analyticsService.getUserGrowth(6),
                analyticsService.getEvaluationsTrend(7),
                analyticsService.getLicenseDistribution(),
                analyticsService.getRecentActivity(5),
            ]);

            setStats(statsData);
            setUserGrowthData(userGrowth);
            setEvaluationsData(evalsTrend);
            setLicenseDistribution(licenseDist);
            setRecentActivity(activity);
        } catch (err: any) {
            console.error('Error loading dashboard data:', err);
            setError(err.response?.data?.detail || 'Failed to load dashboard data. Please ensure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="rounded-xl bg-red-900/20 border border-red-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="h-6 w-6 text-red-400" />
                        <h3 className="text-lg font-semibold text-red-400">Error Loading Dashboard</h3>
                    </div>
                    <p className="text-red-300 mb-4">{error}</p>
                    <button
                        onClick={loadDashboardData}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="mt-2 text-slate-400">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard
                    title="Total Users"
                    value={stats.total_users.toLocaleString()}
                    change={`+${stats.new_users_today} today`}
                    icon={Users}
                    trend={stats.new_users_today > 0 ? "up" : undefined}
                />
                <StatCard
                    title="Active Licenses"
                    value={stats.active_licenses}
                    change={`${stats.total_licenses} total`}
                    icon={Key}
                    trend="up"
                />
                <StatCard
                    title="Assessments"
                    value={stats.total_assessments.toLocaleString()}
                    icon={FileText}
                />
                <StatCard
                    title="Evaluations"
                    value={stats.total_evaluations.toLocaleString()}
                    change={`+${stats.evaluations_today} today`}
                    icon={CheckCircle}
                    trend={stats.evaluations_today > 0 ? "up" : undefined}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Growth Chart */}
                <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary-400" />
                        User Growth
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#f8fafc',
                                }}
                            />
                            <Line type="monotone" dataKey="users" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Evaluations Chart */}
                <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary-400" />
                        Evaluations This Week
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={evaluationsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="day" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#f8fafc',
                                }}
                            />
                            <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* License Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">License Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={licenseDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {licenseDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#f8fafc',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Activity */}
                <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                                    <div>
                                        <p className="text-sm text-white">
                                            <span className="font-semibold">{activity.user}</span> {activity.action}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
