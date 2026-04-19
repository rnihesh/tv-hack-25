import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Bot,
  ChevronRight,
  CreditCard,
  Globe,
  Home,
  Image,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Moon,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";

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
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/website-generator", label: "Websites", icon: Globe },
    { path: "/image-generator", label: "Images", icon: Image },
    { path: "/mailer", label: "Email", icon: Mail },
    { path: "/chatbot", label: "AI Chat", icon: Bot },
    { path: "/community", label: "Community", icon: Users },
  ];

  // Get user display information
  const displayUser = user?.company || user;
  const userEmail = displayUser?.email || "User";
  const companyName =
    displayUser?.companyName || displayUser?.displayName || "Company";
  const companyInitial = companyName.charAt(0).toUpperCase();

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
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-colors duration-200 group-hover:bg-blue-700 dark:bg-blue-500 dark:group-hover:bg-blue-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
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
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                      location.pathname === item.path
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
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
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Credits Badge (Desktop) */}
            {isAuthenticated &&
              displayUser?.credits?.currentCredits !== undefined && (
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                  <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {displayUser.credits.currentCredits} credits
                  </span>
                </div>
              )}

            {/* User Avatar & Info (Desktop) */}
            {isAuthenticated && (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-9 h-9 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800 shadow-sm">
                  <span className="text-white text-sm font-bold">
                    {companyInitial}
                  </span>
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {companyName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                    {userEmail}
                  </div>
                </div>
              </div>
            )}

            {/* Hamburger Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl py-2 z-50 border border-slate-200 dark:border-slate-700 max-h-[80vh] overflow-y-auto animate-fade-in">
                  {isAuthenticated ? (
                    <>
                      {/* User Info Section */}
                      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70">
                        <div className="flex items-center space-x-3">
                          <div className="w-14 h-14 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-white text-xl font-bold">
                              {companyInitial}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {companyName}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                              {userEmail}
                            </div>
                            {displayUser?.businessType && (
                              <div className="inline-flex items-center mt-1.5 px-2 py-0.5 bg-blue-100 dark:bg-blue-500/15 rounded-full">
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
                        <div className="sm:hidden px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              Available Credits
                            </span>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                              <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {displayUser.credits.currentCredits}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation Items */}
                      <div className="py-2">
                        <div className="px-4 py-2">
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Navigation
                          </span>
                        </div>
                        {navItems.map((item) => (
                          <button
                            key={item.path}
                            onClick={() => handleNavigation(item.path)}
                            className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 transition-colors duration-200 ${
                              location.pathname === item.path
                                ? "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-r-4 border-blue-600"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                            }`}
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                            {location.pathname === item.path && (
                              <div className="ml-auto">
                                <ChevronRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Buy Credits Section */}
                      <div className="border-t border-slate-200 dark:border-slate-700 py-2">
                        <button
                          onClick={() => handleNavigation("/subscription")}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-center gap-3 transition-colors duration-200"
                        >
                          <CreditCard className="h-5 w-5" />
                          <span>Buy Credits</span>
                          <span className="ml-auto text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-full font-medium">
                            Get More
                          </span>
                        </button>
                      </div>

                      {/* Logout Section */}
                      <div className="border-t border-slate-200 dark:border-slate-700 py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 flex items-center gap-3 transition-colors duration-200"
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Login Section for Unauthenticated Users */
                    <div className="py-4 px-4">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                          <Sparkles className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          Welcome to Phoenix
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          AI-powered tools for your business
                        </p>
                      </div>
                      <button
                        onClick={handleLogin}
                        className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors duration-200 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
                      >
                        <LogIn className="h-4 w-4" />
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
