import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';

const PrivateRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole) {
    const hasRole = Array.isArray(requiredRole)
      ? requiredRole.includes(user?.role)
      : user?.role === requiredRole;

    if (!hasRole) {
      // Smart redirect based on user's actual role
      if (user?.role === USER_ROLES.ADMIN) {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default PrivateRoute;

