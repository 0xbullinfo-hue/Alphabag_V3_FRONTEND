// vite.config.ts
import path from "path";
import dns from "dns";
import http from "http";
import https from "https";
import { defineConfig, loadEnv } from "file:///C:/Users/1/repos/Alphabag_V3_FRONTEND/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/1/repos/Alphabag_V3_FRONTEND/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/1/repos/Alphabag_V3_FRONTEND/node_modules/@tailwindcss/vite/dist/index.mjs";
import { nodePolyfills } from "file:///C:/Users/1/repos/Alphabag_V3_FRONTEND/node_modules/vite-plugin-node-polyfills/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\1\\repos\\Alphabag_V3_FRONTEND";
dns.setDefaultResultOrder("ipv4first");
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const devHost = env.VITE_DEV_HOST || "0.0.0.0";
  const devPort = Number(env.VITE_DEV_PORT || "3005");
  const proxyTarget = env.VITE_API_BASE_URL || "http://localhost:3003";
  const isProductionDeployment = mode === "production" && env.VITE_ENVIRONMENT === "production";
  if (isProductionDeployment) {
    if (!env.VITE_API_BASE_URL) {
      throw new Error("VITE_API_BASE_URL must be set for a production deployment.");
    }
    const apiUrl = new URL(env.VITE_API_BASE_URL);
    if (apiUrl.protocol !== "https:") {
      throw new Error("VITE_API_BASE_URL must use HTTPS for a production deployment.");
    }
  }
  const proxyAgent = proxyTarget.startsWith("https://") ? new https.Agent({ family: 4 }) : new http.Agent({ family: 4 });
  return {
    server: {
      port: devPort,
      strictPort: true,
      host: devHost,
      proxy: {
        "/api": {
          // VITE_API_BASE_URL is the single source of truth for the backend URL.
          // In dev: falls back to localhost backend to avoid accidental remote calls.
          // In prod: set VITE_API_BASE_URL to your deployed backend domain.
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          agent: proxyAgent
        }
      }
    },
    preview: {
      host: devHost,
      port: 4173,
      strictPort: true
    },
    plugins: [
      react(),
      tailwindcss(),
      nodePolyfills({
        include: ["buffer", "crypto", "stream", "util"],
        globals: { Buffer: true, global: true, process: true },
        protocolImports: true
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    esbuild: {
      drop: ["console", "debugger"]
    },
    build: {
      cssMinify: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            web3: ["wagmi", "viem", "@web3modal/wagmi"],
            walletconnect: ["@walletconnect/ethereum-provider"],
            recharts: ["recharts"],
            ui: ["lucide-react", "framer-motion", "sweetalert2"],
            ai: ["@google/genai"],
            query: ["@tanstack/react-query"]
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFwxXFxcXHJlcG9zXFxcXEFscGhhYmFnX1YzX0ZST05URU5EXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFwxXFxcXHJlcG9zXFxcXEFscGhhYmFnX1YzX0ZST05URU5EXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy8xL3JlcG9zL0FscGhhYmFnX1YzX0ZST05URU5EL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBkbnMgZnJvbSAnZG5zJztcclxuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XHJcbmltcG9ydCBodHRwcyBmcm9tICdodHRwcyc7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xyXG5pbXBvcnQgeyBub2RlUG9seWZpbGxzIH0gZnJvbSAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMnO1xyXG5cclxuZG5zLnNldERlZmF1bHRSZXN1bHRPcmRlcignaXB2NGZpcnN0Jyk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCAnLicsICcnKTtcclxuICBjb25zdCBkZXZIb3N0ID0gZW52LlZJVEVfREVWX0hPU1QgfHwgJzAuMC4wLjAnO1xyXG4gIGNvbnN0IGRldlBvcnQgPSBOdW1iZXIoZW52LlZJVEVfREVWX1BPUlQgfHwgJzMwMDUnKTtcclxuICBjb25zdCBwcm94eVRhcmdldCA9IGVudi5WSVRFX0FQSV9CQVNFX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDozMDAzJztcclxuICBjb25zdCBpc1Byb2R1Y3Rpb25EZXBsb3ltZW50ID0gbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nICYmIGVudi5WSVRFX0VOVklST05NRU5UID09PSAncHJvZHVjdGlvbic7XHJcblxyXG4gIGlmIChpc1Byb2R1Y3Rpb25EZXBsb3ltZW50KSB7XHJcbiAgICBpZiAoIWVudi5WSVRFX0FQSV9CQVNFX1VSTCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZJVEVfQVBJX0JBU0VfVVJMIG11c3QgYmUgc2V0IGZvciBhIHByb2R1Y3Rpb24gZGVwbG95bWVudC4nKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGFwaVVybCA9IG5ldyBVUkwoZW52LlZJVEVfQVBJX0JBU0VfVVJMKTtcclxuICAgIGlmIChhcGlVcmwucHJvdG9jb2wgIT09ICdodHRwczonKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignVklURV9BUElfQkFTRV9VUkwgbXVzdCB1c2UgSFRUUFMgZm9yIGEgcHJvZHVjdGlvbiBkZXBsb3ltZW50LicpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgcHJveHlBZ2VudCA9IHByb3h5VGFyZ2V0LnN0YXJ0c1dpdGgoJ2h0dHBzOi8vJylcclxuICAgID8gbmV3IGh0dHBzLkFnZW50KHsgZmFtaWx5OiA0IH0pXHJcbiAgICA6IG5ldyBodHRwLkFnZW50KHsgZmFtaWx5OiA0IH0pO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHBvcnQ6IGRldlBvcnQsXHJcbiAgICAgIHN0cmljdFBvcnQ6IHRydWUsXHJcbiAgICAgIGhvc3Q6IGRldkhvc3QsXHJcbiAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgICAvLyBWSVRFX0FQSV9CQVNFX1VSTCBpcyB0aGUgc2luZ2xlIHNvdXJjZSBvZiB0cnV0aCBmb3IgdGhlIGJhY2tlbmQgVVJMLlxyXG4gICAgICAgICAgLy8gSW4gZGV2OiBmYWxscyBiYWNrIHRvIGxvY2FsaG9zdCBiYWNrZW5kIHRvIGF2b2lkIGFjY2lkZW50YWwgcmVtb3RlIGNhbGxzLlxyXG4gICAgICAgICAgLy8gSW4gcHJvZDogc2V0IFZJVEVfQVBJX0JBU0VfVVJMIHRvIHlvdXIgZGVwbG95ZWQgYmFja2VuZCBkb21haW4uXHJcbiAgICAgICAgICB0YXJnZXQ6IHByb3h5VGFyZ2V0LFxyXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgICAgIGFnZW50OiBwcm94eUFnZW50XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcHJldmlldzoge1xyXG4gICAgICBob3N0OiBkZXZIb3N0LFxyXG4gICAgICBwb3J0OiA0MTczLFxyXG4gICAgICBzdHJpY3RQb3J0OiB0cnVlXHJcbiAgICB9LFxyXG4gICAgcGx1Z2luczogW1xyXG4gICAgICByZWFjdCgpLFxyXG4gICAgICB0YWlsd2luZGNzcygpLFxyXG4gICAgICBub2RlUG9seWZpbGxzKHtcclxuICAgICAgICBpbmNsdWRlOiBbJ2J1ZmZlcicsICdjcnlwdG8nLCAnc3RyZWFtJywgJ3V0aWwnXSxcclxuICAgICAgICBnbG9iYWxzOiB7IEJ1ZmZlcjogdHJ1ZSwgZ2xvYmFsOiB0cnVlLCBwcm9jZXNzOiB0cnVlIH0sXHJcbiAgICAgICAgcHJvdG9jb2xJbXBvcnRzOiB0cnVlLFxyXG4gICAgICB9KVxyXG4gICAgXSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgZXNidWlsZDoge1xyXG4gICAgICBkcm9wOiBbJ2NvbnNvbGUnLCAnZGVidWdnZXInXSxcclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICBjc3NNaW5pZnk6IGZhbHNlLFxyXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDE1MDAsXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgICB2ZW5kb3I6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcclxuICAgICAgICAgICAgd2ViMzogWyd3YWdtaScsICd2aWVtJywgJ0B3ZWIzbW9kYWwvd2FnbWknXSxcclxuICAgICAgICAgICAgd2FsbGV0Y29ubmVjdDogWydAd2FsbGV0Y29ubmVjdC9ldGhlcmV1bS1wcm92aWRlciddLFxyXG4gICAgICAgICAgICByZWNoYXJ0czogWydyZWNoYXJ0cyddLFxyXG4gICAgICAgICAgICB1aTogWydsdWNpZGUtcmVhY3QnLCAnZnJhbWVyLW1vdGlvbicsICdzd2VldGFsZXJ0MiddLFxyXG4gICAgICAgICAgICBhaTogWydAZ29vZ2xlL2dlbmFpJ10sXHJcbiAgICAgICAgICAgIHF1ZXJ5OiBbJ0B0YW5zdGFjay9yZWFjdC1xdWVyeSddXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMlMsT0FBTyxVQUFVO0FBQzVULE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7QUFDakIsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsY0FBYyxlQUFlO0FBQ3RDLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixTQUFTLHFCQUFxQjtBQVA5QixJQUFNLG1DQUFtQztBQVN6QyxJQUFJLHNCQUFzQixXQUFXO0FBRXJDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVB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
