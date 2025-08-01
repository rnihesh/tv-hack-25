import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';
// import MailingDashboard from '../mailer/MailingDashboard';
import ThemeToggle from '../utils/ThemeToggle';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await authAPI.getCredits();
      if (response.success) {
        setCredits(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'mailing':
        return null;
      default:
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.companyName}! 👋
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Ready to power your business with AI?
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Available Credits</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {loading ? '...' : credits?.currentCredits || 0}
                  </div>
                  {credits?.dailyReset && (
                    <div className="text-xs text-gray-400">
                      Resets daily
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Business Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Business Type</span>
                  <p className="font-medium capitalize">
                    {user?.businessType?.replace('_', ' ') || 'Not specified'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Communication Style</span>
                  <p className="font-medium capitalize">
                    {user?.preferences?.communicationTone || 'Professional'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-sm text-gray-500">Target Audience</span>
                  <p className="font-medium">
                    {user?.targetAudience || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <button
                onClick={() => setCurrentView('mailing')}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left group"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-blue-100 rounded-lg p-2 group-hover:bg-blue-200 transition-colors">
                    <span className="text-2xl">📧</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Email Marketing</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Generate personalized email campaigns using AI. Perfect for customer engagement and retention.
                </p>
                <div className="mt-3 text-blue-600 text-sm font-medium">
                  Start creating →
                </div>
              </button>

              <div className="bg-white rounded-lg shadow-md p-6 opacity-60">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-gray-100 rounded-lg p-2">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-500">Website Generator</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Create professional websites tailored to your business. Coming soon!
                </p>
                <div className="mt-3 text-gray-400 text-sm font-medium">
                  Coming Soon
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 opacity-60">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-gray-100 rounded-lg p-2">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-500">AI Chatbot</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Deploy intelligent customer service chatbots. Coming soon!
                </p>
                <div className="mt-3 text-gray-400 text-sm font-medium">
                  Coming Soon
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 opacity-60">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-gray-100 rounded-lg p-2">
                    <span className="text-2xl">🎨</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-500">Image Generation</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Create stunning visuals for your marketing campaigns. Coming soon!
                </p>
                <div className="mt-3 text-gray-400 text-sm font-medium">
                  Coming Soon
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            {credits?.usage && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {credits.usage.totalCreditsUsed || 0}
                    </div>
                    <div className="text-sm text-gray-500">Credits Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {credits.usage.emailsGenerated || 0}
                    </div>
                    <div className="text-sm text-gray-500">Emails Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {credits.usage.websitesGenerated || 0}
                    </div>
                    <div className="text-sm text-gray-500">Websites Built</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {credits.usage.chatbotResponses || 0}
                    </div>
                    <div className="text-sm text-gray-500">Bot Responses</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('home')}
                className="text-xl font-bold text-gray-900 hover:text-blue-600"
              >
                AI Digital Toolkit
              </button>
              {currentView !== 'home' && (
                <nav className="flex space-x-4">
                  <button
                    onClick={() => setCurrentView('home')}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Dashboard
                  </button>
                </nav>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="text-sm text-gray-600">
                {user?.email}
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderView()}
      </main>
    </div>
  );
};

export default Dashboard;