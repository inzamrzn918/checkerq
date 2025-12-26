import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: LucideIcon;
    trend?: 'up' | 'down';
}

export default function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
    return (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 hover:border-primary-500 transition-colors">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-white">{value}</p>
                    {change && (
                        <p className={`mt-2 text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                            {change}
                        </p>
                    )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600/20">
                    <Icon className="h-6 w-6 text-primary-400" />
                </div>
            </div>
        </div>
    );
}
