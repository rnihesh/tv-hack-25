import React, { useState, useEffect } from "react";

const ImagePreview = ({ image, onDownload, onClose }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);

  if (!image) return null;

  // Set image source with proxy handling for local URLs
  useEffect(() => {
    if (image?.imageUrl) {
      setImageError(false);
      setImageLoaded(false);

      // Convert absolute localhost URL to proxy URL for local images
      let finalUrl = image.imageUrl;
      const localUrls = [
        "http://localhost:3000",
        "https://phoenix-sol.onrender.com",
      ];

      localUrls.forEach((url) => {
        if (finalUrl.startsWith(url)) {
          finalUrl = finalUrl.replace(url, "");
        }
      });

      // Add timestamp to prevent caching issues for local images only
      if (!finalUrl.includes("cloudinary.com")) {
        finalUrl = `${finalUrl}?t=${Date.now()}`;
      }

      setImgSrc(finalUrl);
    }
  }, [image?.imageUrl]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload(image);
    } else {
      // Default download functionality
      const link = document.createElement("a");
      link.href = image.imageUrl;
      link.download = `ai-generated-image-${image.imageId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e) => {
    setImageError(true);
    setImageLoaded(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="bg-blue-50 dark:bg-blue-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center mr-3">
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Creation
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Image Container */}
      <div className="p-8">
        <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-8 border border-gray-200 dark:border-gray-600">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Loading your masterpiece...
                </p>
              </div>
            </div>
          )}

          {imageError ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium mb-2">Failed to load image</p>
              <p className="text-xs text-center">
                Please try generating a new image
              </p>
            </div>
          ) : (
            <img
              src={imgSrc}
              alt={image.prompt}
              className={`w-full h-auto max-h-[500px] object-contain ${
                !imageLoaded ? "opacity-0" : "opacity-100"
              } transition-opacity duration-300`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </div>

        {/* Image Details */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Prompt
            </label>
            <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 leading-relaxed">
              {image.prompt}
            </p>
          </div>

          {image.imageDescription && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                AI Description
              </label>
              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 leading-relaxed">
                {image.imageDescription}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Style
              </label>
              <p className="text-gray-900 dark:text-gray-100 capitalize">
                {image.style}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Aspect Ratio
              </label>
              <p className="text-gray-900 dark:text-gray-100">
                {image.aspectRatio}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <label className="block text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                Credits Used
              </label>
              <p className="text-blue-900 dark:text-blue-100 font-medium">
                {image.creditsUsed}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
              <label className="block text-sm font-semibold text-green-700 dark:text-green-300 mb-1">
                Remaining Credits
              </label>
              <p className="text-green-900 dark:text-green-100 font-medium">
                {image.remainingCredits}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleDownload}
            disabled={imageError}
            className="flex-1 bg-blue-600 dark:bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            <div className="flex items-center justify-center">
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Image
            </div>
          </button>

          <button
            onClick={() => navigator.clipboard.writeText(image.imageUrl)}
            className="flex-1 bg-gray-600 dark:bg-gray-700 text-white py-3 px-6 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 font-medium"
          >
            <div className="flex items-center justify-center">
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy URL
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
