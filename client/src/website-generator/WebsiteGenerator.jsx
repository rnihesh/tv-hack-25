import React, { useState, useEffect } from "react";
import { api } from "./api";
import WebsiteForm from "./components/WebsiteForm";
import WebsiteList from "./components/WebsiteList";
import WebsiteViewer from "./components/WebsiteViewer";
import { useRef } from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import Toast from "./components/Toast";

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
        setDeployResult({ success: false, message: response.message || "Unknown error" });
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to deploy website";
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 shadow-lg">
          <h1 className="text-4xl font-bold mb-2">AI Website Generator</h1>
          <p className="text-xl opacity-90 mb-4">
            Generate professional websites with AI assistance
          </p>
          <div className="flex justify-center gap-8 text-sm">
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              Company: {dummyUser.companyName}
            </span>
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              Credits: {dummyUser.credits}
            </span>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="flex bg-white rounded-lg p-1 mb-8 shadow-md">
          <button
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
              activeTab === "generate"
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("generate")}
          >
            Generate Website
          </button>
          <button
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
              activeTab === "manage"
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("manage")}
          >
            My Websites
          </button>
          {selectedWebsite && (
            <button
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
                activeTab === "preview"
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </button>
          )}
        </nav>

        {/* Main Content */}
        <main className="bg-white rounded-xl shadow-lg p-8 relative">
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
                  <div className="mb-2 flex gap-2 items-center">
                    <input
                      type="text"
                      className="border rounded px-2 py-1"
                      placeholder="Optional site name"
                      value={siteName}
                      onChange={e => setSiteName(e.target.value)}
                      disabled={deploying}
                      style={{ minWidth: 180 }}
                    />
                    <button
                      className="bg-blue-600 text-white px-6 py-2 rounded font-semibold shadow hover:bg-blue-700 disabled:opacity-60"
                      onClick={() => handleDeployWebsite(selectedWebsite._id, siteName)}
                      disabled={deploying}
                    >
                      {deploying ? "Deploying..." : "Deploy Website"}
                    </button>
                  </div>
                  {deploying && (
                    <div className="text-sm text-gray-500 mt-2">Deploying... <span>{deployTimer}s</span></div>
                  )}
                  {deployResult && deployResult.success && (
                    <div className="mt-4 text-green-600 font-semibold">
                      Deployed! &nbsp;
                      <a href={deployResult.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-700">View Site</a>
                    </div>
                  )}
                  {deployResult && !deployResult.success && (
                    <div className="mt-4 text-red-600 font-semibold">
                      {deployResult.message}
                    </div>
                  )}
                </div>
              )}
              {selectedWebsite.isDeployed && selectedWebsite.deploymentUrl && (
                <div className="mt-8 text-green-700 font-semibold text-center">
                  Already Deployed: &nbsp;
                  <a href={selectedWebsite.deploymentUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-700">View Site</a>
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
