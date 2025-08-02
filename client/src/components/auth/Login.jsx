import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const Login = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await login(formData);

      if (!result.success) {
        setErrors({ general: result.message || "Login failed" });
      }
      // If successful, the AuthContext will handle the redirect
    } catch (error) {
      setErrors({ general: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🚀</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Sign in to your AI Digital Toolkit
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm transition-all duration-300">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                {errors.general}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.email
                      ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/20"
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/20"
                  } focus:outline-none focus:ring-2`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg transition-all duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.password
                      ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/20"
                      : "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-100 dark:focus:ring-blue-900/20"
                  } focus:outline-none focus:ring-2`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-3 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span>Sign in to Dashboard</span>
                    <svg
                      className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  Create one for free
                </button>
              </span>
            </div>
          </form>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl mb-2">🤖</div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              AI-Powered
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Lightning Fast
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Results Driven
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
