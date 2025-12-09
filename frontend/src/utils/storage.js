// LocalStorage utilities for token management
// Using localStorage for token storage (can be switched to httpOnly cookies for better security)

const TOKEN_KEY = 'ttms_access_token';
const REFRESH_TOKEN_KEY = 'ttms_refresh_token';
const USER_KEY = 'ttms_user';

export const storage = {
  // Token management
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setRefreshToken: (token) => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  
  getRefreshToken: () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  removeTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  
  // User data management
  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  
  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  
  removeUser: () => {
    localStorage.removeItem(USER_KEY);
  },
  
  // Clear all data
  clearAll: () => {
    storage.removeTokens();
    storage.removeUser();
  },
};

// Note: For production, consider using httpOnly cookies for better security
// This would require backend changes to set cookies instead of returning tokens in response

