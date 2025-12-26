import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import LicensesPage from './pages/LicensesPage';
import AssessmentsPage from './pages/AssessmentsPage';
import EvaluationsPage from './pages/EvaluationsPage';
import SettingsPage from './pages/SettingsPage';
import authService from './services/authService';
import './index.css';

function App() {
    const isAuthenticated = authService.isAuthenticated();

    return (
        <BrowserRouter>
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />

                {/* Protected Routes */}
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <div className="flex h-screen bg-slate-950">
                                <Sidebar />
                                <main className="flex-1 overflow-y-auto">
                                    <Routes>
                                        <Route path="/" element={<Dashboard />} />
                                        <Route path="/users" element={<UsersPage />} />
                                        <Route path="/licenses" element={<LicensesPage />} />
                                        <Route path="/assessments" element={<AssessmentsPage />} />
                                        <Route path="/evaluations" element={<EvaluationsPage />} />
                                        <Route path="/analytics" element={<Dashboard />} />
                                        <Route path="/settings" element={<SettingsPage />} />
                                    </Routes>
                                </main>
                            </div>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
