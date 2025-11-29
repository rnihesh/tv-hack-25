import React from "react";
import AppNavigation from "./AppNavigation";

/**
 * Unified Page Layout Component
 * Provides consistent structure, theming, and spacing across all feature pages
 */
const PageLayout = ({
  children,
  title,
  subtitle,
  icon,
  iconBg = "from-blue-500 to-purple-600",
  badge,
  maxWidth = "max-w-7xl",
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <AppNavigation />

      {/* Page Header */}
      {(title || subtitle) && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                {icon && (
                  <div
                    className={`p-3 bg-gradient-to-br ${iconBg} rounded-xl shadow-lg`}
                  >
                    {typeof icon === "string" ? (
                      <span className="text-2xl">{icon}</span>
                    ) : (
                      icon
                    )}
                  </div>
                )}
                <div>
                  {title && (
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              {badge && <div className="flex-shrink-0">{badge}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8`}>
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
