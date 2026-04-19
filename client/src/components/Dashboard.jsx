import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../utils/api";
import AppNavigation from "./AppNavigation";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CreditCard,
  Globe,
  Image,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";

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
      icon: Globe,
      color: "blue",
      path: "/website-generator",
      stats: credits?.usage?.websitesGenerated || 0,
      statsLabel: "Websites Created",
    },
    {
      id: "chatbot",
      title: "AI Assistant",
      description:
        "Deploy intelligent chatbots that understand your business and engage customers 24/7.",
      icon: Bot,
      color: "indigo",
      path: "/chatbot",
      stats: credits?.usage?.chatbotResponses || 0,
      statsLabel: "Conversations",
    },
    {
      id: "email",
      title: "Email Marketing",
      description:
        "Generate personalized email campaigns using AI to boost engagement and retention.",
      icon: Mail,
      color: "slate",
      path: "/mailer",
      stats: credits?.usage?.emailsGenerated || 0,
      statsLabel: "Emails Sent",
    },
    {
      id: "image",
      title: "Image Generator",
      description:
        "Create stunning visuals and marketing graphics with AI-powered image generation.",
      icon: Image,
      color: "cyan",
      path: "/image-generator",
      stats: credits?.usage?.imagesGenerated || 0,
      statsLabel: "Images Created",
    },
    {
      id: "community",
      title: "Community",
      description:
        "Connect with other businesses, share insights, and learn from industry peers.",
      icon: Users,
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
      icon: CreditCard,
      color: "amber",
      path: "/subscription",
      stats: null,
      statsLabel: null,
      highlight: true,
    },
  ];

  const getColorClasses = (color, type) => {
    const colors = {
      blue: {
        bg: "bg-blue-100 dark:bg-blue-500/15",
        border: "border-blue-200 dark:border-blue-500/25",
        text: "text-blue-700 dark:text-blue-300",
        hover: "hover:border-blue-300 dark:hover:border-blue-400/40",
      },
      indigo: {
        bg: "bg-indigo-100 dark:bg-indigo-500/15",
        border: "border-indigo-200 dark:border-indigo-500/25",
        text: "text-indigo-700 dark:text-indigo-300",
        hover: "hover:border-indigo-300 dark:hover:border-indigo-400/40",
      },
      slate: {
        bg: "bg-slate-100 dark:bg-slate-700/70",
        border: "border-slate-200 dark:border-slate-600",
        text: "text-slate-700 dark:text-slate-200",
        hover: "hover:border-slate-300 dark:hover:border-slate-500",
      },
      cyan: {
        bg: "bg-cyan-100 dark:bg-cyan-500/15",
        border: "border-cyan-200 dark:border-cyan-500/25",
        text: "text-cyan-700 dark:text-cyan-300",
        hover: "hover:border-cyan-300 dark:hover:border-cyan-400/40",
      },
      amber: {
        bg: "bg-amber-100 dark:bg-amber-500/15",
        border: "border-amber-200 dark:border-amber-500/25",
        text: "text-amber-700 dark:text-amber-300",
        hover: "hover:border-amber-300 dark:hover:border-amber-400/40",
      },
    };
    return colors[color]?.[type] || "";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <AppNavigation />

      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-blue-600 dark:bg-blue-500 text-white shadow-sm">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Welcome back, {companyName}!
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Manage your AI-powered business tools
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {loading ? (
                  <span>Loading credits...</span>
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Business Profile
            </h2>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" />
              Active
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                Business Type
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 capitalize">
                {displayUser?.businessType?.replace("_", " ") ||
                  "Not specified"}
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                Communication
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 capitalize">
                {displayUser?.preferences?.communicationTone || "Professional"}
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                Brand Style
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 capitalize">
                {displayUser?.preferences?.brandStyle || "Modern"}
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                Total Used
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {credits?.usage?.totalCreditsUsed || 0} credits
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            AI Tools
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => navigate(feature.path)}
              className={`group relative bg-white dark:bg-slate-900 rounded-2xl border ${getColorClasses(
                feature.color,
                "border"
              )} ${getColorClasses(
                feature.color,
                "hover"
              )} p-6 text-left transition-all duration-200 hover:shadow-md ${
                feature.highlight ? "ring-2 ring-blue-300/70 dark:ring-blue-500/50" : ""
              }`}
            >
              {feature.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold rounded-full shadow-sm uppercase tracking-wide">
                    Recommended
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-14 h-14 ${getColorClasses(
                    feature.color,
                    "bg"
                  )} rounded-2xl flex items-center justify-center shadow-sm`}
                >
                  <feature.icon
                    className={`h-7 w-7 ${getColorClasses(feature.color, "text")}`}
                  />
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
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {feature.statsLabel}
                    </div>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 transition-colors duration-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                {feature.title}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                {feature.description}
              </p>

              <div
                className={`flex items-center ${getColorClasses(
                  feature.color,
                  "text"
                )} font-semibold text-sm`}
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        {credits?.usage && (
          <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Usage Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/25 rounded-xl">
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {credits.usage.websitesGenerated || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
                  Websites
                </div>
              </div>
              <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="text-3xl font-bold text-slate-700 dark:text-slate-200">
                  {credits.usage.emailsGenerated || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
                  Emails
                </div>
              </div>
              <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/25 rounded-xl">
                <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                  {credits.usage.chatbotResponses || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
                  AI Chats
                </div>
              </div>
              <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-500/15 border border-cyan-200 dark:border-cyan-500/25 rounded-xl">
                <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">
                  {credits.usage.imagesGenerated || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
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
