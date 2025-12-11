import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../api/auth';
import { storage } from '../utils/storage';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = () => {
      const storedUser = storage.getUser();
      const token = storage.getToken();
      
      if (storedUser && token) {
        setUser(storedUser);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { user: userData, tokens } = response;
      
      // Store tokens and user data
      storage.setToken(tokens.access);
      storage.setRefreshToken(tokens.refresh);
      storage.setUser(userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { user: newUser, tokens } = response;
      
      // Store tokens and user data
      storage.setToken(tokens.access);
      storage.setRefreshToken(tokens.refresh);
      storage.setUser(newUser);
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true, user: newUser };
    } catch (error) {
      const data = error.response?.data;
      let message = 'Registration failed';
      if (typeof data === 'string') {
        message = data;
      } else if (data && typeof data === 'object') {
        const firstError = Object.values(data).flat().find(Boolean);
        if (firstError) message = firstError;
      }
      return {
        success: false,
        error: message,
      };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = storage.getRefreshToken();
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage regardless of API call result
      storage.clearAll();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (userData) => {
    storage.setUser(userData);
    setUser(userData);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

