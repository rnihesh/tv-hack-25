import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../utils/api";
import ThemeToggle from "../utils/ThemeToggle";
import AppNavigation from "./AppNavigation";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState("home");
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
    console.log(JSON.parse(localStorage.getItem("userData"))?.company?.companyName)
    console.log(JSON.parse(localStorage.getItem("userData"))?.company?.companyName?.charAt(0)?.toUpperCase())
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await authAPI.getCredits();
      if (response.success) {
        setCredits(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  const renderView = () => {
    switch (currentView) {
      case "mailing":
        return (window.location.href = "/mailer");
      default:
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Welcome back, {JSON.parse(localStorage.getItem("userData"))?.company?.companyName} ! 👋
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    Ready to power your business with AI?
                  </p>
                </div>
                <div className="text-right bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Available Credits
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 dark:bg-gray-600 h-8 w-16 rounded"></div>
                    ) : (
                      credits?.currentCredits || 0
                    )}
                  </div>
                  {credits?.dailyReset && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Resets daily
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 transition-all duration-300">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <span className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg mr-3">
                  🏢
                </span>
                Your Business Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Business Type
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize mt-1">
                    {user?.company?.businessType?.replace("_", " ") || "Not specified"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Communication Style
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize mt-1">
                    {user?.company?.preferences?.communicationTone || "Professional"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Industry
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize mt-1">
                    {user?.company?.industry || "Not specified"}
                  </p>
                </div>
                <div className="md:col-span-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Target Audience
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">
                    {user?.company?.targetAudience || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <button
                onClick={() => (window.location.href = "/website-generator")}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 text-left"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-green-100 dark:bg-green-900/50 rounded-lg p-3 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">🌐</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Website Generator
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Create professional websites tailored to your business.
                  Generate your site in minutes!
                </p>
                <div className="flex items-center text-green-600 dark:text-green-400 font-semibold">
                  Start creating
                  <svg
                    className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </button>
              

              <button
                onClick={() => (window.location.href = "/chatbot")}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 text-left"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-purple-100 dark:bg-purple-900/50 rounded-lg p-3 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">🤖</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    AI Chatbot
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Deploy intelligent customer service chatbots. Engage with
                  customers 24/7.
                </p>
                <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold">
                  Start creating
                  <svg
                    className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </button>

              
              <button
                onClick={() => (window.location.href = "/mailer")}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 text-left"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">📧</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Email Marketing
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Generate personalized email campaigns using AI. Perfect for
                  customer engagement and retention.
                </p>
                <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold">
                  Start creating
                  <svg
                    className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </button>
              
              <button
                onClick={() => (window.location.href = "/image-generator")}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300 text-left"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-orange-100 dark:bg-orange-900/50 rounded-lg p-3 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">🎨</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    AI Image Generator
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Create stunning visuals and artwork using AI. Perfect for
                  marketing campaigns and social media.
                </p>
                <div className="flex items-center text-orange-600 dark:text-orange-400 font-semibold">
                  Start creating
                  <svg
                    className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => window.location.href = '/community'}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">💬</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Community Chat</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Connect with other businesses and share insights. Join the conversation and learn from peers.
                </p>
                <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold">
                  Join community 
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => (window.location.href = "/subscription")}
                className="group bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-600 p-8 hover:border-yellow-300 dark:hover:border-yellow-500 transition-all duration-300 text-left shadow-lg"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 rounded-lg p-3 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">💳</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Buy Credits
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Purchase AI credits to power your business tools. Choose from 3 affordable plans.
                </p>
                <div className="flex items-center text-yellow-600 dark:text-yellow-400 font-semibold">
                  View plans
                  <svg
                    className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </button>
            </div>

            {/* Quick Stats */}
            {credits?.usage && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 transition-all duration-300">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <span className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg mr-3">
                    📊
                  </span>
                  Usage Statistics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {credits.usage.totalCreditsUsed || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
                      Credits Used
                    </div>
                  </div>
                  <div className="text-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {credits.usage.emailsGenerated || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
                      Emails Created
                    </div>
                  </div>
                  <div className="text-center bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {credits.usage.websitesGenerated || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
                      Websites Built
                    </div>
                  </div>
                  <div className="text-center bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {credits.usage.chatbotResponses || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
                      Bot Responses
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setCurrentView("home")}
                className="text-2xl font-bold text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors duration-200"
              >
                Phoenix
              </button>
              {currentView !== "home" && (
                <nav className="flex space-x-6">
                  <button
                    onClick={() => setCurrentView("home")}
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200"
                  >
                    Dashboard
                  </button>
                </nav>
              )}
            </div>

            <div className="flex items-center space-x-6">
              {/* <ThemeToggle /> */}
              <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2">
                <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {JSON.parse(localStorage.getItem("userData"))?.company?.companyName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {JSON.parse(localStorage.getItem("userData"))?.company?.companyName}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {JSON.parse(localStorage.getItem("userData"))?.email}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {renderView()}
      </main>
    </div>
  );
};

export default Dashboard;
