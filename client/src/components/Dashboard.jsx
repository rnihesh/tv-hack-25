import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../utils/api";
import AppNavigation from "./AppNavigation";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);

  const displayUser = user?.company || user;
  const companyName = displayUser?.companyName || "Your Company";

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
      console.error("Failed to fetch credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      id: "website",
      title: "Website Generator",
      description:
        "Create professional, responsive websites tailored to your business in minutes with AI.",
      icon: "🌐",
      color: "emerald",
      path: "/website-generator",
      stats: credits?.usage?.websitesGenerated || 0,
      statsLabel: "Websites Created",
    },
    {
      id: "chatbot",
      title: "AI Assistant",
      description:
        "Deploy intelligent chatbots that understand your business and engage customers 24/7.",
      icon: "🤖",
      color: "purple",
      path: "/chatbot",
      stats: credits?.usage?.chatbotResponses || 0,
      statsLabel: "Conversations",
    },
    {
      id: "email",
      title: "Email Marketing",
      description:
        "Generate personalized email campaigns using AI to boost engagement and retention.",
      icon: "📧",
      color: "blue",
      path: "/mailer",
      stats: credits?.usage?.emailsGenerated || 0,
      statsLabel: "Emails Sent",
    },
    {
      id: "image",
      title: "Image Generator",
      description:
        "Create stunning visuals and marketing graphics with AI-powered image generation.",
      icon: "🎨",
      color: "orange",
      path: "/image-generator",
      stats: credits?.usage?.imagesGenerated || 0,
      statsLabel: "Images Created",
    },
    {
      id: "community",
      title: "Community",
      description:
        "Connect with other businesses, share insights, and learn from industry peers.",
      icon: "💬",
      color: "indigo",
      path: "/community",
      stats: null,
      statsLabel: null,
    },
    {
      id: "credits",
      title: "Buy Credits",
      description:
        "Purchase AI credits to power all your business tools. Choose from flexible plans.",
      icon: "💳",
      color: "amber",
      path: "/subscription",
      stats: null,
      statsLabel: null,
      highlight: true,
    },
  ];

  const getColorClasses = (color, type) => {
    const colors = {
      emerald: {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        border: "border-emerald-200 dark:border-emerald-800",
        text: "text-emerald-600 dark:text-emerald-400",
        hover: "hover:border-emerald-300 dark:hover:border-emerald-600",
        gradient: "from-emerald-500 to-teal-500",
      },
      purple: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        border: "border-purple-200 dark:border-purple-800",
        text: "text-purple-600 dark:text-purple-400",
        hover: "hover:border-purple-300 dark:hover:border-purple-600",
        gradient: "from-purple-500 to-violet-500",
      },
      blue: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-600 dark:text-blue-400",
        hover: "hover:border-blue-300 dark:hover:border-blue-600",
        gradient: "from-blue-500 to-cyan-500",
      },
      orange: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        border: "border-orange-200 dark:border-orange-800",
        text: "text-orange-600 dark:text-orange-400",
        hover: "hover:border-orange-300 dark:hover:border-orange-600",
        gradient: "from-orange-500 to-red-500",
      },
      indigo: {
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        border: "border-indigo-200 dark:border-indigo-800",
        text: "text-indigo-600 dark:text-indigo-400",
        hover: "hover:border-indigo-300 dark:hover:border-indigo-600",
        gradient: "from-indigo-500 to-purple-500",
      },
      amber: {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-600 dark:text-amber-400",
        hover: "hover:border-amber-300 dark:hover:border-amber-600",
        gradient: "from-amber-500 to-orange-500",
      },
    };
    return colors[color]?.[type] || "";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <AppNavigation />

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 rounded-xl shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {companyName}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your AI-powered business tools
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
              <span className="text-amber-600 dark:text-amber-400">✨</span>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <>
                    <span className="text-lg font-bold">
                      {credits?.currentCredits || 0}
                    </span>{" "}
                    credits available
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {/* Business Profile Quick View */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-xl">🏢</span>
              Business Profile
            </h2>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
              Active
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                Business Type
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1 capitalize">
                {displayUser?.businessType?.replace("_", " ") ||
                  "Not specified"}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                Communication
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1 capitalize">
                {displayUser?.preferences?.communicationTone || "Professional"}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                Brand Style
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1 capitalize">
                {displayUser?.preferences?.brandStyle || "Modern"}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                Total Used
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                {credits?.usage?.totalCreditsUsed || 0} credits
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            AI Tools
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => navigate(feature.path)}
              className={`group relative bg-white dark:bg-gray-800 rounded-2xl border ${getColorClasses(
                feature.color,
                "border"
              )} ${getColorClasses(
                feature.color,
                "hover"
              )} p-6 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                feature.highlight ? "ring-2 ring-amber-400/50" : ""
              }`}
            >
              {feature.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                    RECOMMENDED
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-14 h-14 ${getColorClasses(
                    feature.color,
                    "bg"
                  )} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                >
                  <span className="text-3xl">{feature.icon}</span>
                </div>
                {feature.stats !== null && (
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${getColorClasses(
                        feature.color,
                        "text"
                      )}`}
                    >
                      {feature.stats}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {feature.statsLabel}
                    </div>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-purple-500 transition-all duration-300">
                {feature.title}
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                {feature.description}
              </p>

              <div
                className={`flex items-center ${getColorClasses(
                  feature.color,
                  "text"
                )} font-semibold text-sm`}
              >
                <span>Get Started</span>
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
          ))}
        </div>

        {/* Quick Stats */}
        {credits?.usage && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Usage Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {credits.usage.websitesGenerated || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
                  Websites
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {credits.usage.emailsGenerated || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
                  Emails
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {credits.usage.chatbotResponses || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
                  AI Chats
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {credits.usage.imagesGenerated || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">
                  Images
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
