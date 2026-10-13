import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: Number(env.WEB_PORT || 3002),
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://127.0.0.1:8001",
          changeOrigin: true
        }
      }
    }
  };
});
