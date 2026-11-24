import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const replayQaPreview = env.VERCEL_ENV === 'preview'
    && env.VERCEL_GIT_COMMIT_REF === 'dev'
    && env.VITE_REPLAY_API_ENABLED === undefined
  return {
    define: replayQaPreview ? { 'import.meta.env.VITE_REPLAY_API_ENABLED': JSON.stringify('true') } : undefined,
    server: {
      proxy: {
        '/api/v1': {
          target: env.API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
