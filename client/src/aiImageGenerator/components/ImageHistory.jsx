import React, { useState } from "react";
import { getApiBaseUrl, getServerBaseUrl } from "../../utils/config.js";

const ImageHistory = ({
  images,
  loading,
  onLoadMore,
  pagination,
  onImageSelect,
}) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (image) => {
    setSelectedImage(image);
    if (onImageSelect) {
      onImageSelect(image);
    }
  };

  const getProxyImageUrl = (imageUrl) => {
    // If it's a Cloudinary URL, use it directly
    if (imageUrl && imageUrl.includes("cloudinary.com")) {
      return imageUrl;
    }
    // Convert absolute server URLs to proxy URL for local images
    if (imageUrl) {
      const serverUrl = getServerBaseUrl();
      const localUrls = [serverUrl, "https://phoenix-sol.onrender.com"];

      for (const url of localUrls) {
        if (imageUrl.startsWith(url)) {
          return imageUrl.replace(url, "");
        }
      }
    }
    return imageUrl;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncatePrompt = (prompt, maxLength = 60) => {
    return prompt.length > maxLength
      ? `${prompt.substring(0, maxLength)}...`
      : prompt;
  };

  if (loading && images.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 transition-colors duration-300">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
          <span className="text-gray-600 dark:text-gray-300 font-medium">
            Loading your creative history...
          </span>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center transition-colors duration-300">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <svg
              className="h-10 w-10 text-blue-600 dark:text-blue-400"
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
            No creations yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Start generating amazing AI images to build your creative
            collection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      {/* Header */}
      <div className="bg-blue-50 dark:bg-blue-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center mr-4">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-300"
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
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Gallery
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {pagination.total} creation{pagination.total !== 1 ? "s" : ""} in
              your collection
            </p>
          </div>
        </div>
      </div>

      {/* Image Grid */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div
              key={image._id}
              className="group cursor-pointer bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden hover:shadow-md hover:scale-[1.02] transition-all duration-200 border border-gray-200 dark:border-gray-600"
              onClick={() => handleImageClick(image)}
            >
              {/* Image Thumbnail */}
              <div className="aspect-square bg-gray-200 dark:bg-gray-600 relative overflow-hidden">
                <img
                  src={getProxyImageUrl(image.imageUrl)}
                  alt={image.prompt}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <svg
                      className="h-6 w-6 text-white"
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
                  </div>
                </div>
              </div>

              {/* Image Info */}
              <div className="p-5">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3 leading-relaxed">
                  {truncatePrompt(image.prompt)}
                </p>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-full capitalize font-medium">
                    {image.style}
                  </span>
                  <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full font-medium">
                    {image.aspectRatio}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatDate(image.generatedAt)}</span>
                  <div className="flex items-center">
                    <svg
                      className="h-3 w-3 mr-1"
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
                    <span>{image.creditsUsed}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {pagination.hasNext && (
          <div className="mt-8 text-center">
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="bg-blue-600 dark:bg-blue-500 text-white py-3 px-8 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Loading more...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Load More Creations
                </div>
              )}
            </button>
          </div>
        )}

        {/* Pagination Info */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 inline-block">
            Showing {images.length} of {pagination.total} images
            {pagination.pages > 1 && (
              <span>
                {" "}
                • Page {pagination.page} of {pagination.pages}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageHistory;
