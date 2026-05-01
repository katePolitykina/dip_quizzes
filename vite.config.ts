import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const DEFAULT_BACKEND_HTTP_URL = 'http://localhost:8080'

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}

function toWebSocketTarget(httpUrl: string) {
  return httpUrl.replace(/^http/, 'ws')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendHttpUrl = trimTrailingSlash(env.VITE_API_BASE_URL || DEFAULT_BACKEND_HTTP_URL)
  const backendWsUrl = trimTrailingSlash(env.VITE_WS_BASE_URL || toWebSocketTarget(backendHttpUrl))

  return {
    plugins: [
      tailwindcss(),
      react()
    ],
    server: {
      proxy: {
        '/api': backendHttpUrl,
        '/ws': {
          target: backendWsUrl,
          ws: true,
        },
      },
    },
  }
})
