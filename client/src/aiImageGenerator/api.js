import axios from "axios";
import { getApiBaseUrl } from "../utils/config.js";

const API_BASE_URL = getApiBaseUrl();

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const imageApi = {
  // Generate image with AI
  generateImage: async (imageData) => {
    try {
      const response = await api.post("/images/generate", imageData);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get image generation history
  getImageHistory: async (params = {}) => {
    try {
      const { page = 1, limit = 10 } = params;
      const response = await api.get(
        `/images/history?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default imageApi;
