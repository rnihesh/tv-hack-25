import React, { useState, useEffect } from "react";
import { api } from "./api";
import WebsiteForm from "./components/WebsiteForm";
import WebsiteList from "./components/WebsiteList";
import WebsiteViewer from "./components/WebsiteViewer";
import { useRef } from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import Toast from "./components/Toast";
import AppNavigation from "../components/AppNavigation";

const WebsiteGenerator = () => {
  const [activeTab, setActiveTab] = useState("generate");
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployTimer, setDeployTimer] = useState(0);
  const [deployInterval, setDeployInterval] = useState(null);
  const [deployResult, setDeployResult] = useState(null);
  const [siteName, setSiteName] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [pagination, setPagination] = useState({
    page: 2,
    limit: 100,
    total: 0,
    pages: 0,
  });

  // Dummy user for testing (will be replaced with auth later)
  const dummyUser = {
    id: "dummy-user-123",
    companyName: "Demo Company",
    businessType: "Technology",
    credits: 9999975,
  };

  useEffect(() => {
    if (activeTab === "manage") {
      loadWebsites();
    }
  }, [activeTab, pagination.page]);

  const loadWebsites = async () => {
    try {
      setLoading(true);
      const response = await api.getMyWebsites({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.success) {
        setWebsites(response.data.websites);
        setPagination((prev) => ({
          ...prev,
          ...response.data.pagination,
        }));
      }
    } catch (error) {
      showToast("Failed to load websites", "error");
      console.error("Load websites error:", error);
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
        setActiveTab("preview");

        // Refresh websites list if we're on manage tab
        if (activeTab === "manage") {
          loadWebsites();
        }
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
        setWebsites((prev) =>
          prev.filter((website) => website._id !== websiteId)
        );
        if (selectedWebsite?._id === websiteId) {
          setSelectedWebsite(null);
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

  const handleViewWebsite = async (websiteId) => {
    try {
      setLoading(true);
      const response = await api.getWebsite(websiteId);

      if (response.success) {
        setSelectedWebsite(response.data.website);
        setActiveTab("preview");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to load website";
      showToast(message, "error");
      console.error("View website error:", error);
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

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <AppNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 mb-8 shadow-sm">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              AI Website Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Generate professional websites with AI assistance in seconds
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <div className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
                <span className="font-medium">Company:</span>{" "}
                {dummyUser.companyName}
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="font-medium">Credits:</span>{" "}
                {dummyUser.credits.toLocaleString()}
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

          {activeTab === "generate" && (
            <WebsiteForm
              onSubmit={handleGenerateWebsite}
              loading={loading}
              userCredits={dummyUser.credits}
            />
          )}

          {activeTab === "manage" && (
            <WebsiteList
              websites={websites}
              loading={loading}
              pagination={pagination}
              onView={handleViewWebsite}
              onDelete={handleDeleteWebsite}
              onPageChange={handlePageChange}
            />
          )}

          {activeTab === "preview" && selectedWebsite && (
            <div>
              <WebsiteViewer
                website={selectedWebsite}
                onUpdate={handleUpdateWebsite}
                loading={loading}
              />
              {/* Deploy UI */}
              {!selectedWebsite.isDeployed && (
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
                  {deployResult && deployResult.success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                      <div className="text-green-700 dark:text-green-300 font-semibold mb-2">
                        🎉 Website deployed successfully!
                      </div>
                      <a
                        href={deployResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-600 dark:bg-green-600 hover:bg-green-700 dark:hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
                        View Live Site
                      </a>
                    </div>
                  )}
                  {deployResult && !deployResult.success && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                      <div className="text-red-700 dark:text-red-300 font-semibold mb-2">
                        ❌ Deployment failed
                      </div>
                      <p className="text-red-600 dark:text-red-400">
                        {deployResult.message}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {selectedWebsite.isDeployed && selectedWebsite.deploymentUrl && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                  <div className="text-green-700 dark:text-green-300 font-semibold mb-2">
                    ✅ Website is live
                  </div>
                  <a
                    href={selectedWebsite.deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 dark:bg-green-600 hover:bg-green-700 dark:hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
                    View Live Site
                  </a>
                </div>
              )}
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
    </div>
  );
};

export default WebsiteGenerator;
