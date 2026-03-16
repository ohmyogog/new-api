import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
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
        target: 'https://ogog.ai',
        changeOrigin: true,
        secure: true,
        headers: {
          cookie: 'session=MTc3MzU4NDU0NHxEWDhFQVFMX2dBQUJFQUVRQUFEX3F2LUFBQVlHYzNSeWFXNW5EQXNBQ1hSMWNtNXpkR2xzWlFSaWIyOXNBZ0lBQVFaemRISnBibWNNQkFBQ2FXUURhVzUwQkFJQUNBWnpkSEpwYm1jTUNnQUlkWE5sY201aGJXVUdjM1J5YVc1bkRBWUFCR05vWVc4R2MzUnlhVzVuREFZQUJISnZiR1VEYVc1MEJBSUFGQVp6ZEhKcGJtY01DQUFHYzNSaGRIVnpBMmx1ZEFRQ0FBSUdjM1J5YVc1bkRBY0FCV2R5YjNWd0JuTjBjbWx1Wnd3SkFBZGtaV1poZFd4MHyeXiqmqVWwjNmDancmTikbInUXdVMrcd7I3UIEtE_1Zg==',
        },
      },
      '/mj': {
        target: 'https://ogog.ai',
        changeOrigin: true,
        secure: true,
        headers: {
          cookie: 'session=MTc3MzU4NDU0NHxEWDhFQVFMX2dBQUJFQUVRQUFEX3F2LUFBQVlHYzNSeWFXNW5EQXNBQ1hSMWNtNXpkR2xzWlFSaWIyOXNBZ0lBQVFaemRISnBibWNNQkFBQ2FXUURhVzUwQkFJQUNBWnpkSEpwYm1jTUNnQUlkWE5sY201aGJXVUdjM1J5YVc1bkRBWUFCR05vWVc4R2MzUnlhVzVuREFZQUJISnZiR1VEYVc1MEJBSUFGQVp6ZEhKcGJtY01DQUFHYzNSaGRIVnpBMmx1ZEFRQ0FBSUdjM1J5YVc1bkRBY0FCV2R5YjNWd0JuTjBjbWx1Wnd3SkFBZGtaV1poZFd4MHyeXiqmqVWwjNmDancmTikbInUXdVMrcd7I3UIEtE_1Zg==',
        },
      },
      '/pg': {
        target: 'https://ogog.ai',
        changeOrigin: true,
        secure: true,
        headers: {
          cookie: 'session=MTc3MzU4NDU0NHxEWDhFQVFMX2dBQUJFQUVRQUFEX3F2LUFBQVlHYzNSeWFXNW5EQXNBQ1hSMWNtNXpkR2xzWlFSaWIyOXNBZ0lBQVFaemRISnBibWNNQkFBQ2FXUURhVzUwQkFJQUNBWnpkSEpwYm1jTUNnQUlkWE5sY201aGJXVUdjM1J5YVc1bkRBWUFCR05vWVc4R2MzUnlhVzVuREFZQUJISnZiR1VEYVc1MEJBSUFGQVp6ZEhKcGJtY01DQUFHYzNSaGRIVnpBMmx1ZEFRQ0FBSUdjM1J5YVc1bkRBY0FCV2R5YjNWd0JuTjBjbWx1Wnd3SkFBZGtaV1poZFd4MHyeXiqmqVWwjNmDancmTikbInUXdVMrcd7I3UIEtE_1Zg==',
        },
      },
    },
  },
})
