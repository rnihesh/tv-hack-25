// Environment-based configuration utility

/**
 * Get the API base URL based on the current environment
 * - Development (port 5173): Uses localhost:3000 backend
 * - Preview/Production: Uses the deployed render.com URL
 */
export const getApiBaseUrl = () => {
  // Check if we're in development mode (Vite dev server on port 5173)
  const isDevelopment =
    !import.meta.env.PROD &&
    window.location.hostname === "localhost" &&
    window.location.port === "5173";

  if (isDevelopment) {
    // Development environment - use local backend
    return import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  } else {
    // Production/Preview environment - use deployed backend
    return "https://phoenix-sol.onrender.com/api";
  }
};

/**
 * Get the server base URL (without /api) for file uploads and static assets
 */
export const getServerBaseUrl = () => {
  return getApiBaseUrl().replace("/api", "");
};

// Export the API URL for immediate use
export const API_BASE_URL = getApiBaseUrl();
export const SERVER_BASE_URL = getServerBaseUrl();

// Configuration object
export const config = {
  apiUrl: getApiBaseUrl(),
  serverUrl: getServerBaseUrl(),
  isProduction:
    import.meta.env.PROD ||
    window.location.hostname !== "localhost" ||
    window.location.port !== "5173",
  isDevelopment:
    !import.meta.env.PROD &&
    window.location.hostname === "localhost" &&
    window.location.port === "5173",
};

export default config;
