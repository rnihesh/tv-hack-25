import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://phoenix.onrender.com/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Subscription API functions
export const subscriptionAPI = {
  // Get all credit packages
  getCreditPackages: async () => {
    const response = await api.get('/subscription/packages');
    return response.data;
  },

  // Create Razorpay order
  createOrder: async (packageId) => {
    const response = await api.post('/subscription/create-order', { packageId });
    return response.data;
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    const response = await api.post('/subscription/verify-payment', paymentData);
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async (page = 1, limit = 10) => {
    const response = await api.get(`/subscription/payments?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get subscription analytics
  getAnalytics: async () => {
    const response = await api.get('/subscription/analytics');
    return response.data;
  }
};

export default api;
