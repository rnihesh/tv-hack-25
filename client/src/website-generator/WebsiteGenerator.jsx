import React, { useState, useEffect, useRef } from "react";
import { api } from "./api";
import WebsiteForm from "./components/WebsiteForm";
import WebsiteViewer from "./components/WebsiteViewer";
import LoadingSpinner from "./components/LoadingSpinner";
import Toast from "./components/Toast";
import AppNavigation from "../components/AppNavigation";

const WebsiteGenerator = () => {
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

  // Dummy user for testing (will be replaced with auth later)
  const dummyUser = {
    id: "dummy-user-123",
    companyName: "Demo Company",
    businessType: "Technology",
    credits: 9999975,
  };

  useEffect(() => {
    // Load existing websites when component mounts
    loadWebsites();
  }, []);

  const loadWebsites = async () => {
    try {
      const response = await api.getMyWebsites();
      if (response.success) {
        setWebsites(response.data);
      }
    } catch (error) {
      console.error("Load websites error:", error);
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
          message: response.message || "Unknown error",
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

  const handleDeleteWebsite = async (websiteId) => {
    if (!window.confirm("Are you sure you want to delete this website?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.deleteWebsite(websiteId);

      if (response.success) {
        showToast("Website deleted successfully!", "success");
        loadWebsites();
        if (selectedWebsite?._id === websiteId) {
          setSelectedWebsite(null);
          setCurrentStep("home");
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

  const handleSelectWebsite = (website) => {
    setSelectedWebsite(website);
    setCurrentStep("deploy");
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000
    );
  };

  // Animation classes
  const fadeIn = "animate-fadeIn";
  const slideUp = "animate-slideUp";
  const pulse = "animate-pulse";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AppNavigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className={`text-center mb-12 ${fadeIn}`}>
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
            <div className="relative z-10">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                AI Website Generator
              </h1>
              <p className="text-xl opacity-90 mb-6">
                Create and deploy professional websites with AI assistance
              </p>
              <div className="flex justify-center gap-8 text-sm">
                <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full backdrop-blur-sm">
                  🏢 {dummyUser.companyName}
                </span>
                <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full backdrop-blur-sm">
                  💰 {dummyUser.credits} Credits
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 mb-8 shadow-sm">
          <div className="flex">
            <button
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                activeTab === "generate"
                  ? "bg-blue-600 dark:bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab("generate")}
            >
              Generate Website
            </button>
            <button
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                activeTab === "manage"
                  ? "bg-blue-600 dark:bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              onClick={() => setActiveTab("manage")}
            >
              My Websites
            </button>
            {selectedWebsite && (
              <button
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                  activeTab === "preview"
                    ? "bg-blue-600 dark:bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
                onClick={() => setActiveTab("preview")}
              >
                Preview
              </button>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 relative shadow-sm">
          {loading && <LoadingSpinner />}

          {/* Home Screen - Two Main Actions */}
          {currentStep === "home" && (
            <div className={`${fadeIn} space-y-8`}>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Create Website Card */}
                <div
                  className={`group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 ${slideUp}`}
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
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      Create New Website
                    </h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
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
                  className={`group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 ${slideUp}`}
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
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      Deploy Website
                    </h3>
                    <p className="text-gray-600 mb-8 leading-relaxed">
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
                  className={`bg-white rounded-2xl p-8 shadow-xl border border-gray-100 ${slideUp}`}
                  style={{ animationDelay: "0.4s" }}
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Your Recent Websites
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {websites.slice(0, 3).map((website, index) => (
                      <div
                        key={website._id}
                        className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => handleSelectWebsite(website)}
                      >
                        <div className="text-sm font-semibold text-gray-800 truncate">
                          {website.templateName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {website.isDeployed ? "🌐 Deployed" : "📝 Draft"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create Website Step */}
          {currentStep === "create" && (
            <div
              className={`bg-white rounded-2xl shadow-2xl border border-gray-100 relative overflow-hidden ${fadeIn}`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-800">
                    Create New Website
                  </h2>
                  <button
                    onClick={() => setCurrentStep("home")}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
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
                  userCredits={dummyUser.credits}
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
              className={`bg-white rounded-2xl shadow-2xl border border-gray-100 relative overflow-hidden ${fadeIn}`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-500"></div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-800">
                    Deploy Website
                  </h2>
                  <button
                    onClick={() => setCurrentStep("home")}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
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
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        className="w-12 h-12 text-gray-400"
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
                    <h3 className="text-xl font-semibold text-gray-600 mb-4">
                      No websites found
                    </h3>
                    <p className="text-gray-500 mb-8">
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
                        className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-all transform hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-gray-200"
                        onClick={() => handleSelectWebsite(website)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-semibold text-gray-800 truncate flex-1">
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
                        <p className="text-sm text-gray-600 mb-4">
                          Created:{" "}
                          {new Date(website.createdAt).toLocaleDateString()}
                        </p>
                        {website.isDeployed && website.deploymentUrl ? (
                          <a
                            href={website.deploymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
              className={`bg-white rounded-2xl shadow-2xl border border-gray-100 relative overflow-hidden ${fadeIn}`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-800">
                    Website Preview & Deploy
                  </h2>
                  <button
                    onClick={() => setCurrentStep("home")}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
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
                  <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 border border-purple-200">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                      Ready to Deploy?
                    </h3>

                    <div className="flex flex-col items-center space-y-6">
                      <div className="w-full max-w-md">
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
                      </div>

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

                    {deploying && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
                          <svg
                            className="animate-spin h-5 w-5"
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
                          <span className="font-medium">
                            Deploying your website... {deployTimer}s
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : selectedWebsite.isDeployed &&
                  selectedWebsite.deploymentUrl ? (
                  <div className="mt-8 bg-green-50 rounded-xl p-8 border border-green-200 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-green-600"
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
                    <h3 className="text-2xl font-bold text-green-800 mb-4">
                      Already Deployed!
                    </h3>
                    <p className="text-green-700 mb-6">
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
