import React from "react";

const LoadingSpinner = ({
  size = "medium",
  message = "Generating image...",
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-16 w-16",
  };

  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="relative">
        <div
          className={`animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 ${sizeClasses[size]}`}
        ></div>
        <div
          className={`absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 ${sizeClasses[size]}`}
        ></div>
      </div>
      {message && (
        <div className="mt-6 text-center">
          <p className="text-gray-700 dark:text-gray-300 font-medium text-lg mb-2">
            {message}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Please wait...</p>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
