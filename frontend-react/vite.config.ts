import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const rootDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(rootDir, '..')
const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8')) as {
  version?: string
}

function readRepoVersion(): string {
  try {
    return readFileSync(resolve(repoRoot, 'VERSION'), 'utf-8').trim()
  } catch {
    return ''
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  const appVersion =
    env.VITE_APP_VERSION?.trim() || readRepoVersion() || pkg.version || '2.1.0'

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/storage': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
