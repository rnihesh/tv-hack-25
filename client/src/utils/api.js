import axios from 'axios';

// Base URL for your backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

// Auth API functions (for future use)
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('authToken');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
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
