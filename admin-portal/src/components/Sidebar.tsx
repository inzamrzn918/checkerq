import { useEffect, useState } from 'react';
import { Users, Key, BarChart3, Settings, Home, LogOut, FileText, CheckCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Licenses', href: '/licenses', icon: Key },
    { name: 'Assessments', href: '/assessments', icon: FileText },
    { name: 'Evaluations', href: '/evaluations', icon: CheckCircle },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        const storedUser = authService.getStoredUser();
        if (storedUser) {
            setUser(storedUser);
        }
    }, []);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex h-screen w-64 flex-col bg-slate-900 border-r border-slate-700">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white">CheckerQ</h1>
                    <p className="text-xs text-slate-400">Admin Portal</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`
                flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${isActive
                                    ? 'bg-primary-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }
              `}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* User info */}
            <div className="border-t border-slate-700 p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-semibold">
                        {user ? getInitials(user.name) : 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.name || 'Admin User'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                            {user?.email || 'admin@checkerq.com'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm font-medium transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </div>
    );
}
