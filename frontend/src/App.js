import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import PasswordReset from './pages/PasswordReset';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import Profile from './pages/Profile';
import TeamPerformance from './pages/TeamPerformance';
import MyPerformance from './pages/MyPerformance';
import { USER_ROLES } from './utils/constants';
import './App.css';

// Component to handle redirects for authenticated users
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    if (user?.role === USER_ROLES.ADMIN) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Component to handle root redirects
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (isAuthenticated && user?.role === USER_ROLES.ADMIN) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
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
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/password-reset"
            element={
              <PublicRoute>
                <PasswordReset />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute requiredRole={[USER_ROLES.MANAGER, USER_ROLES.MEMBER]}>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute requiredRole={[USER_ROLES.MANAGER, USER_ROLES.MEMBER]}>
                <Layout>
                  <Tasks />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute requiredRole={USER_ROLES.ADMIN}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute requiredRole={USER_ROLES.ADMIN}>
                <Layout>
                  <Users />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Layout>
                  <Profile />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/team-performance"
            element={
              <PrivateRoute requiredRole={[USER_ROLES.ADMIN, USER_ROLES.MANAGER]}>
                <Layout>
                  <TeamPerformance />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/my-performance"
            element={
              <PrivateRoute requiredRole={USER_ROLES.MEMBER}>
                <Layout>
                  <MyPerformance />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
