import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper function to save user to localStorage
  const saveUserToStorage = (userData) => {
    try {
      localStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user data to localStorage:', error);
    }
  };

  // Helper function to load user from localStorage
  const loadUserFromStorage = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to load user data from localStorage:', error);
      return null;
    }
  };

  // Helper function to clear user from localStorage
  const clearUserFromStorage = () => {
    try {
      localStorage.removeItem('userData');
    } catch (error) {
      console.error('Failed to clear user data from localStorage:', error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = authAPI.getToken();
      const storedUser = loadUserFromStorage();
      
      if (token && storedUser) {
        // Try to verify the token is still valid with stored user data
        try {
          const response = await authAPI.getProfile();
          if (response.success) {
            setUser(response.data);
            saveUserToStorage(response.data); // Update stored data with fresh data
            setIsAuthenticated(true);
          } else {
            // Invalid token, clear everything
            localStorage.removeItem('authToken');
            clearUserFromStorage();
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          // If API call fails but we have token and stored user, use stored data
          console.warn('Profile fetch failed, using stored user data:', error);
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      } else if (token) {
        // Have token but no stored user - fetch from server
        try {
          const response = await authAPI.getProfile();
          if (response.success) {
            setUser(response.data);
            saveUserToStorage(response.data);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('authToken');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
        }
      } else {
        // No token - clear everything
        clearUserFromStorage();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
      clearUserFromStorage();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      if (response.success) {
        setUser(response.data.company);
        saveUserToStorage(response.data.company);
        setIsAuthenticated(true);
        return { success: true, data: response.data };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        setUser(response.data.company);
        saveUserToStorage(response.data.company);
        setIsAuthenticated(true);
        return { success: true, data: response.data };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setIsAuthenticated(false);
      clearUserFromStorage();
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if server logout fails
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      clearUserFromStorage();
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      if (response.success) {
        setUser(response.data);
        saveUserToStorage(response.data);
        return { success: true, data: response.data };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Profile update failed' 
      };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};