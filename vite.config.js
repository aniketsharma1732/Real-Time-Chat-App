import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/real-time-chat-application/", // 🔥 IMPORTANT for GitHub Pages
  plugins: [react()],
});
