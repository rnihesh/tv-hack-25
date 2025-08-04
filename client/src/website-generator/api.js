import { getApiBaseUrl } from "../utils/config.js";

const API_BASE_URL = getApiBaseUrl();

class WebsiteAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/websites`;
  }

  // Get authentication token from localStorage
  getAuthToken() {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.warn("No auth token found in localStorage");
      return null;
    }
    return token;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getAuthToken();
    return !!token;
  }

  // Set auth token (useful for login)
  setAuthToken(token) {
    if (token) {
      localStorage.setItem("authToken", token);
      console.log("Auth token set successfully");
    } else {
      console.warn("Attempted to set empty token");
    }
  }

  // Clear auth token (useful for logout)
  clearAuthToken() {
    localStorage.removeItem("authToken");
    console.log("Auth token cleared");
  }

  // Validate token by making a test request
  async validateToken() {
    try {
      const token = this.getAuthToken();
      if (!token) return false;

      // Make a simple request to check if token is valid
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Get token from localStorage for authentication
    const token = this.getAuthToken();

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          console.error(
            "Authentication failed - token may be invalid or expired"
          );
          // Optionally clear invalid token
          localStorage.removeItem("authToken");
          throw new Error("Authentication failed. Please log in again.");
        }

        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      console.error("Request URL:", url);
      console.error("Request config:", config);
      throw error;
    }
  }

  // Generate new website
  async generateWebsite(formData) {
    // Check authentication before making request
    if (!this.isAuthenticated()) {
      throw new Error(
        "Authentication required. Please log in to generate websites."
      );
    }

    // Transform frontend form data to backend expected format
    const payload = {
      prompt:
        formData.prompt ||
        formData.requirements ||
        "Create a modern, responsive website",
      templateType: formData.templateType || "business",
      style: formData.style || "modern",
      colorScheme: formData.colorScheme || "blue",
      sections: formData.sections || [],
    };

    console.log(
      "Generating website with token:",
      this.getAuthToken() ? "Present" : "Missing"
    );
    console.log("Generation payload:", payload);

    return this.request("/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Get user's websites with pagination
  async getMyWebsites(params = {}) {
    // Check authentication before making request
    if (!this.isAuthenticated()) {
      throw new Error(
        "Authentication required. Please log in to view your websites."
      );
    }

    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      sortBy: params.sortBy || "createdAt",
      sortOrder: params.sortOrder || "desc",
    });

    console.log(
      "Fetching websites with token:",
      this.getAuthToken() ? "Present" : "Missing"
    );
    console.log("Request URL:", `${this.baseURL}/my-websites?${queryParams}`);

    return this.request(`/my-websites?${queryParams}`);
  }

  // Get specific website by ID
  async getWebsite(websiteId) {
    if (!this.isAuthenticated()) {
      throw new Error(
        "Authentication required. Please log in to view website details."
      );
    }

    return this.request(`/${websiteId}`);
  }

  // Update website
  async updateWebsite(websiteId, updateData) {
    if (!this.isAuthenticated()) {
      throw new Error(
        "Authentication required. Please log in to update websites."
      );
    }

    return this.request(`/${websiteId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  // Delete website
  async deleteWebsite(websiteId) {
    if (!this.isAuthenticated()) {
      throw new Error(
        "Authentication required. Please log in to delete websites."
      );
    }

    return this.request(`/${websiteId}`, {
      method: "DELETE",
    });
  }

  // Deploy website to Netlify
  async deployWebsite(websiteId, deployData = {}) {
    if (!this.isAuthenticated()) {
      throw new Error(
        "Authentication required. Please log in to deploy websites."
      );
    }

    return this.request(`/${websiteId}/deploy`, {
      method: "POST",
      body: JSON.stringify(deployData),
    });
  }
}

// Create instance
export const websiteAPI = new WebsiteAPI();

// Mock API responses for development/testing
export const mockAPI = {
  async generateWebsite(formData) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      success: true,
      message: "Website generated successfully",
      data: {
        websiteId: `mock-website-${Date.now()}`,
        contentId: `mock-content-${Date.now()}`,
        website: {
          header: {
            logo: "Company Logo",
            navigation: ["Home", "About", "Services", "Contact"],
            contactInfo: {
              phone: "+1 (555) 123-4567",
              email: "info@company.com",
            },
          },
          hero: {
            headline: `Welcome to ${formData.prompt} Solutions`,
            subheadline:
              "Professional services tailored to your business needs",
            callToAction: "Get Started Today",
          },
          about: {
            title: "About Us",
            content:
              "We are a leading company in our industry, providing exceptional services to our clients.",
            mission:
              "To deliver outstanding results and exceed customer expectations.",
          },
          services: [
            {
              title: "Service 1",
              description: "Professional service description",
              features: ["Feature 1", "Feature 2", "Feature 3"],
            },
            {
              title: "Service 2",
              description: "Another professional service",
              features: ["Feature A", "Feature B", "Feature C"],
            },
          ],
          contact: {
            address: "123 Business Street, City, State 12345",
            phone: "+1 (555) 123-4567",
            email: "contact@company.com",
            hours: "Mon-Fri 9AM-5PM",
          },
        },
        metadata: {
          templateType: formData.templateType,
          style: formData.style,
          colorScheme: formData.colorScheme,
          tokensUsed: 1250,
          processingTime: "2.3s",
        },
        creditsUsed: 5,
        remainingCredits: 95,
      },
    };
  },

  async getMyWebsites(params = {}) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockWebsites = [
      {
        _id: "mock-1",
        templateName: "Business Landing Page",
        industry: "Technology",
        createdAt: new Date().toISOString(),
        customizations: {
          style: "modern",
          colorScheme: "blue",
        },
        aiGenerated: true,
      },
      {
        _id: "mock-2",
        templateName: "Portfolio Website",
        industry: "Design",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        customizations: {
          style: "minimal",
          colorScheme: "green",
        },
        aiGenerated: true,
      },
    ];

    return {
      success: true,
      data: {
        websites: mockWebsites,
        pagination: {
          page: parseInt(params.page) || 1,
          limit: parseInt(params.limit) || 10,
          total: mockWebsites.length,
          pages: Math.ceil(
            mockWebsites.length / (parseInt(params.limit) || 10)
          ),
        },
      },
    };
  },

  async getWebsite(websiteId) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      data: {
        website: {
          _id: websiteId,
          templateName: "Sample Website",
          structure: {
            header: { logo: "Logo", navigation: ["Home", "About", "Contact"] },
            hero: {
              headline: "Sample Headline",
              subheadline: "Sample subheadline",
            },
          },
          customizations: {
            style: "modern",
            colorScheme: "blue",
          },
        },
      },
    };
  },

  async updateWebsite(websiteId, updateData) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      message: "Website updated successfully",
      data: {
        website: {
          _id: websiteId,
          ...updateData,
        },
      },
    };
  },

  async deleteWebsite(websiteId) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      message: "Website deleted successfully",
    };
  },
};

// Use real API by default, mock API only when explicitly needed
const USE_MOCK_API = false; // Set to true if you want to use mock data
export const api = USE_MOCK_API ? mockAPI : websiteAPI;
