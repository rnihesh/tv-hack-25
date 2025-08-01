import axios from 'axios';

// Base URL for your backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication (if needed)
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login or refresh token
      localStorage.removeItem('authToken');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Email API functions
export const emailAPI = {
  // Enhance email message using AI
  enhanceMessage: async (data) => {
    const response = await api.post('/email/enhance', data);
    return response.data;
  },

  // Send email immediately
  sendEmail: async (data) => {
    const response = await api.post('/email/send', data);
    return response.data;
  },

  // Schedule email for later
  scheduleEmail: async (data) => {
    const response = await api.post('/email/schedule', data);
    return response.data;
  },

  // Get email templates
  getTemplates: async () => {
    const response = await api.get('/email/templates');
    return response.data;
  },

  // Get email analytics
  getAnalytics: async (campaignId) => {
    const response = await api.get(`/email/analytics/${campaignId}`);
    return response.data;
  },
};

// Customer API functions
export const customerAPI = {
  // Get all customers
  getCustomers: async () => {
    const response = await api.get('/customers');
    return response.data;
  },

  // Get customer segments
  getSegments: async () => {
    const response = await api.get('/customers/segments');
    return response.data;
  },

  // Get customer by ID
  getCustomer: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },
};

// Auth API functions
export const authAPI = {
  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('authToken', response.data.data.token);
    }
    return response.data;
  },

  // Register new company
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.success && response.data.data?.token) {
        localStorage.setItem('authToken', response.data.data.token);
      }
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
      
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.warn('Logout request failed, but clearing local auth data');
    }
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Get user credits
  getCredits: async () => {
    const response = await api.get('/auth/credits');
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('authToken');
  },
};

// Company API functions (for future use)
export const companyAPI = {
  getProfile: async () => {
    const response = await api.get('/company/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/company/profile', data);
    return response.data;
  },

  getCredits: async () => {
    const response = await api.get('/company/credits');
    return response.data;
  },

  getUsage: async () => {
    const response = await api.get('/company/usage');
    return response.data;
  },
};

export default api;