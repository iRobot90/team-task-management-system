import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ModernLayout from './login/components/ModernLayout';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './login/pages/LoginPage';
import SignupPage from './login/pages/SignupPage';
import ModernDashboard from './login/pages/ModernDashboard';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import Profile from './pages/Profile';
import TeamPerformance from './pages/TeamPerformance';
import MyPerformance from './pages/MyPerformance';
import { USER_ROLES } from './utils/constants';
import './App.css';

// Component to handle redirects for authenticated users
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <ModernLayout>
                  <ModernDashboard />
                </ModernLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <ModernLayout>
                  <Tasks />
                </ModernLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute requiredRole={USER_ROLES.ADMIN}>
                <ModernLayout>
                  <Users />
                </ModernLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ModernLayout>
                  <Profile />
                </ModernLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/team-performance"
            element={
              <PrivateRoute requiredRole={[USER_ROLES.ADMIN, USER_ROLES.MANAGER]}>
                <ModernLayout>
                  <TeamPerformance />
                </ModernLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/my-performance"
            element={
              <PrivateRoute requiredRole={USER_ROLES.MEMBER}>
                <ModernLayout>
                  <MyPerformance />
                </ModernLayout>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
