import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/Real-Time-Chat-App/", // 🔥 IMPORTANT for GitHub Pages
  plugins: [react()],
});
