import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Read proxy target from env, default to IPv4 loopback
const API_PROXY_TARGET =
  process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:5000";

export default defineConfig(({ mode }) => ({
  server: {
    // Bind to all interfaces (IPv4 + IPv6); friendlier than "::" across OSes
    host: true,
    port: 8080,
    strictPort: true,

    // Helpful when testing on LAN devices
    // hmr: { host: 'localhost', protocol: 'ws' },

    proxy: {
      "/api": {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
        ws: true,
        // Optional: strip a leading /api if your backend doesn't include it
        // rewrite: (path) => path.replace(/^\/api/, ""),

        // Tiny logger to surface proxy issues in the console
        configure: (proxy) => {
          proxy.on("error", (err, _req, _res) => {
            console.error("[vite-proxy] ERROR:", err.message);
          });
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log(
              `[vite-proxy] ${req.method} ${req.url} -> ${API_PROXY_TARGET}`
            );
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log(
              `[vite-proxy] ${proxyRes.statusCode} ${req.method} ${req.url}`
            );
          });
        },
      },
    },
  },

  build: {
    // Generate unique hashes for each build to bust cache
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
