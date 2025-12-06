import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default ({ mode }) => {
  const root = path.resolve(__dirname, "..");
  const env = loadEnv(mode, root, "");
  const apiUrl = env.VITE_API_URL || "http://127.0.0.1:9090/api";
  const defaultTarget = "http://127.0.0.1:9090";
  const proxyTarget = (() => {
    // If apiUrl is absolute (http/https), strip trailing /api and use that.
    if (/^https?:\/\//i.test(apiUrl)) {
      const stripped = apiUrl.replace(/\/?api\/?$/, "");
      return stripped || defaultTarget;
    }
    // If apiUrl is relative (/api), fall back to local dev server target.
    return defaultTarget;
  })();

  return defineConfig({
    plugins: [react()],
    envDir: root,
    server: {
      host: true,
      port: 5174,
      strictPort: false,
      cors: true,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        }
      }
    },
    preview: {
      host: true,
      port: 4174
    }
  });
};
