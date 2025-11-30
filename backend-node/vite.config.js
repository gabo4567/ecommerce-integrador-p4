import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge'
import { fileURLToPath } from 'node:url'
import { dirname, resolve as pathResolve } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: { sourcemap: 'hidden' },
  plugins: [
    react({
      babel: { plugins: ['react-dev-locator'] },
    }),
    traeBadgePlugin({ variant: 'dark', position: 'bottom-right', prodOnly: true, clickable: true, clickUrl: 'https://www.trae.ai/solo?showJoin=1', autoTheme: true, autoThemeTarget: '#root' }),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '@': pathResolve(root, 'src'),
    },
  },
})

