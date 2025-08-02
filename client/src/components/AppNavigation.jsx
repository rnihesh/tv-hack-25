import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AppNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/website-generator", label: "Website Generator", icon: "🌐" },
    { path: "/image-generator", label: "Image Generator", icon: "🎨" },
    { path: "/mailer", label: "Email Marketing", icon: "📧" },
    { path: "/chatbot", label: "AI Assistant", icon: "🤖" },
  ];

  // Get user display information
  const displayUser = user?.company || user;
  const userEmail = displayUser?.email || "User";
  const companyName = displayUser?.companyName || displayUser?.displayName || "Company";

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
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
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <h1 
              className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer"
              onClick={() => handleNavigation(isAuthenticated ? "/dashboard" : "/")}
            >
              Phoenix
            </h1>
          </div>

          {/* Right Side: User Info + Hamburger Menu */}
          <div className="flex items-center space-x-4">
            {/* User Info (Desktop Only) */}
            {isAuthenticated && (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {companyName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{companyName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                    {userEmail}
                  </div>
                </div>
              </div>
            )}

            {/* Hamburger Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 z-50 border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-y-auto">
                  {isAuthenticated ? (
                    <>
                      {/* User Info Section */}
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-lg font-semibold">
                              {companyName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{companyName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</div>
                            {displayUser?.businessType && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {displayUser.businessType.charAt(0).toUpperCase() + displayUser.businessType.slice(1)} Business
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Navigation Items */}
                      <div className="py-2">
                        {navItems.map((item) => (
                          <button
                            key={item.path}
                            onClick={() => handleNavigation(item.path)}
                            className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center space-x-3 transition-colors ${
                              location.pathname === item.path
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                            {location.pathname === item.path && (
                              <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Additional Options */}
                      {/* <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                        <button
                          onClick={() => handleNavigation("/subscription")}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                        >
                          <span className="text-lg">💳</span>
                          <span>Subscription & Billing</span>
                        </button>
                        <button
                          onClick={() => handleNavigation("/settings")}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                        >
                          <span className="text-lg">⚙️</span>
                          <span>Settings</span>
                        </button>
                      </div> */}

                      {/* Logout Section */}
                      <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3 transition-colors"
                        >
                          <span className="text-lg">🚪</span>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Login Section for Unauthenticated Users */
                    <div className="py-2">
                      <button
                        onClick={handleLogin}
                        className="w-full text-left px-4 py-3 bg-blue-600 text-white rounded-lg mx-2 hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                      >
                        <span>🔐</span>
                        <span>Sign In</span>
                      </button>
                      <div className="px-4 py-3 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Sign in to access your AI business tools
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Overlay for menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-opacity-25 backdrop-blur-[2px]" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      </div>
    </nav>
  );
};

export default AppNavigation;
