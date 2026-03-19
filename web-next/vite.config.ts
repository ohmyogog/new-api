import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function normalizeBasePath(basePath: string): string {
  if (!basePath) {
    return '/new/';
  }
  return basePath.endsWith('/') ? basePath : `${basePath}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appBasePath = normalizeBasePath(env.VITE_WEB_BASE_PATH || '/new/');
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3000';

  return {
    base: appBasePath,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return
            }

            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react'
            }

            if (id.includes('react-router')) {
              return 'vendor-router'
            }

            if (
              id.includes('@base-ui') ||
              id.includes('@floating-ui')
            ) {
              return 'vendor-ui'
            }

            if (
              id.includes('/recharts/') ||
              id.includes('/victory-vendor/') ||
              id.includes('/d3-') ||
              id.includes('/internmap/')
            ) {
              return 'vendor-charts'
            }

            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }

            if (id.includes('axios')) {
              return 'vendor-network'
            }

            if (id.includes('react-hot-toast')) {
              return 'vendor-feedback'
            }

            return 'vendor'
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/mj': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/pg': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
