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
  iconBg = "from-blue-500/20 to-indigo-500/20 dark:from-blue-400/25 dark:to-indigo-400/20",
  badge,
  maxWidth = "max-w-7xl",
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 enterprise-shell transition-colors duration-300">
      {/* Navigation */}
      <AppNavigation />

      {/* Page Header */}
      {(title || subtitle) && (
        <div className="glass-surface border-x-0 border-t-0 rounded-none">
          <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                {icon && (
                  <div
                    className={`p-3 bg-gradient-to-br ${iconBg} rounded-xl border border-slate-200/70 dark:border-slate-700/70`}
                  >
                    {typeof icon === "string" ? (
                      <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                        {icon}
                      </span>
                    ) : (
                      icon
                    )}
                  </div>
                )}
                <div>
                  {title && (
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
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
