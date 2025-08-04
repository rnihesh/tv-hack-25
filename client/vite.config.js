import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: (process.env.VITE_API_URL || "http://localhost:3000").replace(
          "/api",
          ""
        ),
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
