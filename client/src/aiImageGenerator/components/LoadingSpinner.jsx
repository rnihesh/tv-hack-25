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
        {/* Outer ring */}
        <div
          className={`animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 ${sizeClasses[size]}`}
        ></div>
        {/* Inner spinning accent */}
        <div
          className={`absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 ${sizeClasses[size]}`}
        ></div>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
        </div>
      </div>
      {message && (
        <div className="mt-6 text-center">
          <p className="text-gray-700 dark:text-gray-300 font-medium text-lg mb-2">
            {message}
          </p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-300 rounded-full animate-bounce [animation-delay:0.1s]"></div>
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
