// Mock API utilities for development
// This file provides mock data and functions to make the frontend work without a backend
// Replace these with actual API calls when the backend is ready

// Mock customer data
const mockCustomers = [
  { 
    id: 1, 
    name: 'John Doe', 
    email: 'john@example.com', 
    segment: 'premium', 
    lastActivity: '2024-01-15',
    joinDate: '2023-05-10',
    totalPurchases: 5
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    email: 'jane@example.com', 
    segment: 'regular', 
    lastActivity: '2024-01-10',
    joinDate: '2023-08-22',
    totalPurchases: 3
  },
  { 
    id: 3, 
    name: 'Bob Johnson', 
    email: 'bob@example.com', 
    segment: 'new', 
    lastActivity: '2024-01-20',
    joinDate: '2024-01-05',
    totalPurchases: 1
  },
  { 
    id: 4, 
    name: 'Alice Brown', 
    email: 'alice@example.com', 
    segment: 'premium', 
    lastActivity: '2024-01-18',
    joinDate: '2022-12-15',
    totalPurchases: 8
  },
  { 
    id: 5, 
    name: 'Charlie Wilson', 
    email: 'charlie@example.com', 
    segment: 'regular', 
    lastActivity: '2024-01-12',
    joinDate: '2023-06-30',
    totalPurchases: 4
  },
  { 
    id: 6, 
    name: 'Diana Davis', 
    email: 'diana@example.com', 
    segment: 'new', 
    lastActivity: '2024-01-22',
    joinDate: '2024-01-20',
    totalPurchases: 0
  },
  { 
    id: 7, 
    name: 'Michael Chen', 
    email: 'michael@example.com', 
    segment: 'premium', 
    lastActivity: '2024-01-25',
    joinDate: '2022-03-14',
    totalPurchases: 12
  },
  { 
    id: 8, 
    name: 'Sarah Williams', 
    email: 'sarah@example.com', 
    segment: 'regular', 
    lastActivity: '2024-01-14',
    joinDate: '2023-09-08',
    totalPurchases: 2
  }
];

// Simulate API delay for realistic experience
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Customer API functions
export const customerAPI = {
  // Get all customers
  getCustomers: async () => {
    await delay(800); // Simulate network delay
    return mockCustomers;
  },

  // Get customer by ID
  getCustomer: async (id) => {
    await delay(300);
    return mockCustomers.find(customer => customer.id === id);
  },

  // Search customers
  searchCustomers: async (searchTerm) => {
    await delay(400);
    return mockCustomers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
};

// Email API functions
export const emailAPI = {
  // Enhance email content using AI
  enhanceEmail: async (description, businessContext = '') => {
    await delay(1500); // Simulate AI processing time
    
    // Mock AI-enhanced email content
    const enhancedEmails = {
      'product launch': {
        subject: '🚀 Exciting New Product Launch - Limited Time Offer!',
        content: `Dear Valued Customer,

We're thrilled to announce the launch of our latest innovation that we've been working on just for you!

✨ What makes this special:
• Cutting-edge technology designed with your needs in mind
• Exclusive early-bird pricing for our loyal customers
• 30-day money-back guarantee

🎯 Why you'll love it:
This product solves the exact challenges you've been facing, making your life easier and more efficient.

💫 Limited Time Offer:
Get 25% off your first purchase with code LAUNCH25 - valid until this Friday!

Ready to experience the difference? Click the button below to learn more.

Best regards,
Your AI Digital Toolkit Team

P.S. Have questions? Reply to this email - we're here to help!`
      },
      'newsletter': {
        subject: '📰 Your Monthly Update - Insights & Tips Inside',
        content: `Hello there!

Welcome to this month's newsletter packed with valuable insights, tips, and updates from our team.

📈 This Month's Highlights:
• New feature releases that save you time
• Customer success stories that inspire
• Industry trends worth knowing about

💡 Featured Tip:
Did you know you can automate your email marketing campaigns? Our AI-powered tools can help you create personalized content that resonates with your audience.

🎯 What's Coming Next:
• Enhanced analytics dashboard
• New integration options
• Expanded template library

Thank you for being part of our community. Your feedback drives everything we do!

Stay awesome,
The Team`
      },
      'promotion': {
        subject: '⚡ Flash Sale Alert - 50% Off Everything!',
        content: `🎉 FLASH SALE ALERT! 🎉

For the next 48 hours only, everything in our store is 50% OFF!

🛍️ This includes:
• All premium features
• Extended support packages
• Custom integrations
• Training sessions

⏰ Hurry - Sale ends Sunday at midnight!

Why our customers love us:
"This platform transformed how we handle customer communications. The AI features are incredible!" - Sarah M.

"Setup was so easy, and the results speak for themselves. Highly recommended!" - Mike T.

🎯 Ready to upgrade your business?
Use code FLASH50 at checkout.

Click here to shop now before this amazing deal expires!

Questions? Our support team is standing by to help.

Happy shopping!`
      }
    };

    // Simple keyword matching for demo
    let responseKey = 'newsletter'; // default
    const desc = description.toLowerCase();
    
    if (desc.includes('launch') || desc.includes('product') || desc.includes('new')) {
      responseKey = 'product launch';
    } else if (desc.includes('sale') || desc.includes('discount') || desc.includes('promotion') || desc.includes('offer')) {
      responseKey = 'promotion';
    }

    const result = enhancedEmails[responseKey];
    
    return {
      subject: result.subject,
      content: result.content,
      suggestions: [
        'Consider adding a clear call-to-action button',
        'Personalize with customer names using merge tags',
        'Test different subject lines for better open rates',
        'Include social media links in the footer'
      ]
    };
  },

  // Send email campaign
  sendCampaign: async (emailData) => {
    await delay(2000); // Simulate sending time
    
    const { selectedCustomers, subject, enhancedMessage } = emailData;
    
    // Simulate sending process
    const results = {
      sent: selectedCustomers.length,
      failed: Math.floor(Math.random() * 2), // Randomly simulate 0-1 failures
      campaignId: `campaign_${Date.now()}`,
      estimatedDelivery: '2-5 minutes',
      status: 'sent'
    };

    return results;
  },

  // Get campaign analytics (for future use)
  getCampaignAnalytics: async (campaignId) => {
    await delay(600);
    return {
      campaignId,
      sent: Math.floor(Math.random() * 100) + 50,
      delivered: Math.floor(Math.random() * 95) + 45,
      opened: Math.floor(Math.random() * 40) + 20,
      clicked: Math.floor(Math.random() * 15) + 5,
      openRate: '35.2%',
      clickRate: '12.8%'
    };
  }
};

// General API configuration
export const API_CONFIG = {
  baseURL: 'http://localhost:4000/api', // Update this when backend is ready
  timeout: 10000,
  retries: 3
};

// Utility function for when you connect to real backend
export const createApiCall = async (endpoint, options = {}) => {
  // This will be used when connecting to actual backend
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export default {
  customerAPI,
  emailAPI,
  API_CONFIG,
  createApiCall
};
