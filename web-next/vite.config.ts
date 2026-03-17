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
