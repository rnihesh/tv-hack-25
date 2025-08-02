import React, { useState, useEffect } from "react";
import { imageApi } from "./api";
import ImageForm from "./components/ImageForm";
import ImagePreview from "./components/ImagePreview";
import ImageHistory from "./components/ImageHistory";
import LoadingSpinner from "./components/LoadingSpinner";
import Toast from "./components/Toast";
import AppNavigation from "../components/AppNavigation";
import ThemeToggle from "../utils/ThemeToggle";

const ImageGenerator = () => {
  const [activeTab, setActiveTab] = useState("generate");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 0,
    hasNext: false,
  });

  // Load image history when switching to history tab
  useEffect(() => {
    if (activeTab === "history") {
      loadImageHistory();
    }
  }, [activeTab]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: "", type: "success" });
  };

  const loadImageHistory = async (page = 1) => {
    try {
      setLoadingHistory(true);
      const response = await imageApi.getImageHistory({
        page,
        limit: pagination.limit,
      });

      if (response.success) {
        if (page === 1) {
          setImages(response.data.images);
        } else {
          setImages((prev) => [...prev, ...response.data.images]);
        }
        setPagination(response.data.pagination);
      }
    } catch (error) {
      showToast("Failed to load image history", "error");
      console.error("Load image history error:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleImageGeneration = async (imageData) => {
    try {
      setLoading(true);
      setGeneratedImage(null);

      const response = await imageApi.generateImage(imageData);

      if (response.success) {
        setGeneratedImage(response.data);
        setActiveTab("preview");
        showToast("Image generated successfully!", "success");

        // Update history if we're viewing it
        if (images.length > 0) {
          loadImageHistory(1);
        }
      }
    } catch (error) {
      console.error("Image generation error:", error);
      const errorMessage =
        error.message || "Failed to generate image. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (pagination.hasNext && !loadingHistory) {
      loadImageHistory(pagination.page + 1);
    }
  };

  const handleImageSelect = (image) => {
    setGeneratedImage(image);
    setActiveTab("preview");
  };

  const handleDownloadImage = (image) => {
    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = image.imageUrl;
    link.download = `ai-image-${image.imageId || Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Download started!", "success");
  };

  const tabs = [
    { id: "generate", label: "Generate", icon: "plus" },
    { id: "history", label: "History", icon: "history" },
    { id: "preview", label: "Preview", icon: "eye" },
  ];

  const getTabIcon = (iconType) => {
    const iconClasses = "h-5 w-5";
    switch (iconType) {
      case "plus":
        return (
          <svg
            className={iconClasses}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        );
      case "history":
        return (
          <svg
            className={iconClasses}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "eye":
        return (
          <svg
            className={iconClasses}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <AppNavigation />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI Image Studio
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Create stunning visuals with artificial intelligence
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-700">
                <svg
                  className="h-4 w-4 inline mr-2"
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
                3 credits per image
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {getTabIcon(tab.icon)}
                <span>{tab.label}</span>
                {tab.id === "preview" && generatedImage && (
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                    1
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "generate" && (
          <div className="max-w-2xl mx-auto">
            <ImageForm onSubmit={handleImageGeneration} loading={loading} />
            {loading && (
              <div className="mt-8">
                <LoadingSpinner
                  size="large"
                  message="Generating your image with AI..."
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <ImageHistory
            images={images}
            loading={loadingHistory}
            onLoadMore={handleLoadMore}
            pagination={pagination}
            onImageSelect={handleImageSelect}
          />
        )}

        {activeTab === "preview" && (
          <div className="max-w-4xl mx-auto">
            {generatedImage ? (
              <ImagePreview
                image={generatedImage}
                onDownload={handleDownloadImage}
                onClose={() => setActiveTab("generate")}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors duration-300">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                    <svg
                      className="h-10 w-10 text-gray-600 dark:text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    No image to preview
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Generate an image or select one from your history to preview
                    it here.
                  </p>
                  <button
                    onClick={() => setActiveTab("generate")}
                    className="bg-blue-600 dark:bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 font-medium"
                  >
                    Generate New Image
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Toast Notifications */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
};

export default ImageGenerator;
