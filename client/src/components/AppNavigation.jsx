import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Theme Toggle Hook
const useTheme = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isDark);
  };

  return { isDark, toggleTheme };
};

const AppNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/website-generator", label: "Websites", icon: "🌐" },
    { path: "/image-generator", label: "Images", icon: "🎨" },
    { path: "/mailer", label: "Email", icon: "📧" },
    { path: "/chatbot", label: "AI Chat", icon: "🤖" },
    { path: "/community", label: "Community", icon: "💬" },
  ];

  // Get user display information
  const displayUser = user?.company || user;
  const userEmail = displayUser?.email || "User";
  const companyName =
    displayUser?.companyName || displayUser?.displayName || "Company";

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleLogin = () => {
    navigate("/auth");
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-8">
            <div
              className="flex items-center space-x-2 cursor-pointer group"
              onClick={() =>
                handleNavigation(isAuthenticated ? "/dashboard" : "/")
              }
            >
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 bg-clip-text text-transparent">
                Phoenix
              </span>
            </div>

            {/* Desktop Navigation */}
            {isAuthenticated && (
              <div className="hidden lg:flex items-center space-x-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                      location.pathname === item.path
                        ? "bg-gradient-to-r from-orange-500/10 to-purple-500/10 text-orange-600 dark:text-orange-400"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Theme Toggle + User Info + Menu */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* Credits Badge (Desktop) */}
            {isAuthenticated &&
              displayUser?.credits?.currentCredits !== undefined && (
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full border border-amber-200 dark:border-amber-700">
                  <span className="text-amber-600 dark:text-amber-400">✨</span>
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    {displayUser.credits.currentCredits} credits
                  </span>
                </div>
              )}

            {/* User Avatar & Info (Desktop) */}
            {isAuthenticated && (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800 shadow-md">
                  <span className="text-white text-sm font-bold">
                    {companyName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {companyName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                    {userEmail}
                  </div>
                </div>
              </div>
            )}

            {/* Hamburger Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
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
                ) : (
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl py-2 z-50 border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-y-auto animate-fade-in">
                  {isAuthenticated ? (
                    <>
                      {/* User Info Section */}
                      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750">
                        <div className="flex items-center space-x-3">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-white text-xl font-bold">
                              {companyName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-semibold text-gray-900 dark:text-white truncate">
                              {companyName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {userEmail}
                            </div>
                            {displayUser?.businessType && (
                              <div className="inline-flex items-center mt-1.5 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                  {displayUser.businessType
                                    .charAt(0)
                                    .toUpperCase() +
                                    displayUser.businessType.slice(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Credits Section (Mobile) */}
                      {displayUser?.credits?.currentCredits !== undefined && (
                        <div className="sm:hidden px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Available Credits
                            </span>
                            <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                              <span className="text-amber-600">✨</span>
                              <span className="font-semibold text-amber-700 dark:text-amber-300">
                                {displayUser.credits.currentCredits}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation Items */}
                      <div className="py-2">
                        <div className="px-4 py-2">
                          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            Navigation
                          </span>
                        </div>
                        {navItems.map((item) => (
                          <button
                            key={item.path}
                            onClick={() => handleNavigation(item.path)}
                            className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center space-x-3 transition-all duration-200 ${
                              location.pathname === item.path
                                ? "bg-gradient-to-r from-orange-50 to-purple-50 dark:from-orange-900/20 dark:to-purple-900/20 text-orange-600 dark:text-orange-400 border-r-4 border-orange-500"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            }`}
                          >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                            {location.pathname === item.path && (
                              <div className="ml-auto">
                                <svg
                                  className="w-5 h-5 text-orange-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Buy Credits Section */}
                      <div className="border-t border-gray-100 dark:border-gray-700 py-2">
                        <button
                          onClick={() => handleNavigation("/subscription")}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:from-amber-900/20 dark:hover:to-orange-900/20 flex items-center space-x-3 transition-all duration-200"
                        >
                          <span className="text-xl">💳</span>
                          <span>Buy Credits</span>
                          <span className="ml-auto text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
                            Get More
                          </span>
                        </button>
                      </div>

                      {/* Logout Section */}
                      <div className="border-t border-gray-100 dark:border-gray-700 py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3 transition-all duration-200"
                        >
                          <span className="text-xl">🚪</span>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Login Section for Unauthenticated Users */
                    <div className="py-4 px-4">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Welcome to Phoenix
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          AI-powered tools for your business
                        </p>
                      </div>
                      <button
                        onClick={handleLogin}
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl hover:from-orange-600 hover:to-purple-700 transition-all duration-200 text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                      >
                        <span>🔐</span>
                        <span>Sign In to Get Started</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default AppNavigation;
