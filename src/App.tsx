import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { AdminDashboard } from './pages/AdminDashboard';
import { Vendors } from './pages/Vendors';
import { AdminTemplates } from './pages/AdminTemplates';
import { AdminReports } from './pages/AdminReports';
import { NewEvaluation } from './pages/NewEvaluation';
import { EvaluatorDashboard } from './pages/EvaluatorDashboard';
import { EvaluatorHistory } from './pages/EvaluatorHistory';
import { ReportsEvaluator } from './pages/ReportsEvaluator';
import { User, UserRole } from './types';
import { db } from './services/storage';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  user: User | null;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, user }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <div className="p-8 text-center">Access Denied. Insufficient permissions.</div>;
  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (u: User) => {
    db.auth.setCurrentUser(u);
    setUser(u);
  };

  const handleLogout = () => {
    db.auth.logout();
    setUser(null);
  };

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.role === UserRole.Admin ? "/admin/dashboard" : "/evaluator/dashboard"} />} />
            
            <Route path="/" element={<Navigate to="/login" />} />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <Layout user={user} onLogout={handleLogout}>
                 <Routes>
                   <Route path="dashboard" element={<ProtectedRoute user={user} allowedRoles={[UserRole.Admin]}><AdminDashboard /></ProtectedRoute>} />
                   <Route path="vendors" element={<ProtectedRoute user={user} allowedRoles={[UserRole.Admin]}><Vendors /></ProtectedRoute>} />
                   <Route path="templates" element={<ProtectedRoute user={user} allowedRoles={[UserRole.Admin]}><AdminTemplates /></ProtectedRoute>} />
                   <Route path="reports" element={<ProtectedRoute user={user} allowedRoles={[UserRole.Admin]}><AdminReports /></ProtectedRoute>} />
                 </Routes>
              </Layout>
            } />

            {/* Evaluator Routes */}
            <Route path="/evaluator/*" element={
              <Layout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="dashboard" element={<ProtectedRoute user={user} allowedRoles={[UserRole.Evaluator]}><EvaluatorDashboard user={user!} /></ProtectedRoute>} />
                  <Route path="new" element={<ProtectedRoute user={user} allowedRoles={[UserRole.Evaluator]}><NewEvaluation user={user!} /></ProtectedRoute>} />
                  <Route path="history" element={<ProtectedRoute user={user} allowedRoles={[UserRole.Evaluator]}><EvaluatorHistory user={user!} /></ProtectedRoute>} />
                  <Route path="reports" element={<ProtectedRoute user={user} allowedRoles={[UserRole.Evaluator]}><ReportsEvaluator user={user!} /></ProtectedRoute>} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;