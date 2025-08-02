const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://phoenix.onrender.com/api';

// Dummy token for testing (will be replaced with real auth)
const DUMMY_TOKEN = "dummy-jwt-token-for-testing";

class WebsiteAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/websites`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DUMMY_TOKEN}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Generate new website
  async generateWebsite(formData) {
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

    return this.request("/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Get user's websites with pagination
  async getMyWebsites(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      sortBy: params.sortBy || "createdAt",
      sortOrder: params.sortOrder || "desc",
    });

    return this.request(`/my-websites?${queryParams}`);
  }

  // Get specific website by ID
  async getWebsite(websiteId) {
    return this.request(`/${websiteId}`);
  }

  // Update website
  async updateWebsite(websiteId, updateData) {
    return this.request(`/${websiteId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  // Delete website
  async deleteWebsite(websiteId) {
    return this.request(`/${websiteId}`, {
      method: "DELETE",
    });
  }

  // Deploy website to Netlify
  async deployWebsite(websiteId, deployData = {}) {
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
