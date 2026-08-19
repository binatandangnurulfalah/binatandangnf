import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  base: '/binatandangnf/',
  plugins: [
    react(),
    {
      name: 'fix-admin-link',
      generateBundle(_, bundle) {
        for (const item of Object.values(bundle)) {
          if (item.type === 'asset' && typeof item.source === 'string') {
            item.source = item.source.replaceAll('./admin.html', './admin/')
          }
          if (item.type === 'chunk') {
            item.code = item.code.replaceAll('./admin.html', './admin/')
          }
        }
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
})
