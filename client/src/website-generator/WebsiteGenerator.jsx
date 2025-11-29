import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";
import WebsiteForm from "./components/WebsiteForm";
import WebsiteViewer from "./components/WebsiteViewer";
import LoadingSpinner from "./components/LoadingSpinner";
import Toast from "./components/Toast";
import AppNavigation from "../components/AppNavigation";
import { useAuth } from "../contexts/AuthContext";

const WebsiteGenerator = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState("home"); // home, create, deploy, preview
  const [activeTab, setActiveTab] = useState("generate"); // Add missing activeTab state
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployTimer, setDeployTimer] = useState(0);
  const [deployResult, setDeployResult] = useState(null);
  const [siteName, setSiteName] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  console.log("user", user);

  // Safety check: redirect to auth if not authenticated after loading
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to auth...");
      navigate("/auth", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Log user details to console for debugging
  useEffect(() => {
    if (user?.company) {
      console.log("=== Authenticated User Details ===");
      console.log("Full User Object:", user);
      console.log("Company Data:", user.company);
      console.log("User ID:", user.company._id || user.company.id);
      console.log(
        "Company Name:",
        user.company.companyName || user.company.displayName
      );
      console.log("Email:", user.company.email);
      console.log("Business Type:", user.company.businessType);
      console.log("Target Audience:", user.company.targetAudience);
      console.log("Business Description:", user.company.businessDescription);
      console.log("Current Credits:", user.company.credits?.currentCredits);
      console.log(
        "Total Credits Used:",
        user.company.credits?.totalCreditsUsed
      );
      console.log(
        "Daily Credits Used:",
        user.company.credits?.dailyCreditsUsed
      );
      console.log("Subscription Plan:", user.company.subscription?.plan);
      console.log("Subscription Status:", user.company.subscription?.status);
      console.log("Website Usage:", user.company.usage);
      console.log("AI Preferences:", user.company.preferences);
      console.log("Is Authenticated:", isAuthenticated);
      console.log("=====================================");
    } else if (user) {
      console.log("User exists but no company data:", user);
    } else {
      console.log("No authenticated user found");
    }
  }, [user, isAuthenticated]);

  // Use the authenticated user's company data directly
  const displayUser = user?.company || user;

  // Animation class names
  const fadeIn = "animate-fadeIn";
  const slideUp = "animate-slideUp";

  // Safety check: if no valid user data after auth loading, return null to let ProtectedRoute handle
  if (!authLoading && (!displayUser || !displayUser._id)) {
    return null;
  }

  useEffect(() => {
    // Load existing websites when component mounts and when user is authenticated
    if (isAuthenticated && !authLoading && displayUser?._id) {
      loadWebsites();
    }
  }, [isAuthenticated, authLoading, displayUser?._id]);

  const loadWebsites = async () => {
    if (!displayUser?._id) {
      console.log("No company ID available for loading websites");
      return;
    }

    try {
      setLoading(true);
      console.log("Loading websites for company:", displayUser._id);

      // Check if userData exists in localStorage
      const userData = localStorage.getItem("userData");
      console.log("UserData from localStorage:", userData);

      if (userData) {
        const parsedUserData = JSON.parse(userData);
        console.log("Parsed userData:", parsedUserData);
        console.log("Company ID from userData:", parsedUserData.company?._id);
      }

      const response = await api.getMyWebsites();
      console.log("Websites API response:", response);

      if (response.success) {
        // Handle both array response and paginated response
        const websitesData = Array.isArray(response.data)
          ? response.data
          : response.data.websites || [];
        setWebsites(websitesData);
        console.log("Loaded websites:", websitesData);
        console.log("Number of websites loaded:", websitesData.length);
      } else {
        console.error("Failed to load websites:", response.message);
        showToast(response.message || "Failed to load websites", "error");
      }
    } catch (error) {
      console.error("Load websites error:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to load websites";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWebsite = async (formData) => {
    try {
      setLoading(true);
      const response = await api.generateWebsite(formData);

      if (response.success) {
        // Create a website object with the generated HTML content
        const websiteData = {
          _id: response.data.websiteId || `generated-${Date.now()}`,
          templateName: formData.prompt || "Generated Website",
          htmlContent: response.data.htmlContent,
          industry: formData.industry || "General",
          aiGenerated: true,
          createdAt: new Date().toISOString(),
          customizations: {
            style: formData.style || "modern",
            colorScheme: formData.colorScheme || "blue",
          },
          requirements: formData.requirements || "",
          isDeployed: false,
          deploymentUrl: null,
        };

        showToast("Website generated successfully!", "success");
        setSelectedWebsite(websiteData);
        setCurrentStep("preview");
        loadWebsites(); // Refresh websites list
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to generate website";
      showToast(message, "error");
      console.error("Generate website error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWebsite = async (websiteId, updateData) => {
    try {
      setLoading(true);
      const response = await api.updateWebsite(websiteId, updateData);

      if (response.success) {
        showToast("Website updated successfully!", "success");
        setSelectedWebsite(response.data.website);
        loadWebsites(); // Refresh the list
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update website";
      showToast(message, "error");
      console.error("Update website error:", error);
    } finally {
      setLoading(false);
    }
  };

  const deployTimerRef = useRef();
  const handleDeployWebsite = async (websiteId, siteName) => {
    setDeploying(true);
    setDeployResult(null);
    setDeployTimer(0);
    deployTimerRef.current = setInterval(() => {
      setDeployTimer((t) => t + 1);
    }, 1000);
    try {
      const response = await api.deployWebsite(websiteId, { siteName });
      if (response.success) {
        showToast("Website deployed successfully!", "success");
        setDeployResult({ success: true, url: response.data.websiteUrl });
        loadWebsites();

        // Update the selected website with deployment info
        setSelectedWebsite((prev) => ({
          ...prev,
          isDeployed: true,
          deploymentUrl: response.data.websiteUrl,
        }));
      } else {
        setDeployResult({
          success: false,
          message: response.message || "Deployment failed",
        });
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to deploy website";
      showToast(message, "error");
      setDeployResult({ success: false, message });
      console.error("Deploy website error:", error);
    } finally {
      setDeploying(false);
      clearInterval(deployTimerRef.current);
    }
  };

  const handleSelectWebsite = (website) => {
    setSelectedWebsite(website);
    setActiveTab("preview");
    setCurrentStep("preview");
  };

  const handleEditWebsite = (website) => {
    setSelectedWebsite(website);
    setCurrentStep("create");
    setActiveTab("generate");
  };

  const handleDeleteWebsite = async (websiteId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this website? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.deleteWebsite(websiteId);

      if (response.success) {
        showToast("Website deleted successfully!", "success");
        setWebsites((prev) => prev.filter((w) => w._id !== websiteId));

        // Clear selected website if it was deleted
        if (selectedWebsite?._id === websiteId) {
          setSelectedWebsite(null);
          setActiveTab("manage");
        }
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete website";
      showToast(message, "error");
      console.error("Delete website error:", error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000
    );
  };

  // Show loading spinner while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <AppNavigation />

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
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
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  AI Website Generator
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Create and deploy professional websites with AI assistance
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-700">
              <svg
                className="w-4 h-4 text-violet-600 dark:text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                5 credits per website
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab Navigation */}
        <nav className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-1">
            <button
              className={`flex-1 py-3 px-4 sm:px-6 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === "generate"
                  ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab("generate")}
            >
              ✨ Generate
            </button>
            <button
              className={`flex-1 py-3 px-4 sm:px-6 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === "manage"
                  ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab("manage")}
            >
              📁 My Websites
            </button>
            {selectedWebsite && (
              <button
                className={`flex-1 py-3 px-4 sm:px-6 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === "preview"
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => setActiveTab("preview")}
              >
                👁️ Preview
              </button>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 sm:p-8 relative shadow-sm">
          {loading && <LoadingSpinner />}

          {/* Generate Website Tab */}

          {/* My Websites Tab */}
          {activeTab === "manage" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    My Websites
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage your AI-generated websites and deploy them to the
                    internet
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={loadWebsites}
                    disabled={loading}
                    className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("generate");
                      setCurrentStep("create");
                    }}
                    className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Create New Website
                  </button>
                </div>
              </div>

              {/* Websites Grid */}
              {loading ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-4">
                    Loading your websites...
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Please wait while we fetch your websites from the server.
                  </p>
                </div>
              ) : websites.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-12 h-12 text-gray-400 dark:text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-4">
                    No websites found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">
                    You haven't created any websites yet. Start by generating
                    your first AI-powered website!
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab("generate");
                      setCurrentStep("create");
                    }}
                    className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    ✨ Create Your First Website
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {websites.map((website, index) => (
                    <div
                      key={website._id}
                      className={`bg-white dark:bg-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-200 dark:border-gray-600 ${slideUp}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Website Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-lg truncate mb-1">
                            {website.templateName || "Untitled Website"}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="capitalize">
                              {website.industry || "General"}
                            </span>
                            {website.aiGenerated && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                AI Generated
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            website.isPublished
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {website.isPublished ? "🌐 Published" : "📝 Draft"}
                        </span>
                      </div>

                      {/* Website Details */}
                      <div className="space-y-3 mb-6">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Created:</span>{" "}
                          {new Date(website.createdAt).toLocaleDateString()}
                        </div>
                        {website.generationPrompt && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Prompt:</span>{" "}
                            <span className="italic">
                              {website.generationPrompt.length > 60
                                ? website.generationPrompt.substring(0, 60) +
                                  "..."
                                : website.generationPrompt}
                            </span>
                          </div>
                        )}
                        {website.structure?.styling && (
                          <div className="flex gap-2 text-xs">
                            {website.structure.styling.colorScheme?.primary && (
                              <span
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{
                                  backgroundColor:
                                    website.structure.styling.colorScheme
                                      .primary,
                                }}
                                title={`Primary: ${website.structure.styling.colorScheme.primary}`}
                              ></span>
                            )}
                            <span className="text-gray-500">
                              {website.customizations?.style || "Modern"} Style
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Website Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedWebsite(website);
                            setActiveTab("preview");
                          }}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                        >
                          👁️ Preview
                        </button>
                        <button
                          onClick={() => handleEditWebsite(website)}
                          className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors text-sm"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteWebsite(website._id)}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Published Website Link */}
                      {website.isPublished && website.publishedUrl && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <a
                            href={`https://${website.publishedUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm flex items-center gap-1"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                            View Live Website
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Summary Statistics */}
              {websites.length > 0 && (
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Website Statistics
                  </h3>
                  <div className="grid md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {websites.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total Websites
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {websites.filter((w) => w.isPublished).length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Published
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {websites.filter((w) => !w.isPublished).length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Drafts
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {websites.filter((w) => w.aiGenerated).length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        AI Generated
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === "preview" && selectedWebsite && (
            <div className={`${fadeIn}`}>
              <WebsiteViewer website={selectedWebsite} />
            </div>
          )}

          {/* Home Screen - Two Main Actions */}
          {currentStep === "home" && activeTab === "generate" && (
            <div className={`${fadeIn} space-y-8`}>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Create Website Card */}
                <div
                  className={`group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-700 ${slideUp}`}
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                      Create New Website
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                      Generate a professional website using AI. Describe your
                      business and let our AI create a stunning website for you.
                    </p>
                    <button
                      onClick={() => setCurrentStep("create")}
                      className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full"
                    >
                      ✨ Start Creating
                    </button>
                  </div>
                </div>

                {/* Deploy Website Card */}
                <div
                  className={`group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-gray-700 ${slideUp}`}
                  style={{ animationDelay: "0.2s" }}
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                      Deploy Website
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                      Select from your existing websites and deploy them to the
                      internet. Make your website live in seconds.
                    </p>
                    <button
                      onClick={() => setCurrentStep("deploy")}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full"
                    >
                      🚀 Deploy Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Websites Preview */}
              {websites.length > 0 && (
                <div
                  className={`bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 ${slideUp}`}
                  style={{ animationDelay: "0.4s" }}
                >
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
                    Your Recent Websites
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {websites.slice(0, 3).map((website, index) => (
                      <div
                        key={website._id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                        onClick={() => handleSelectWebsite(website)}
                      >
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {website.templateName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {website.isDeployed ? "🌐 Deployed" : "📝 Draft"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Statistics Dashboard */}
              {isAuthenticated && displayUser && (
                <div
                  className={`bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-600 ${slideUp}`}
                  style={{ animationDelay: "0.6s" }}
                >
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
                    Your Account Overview
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {displayUser?.usage?.websitesGenerated || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Websites Generated
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {displayUser?.usage?.emailsSent || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Emails Sent
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {displayUser?.usage?.imagesGenerated || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Images Generated
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {displayUser?.usage?.chatbotQueries || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Chatbot Queries
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Business Type:
                        </span>
                        <div className="text-blue-600 dark:text-blue-400 capitalize">
                          {displayUser?.businessType || "Not specified"}
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Credits Used Today:
                        </span>
                        <div className="text-red-600 dark:text-red-400">
                          {displayUser?.credits?.dailyCreditsUsed || 0}
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Total Credits Used:
                        </span>
                        <div className="text-gray-600 dark:text-gray-400">
                          {displayUser?.credits?.totalCreditsUsed?.toLocaleString() ||
                            0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create Website Step */}
          {currentStep === "create" && (
            <div
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden ${fadeIn}`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    Create New Website
                  </h2>
                  <button
                    onClick={() => setCurrentStep("home")}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                {loading && <LoadingSpinner />}
                <WebsiteForm
                  onSubmit={handleGenerateWebsite}
                  loading={loading}
                  userCredits={displayUser?.credits?.currentCredits || 0}
                />

                {/* This section is only shown if selectedWebsite exists and is being created */}
                {selectedWebsite && !selectedWebsite.isDeployed && (
                  <div className="mt-8 flex flex-col items-center">
                    <div className="mb-4 flex flex-col gap-3">
                      <input
                        type="text"
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Optional site name (e.g., my-awesome-site)"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        disabled={deploying}
                      />
                      <button
                        className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold shadow-sm transition-colors disabled:cursor-not-allowed"
                        onClick={() =>
                          handleDeployWebsite(selectedWebsite._id, siteName)
                        }
                        disabled={deploying}
                      >
                        {deploying ? (
                          <div className="flex items-center gap-2">
                            <svg
                              className="animate-spin h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Deploying...
                          </div>
                        ) : (
                          "Deploy Website"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deploy Website Step */}
          {currentStep === "deploy" && (
            <div
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden ${fadeIn}`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-500"></div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    Deploy Website
                  </h2>
                  <button
                    onClick={() => setCurrentStep("home")}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {websites.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-12 h-12 text-gray-400 dark:text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-4">
                      No websites found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                      Create your first website to deploy it
                    </p>
                    <button
                      onClick={() => setCurrentStep("create")}
                      className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      Create Website
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {websites.map((website) => (
                      <div
                        key={website._id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all transform hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-gray-200 dark:border-gray-600"
                        onClick={() => handleSelectWebsite(website)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 truncate flex-1">
                            {website.templateName}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              website.isDeployed
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {website.isDeployed ? "Deployed" : "Draft"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Created:{" "}
                          {new Date(website.createdAt).toLocaleDateString()}
                        </p>
                        {website.isDeployed && website.deploymentUrl ? (
                          <a
                            href={website.deploymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Live Site →
                          </a>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWebsite(website);
                              setCurrentStep("preview");
                            }}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                          >
                            Deploy Now
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview and Deploy Step */}
          {currentStep === "preview" && selectedWebsite && (
            <div
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden ${fadeIn}`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    Website Preview & Deploy
                  </h2>
                  <button
                    onClick={() => setCurrentStep("home")}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <WebsiteViewer website={selectedWebsite} loading={loading} />

                {/* Deploy Section */}
                {!selectedWebsite.isDeployed ? (
                  <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl p-8 border border-purple-200 dark:border-purple-700">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
                      Ready to Deploy?
                    </h3>

                    <div className="flex flex-col items-center space-y-6">
                      {/* <div className="w-full max-w-md">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Site Name (Optional)
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Enter custom site name"
                          value={siteName}
                          onChange={(e) => setSiteName(e.target.value)}
                          disabled={deploying}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty for auto-generated name
                        </p>
                      </div> */}

                      <button
                        className={`px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all transform ${
                          deploying
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-105 hover:shadow-xl"
                        } text-white`}
                        onClick={() =>
                          handleDeployWebsite(selectedWebsite._id, siteName)
                        }
                        disabled={deploying}
                      >
                        {deploying ? (
                          <span className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Deploying... {deployTimer}s
                          </span>
                        ) : (
                          "🚀 Deploy Website"
                        )}
                      </button>

                      {deployResult && (
                        <div
                          className={`text-center p-4 rounded-lg ${
                            deployResult.success
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {deployResult.success ? (
                            <div>
                              <p className="font-semibold mb-2">
                                🎉 Deployment Successful!
                              </p>
                              <a
                                href={deployResult.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-medium underline"
                              >
                                View Your Live Website →
                              </a>
                            </div>
                          ) : (
                            <p>{deployResult.message}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedWebsite.isDeployed &&
                  selectedWebsite.deploymentUrl ? (
                  <div className="mt-8 bg-green-50 dark:bg-green-900/30 rounded-xl p-8 border border-green-200 dark:border-green-700 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-4">
                      Already Deployed!
                    </h3>
                    <p className="text-green-700 dark:text-green-400 mb-6">
                      Your website is live and accessible on the internet.
                    </p>
                    <a
                      href={selectedWebsite.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-green-700 hover:shadow-xl transition-all inline-block"
                    >
                      🌐 View Live Website
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </main>

        {/* Toast */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() =>
              setToast({ show: false, message: "", type: "success" })
            }
          />
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.8s ease-out both;
        }
      `}</style>
    </div>
  );
};

export default WebsiteGenerator;
