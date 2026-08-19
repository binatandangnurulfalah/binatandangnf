import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const remoteLogoUrl = 'https://msymqqryppgohsjmdbeo.supabase.co/storage/v1/object/public/LogoYayasan/LogoYayasan.svg?v=2'
const localLogoUrl = '/logo-yayasan.svg'

export default defineConfig({
  // Relative asset paths work on both Cloudflare root domains and GitHub Pages subpaths.
  base: './',
  plugins: [
    react(),
    {
      name: 'use-local-yayasan-logo',
      transform(code, id) {
        if (id.endsWith('/src/public.jsx')) {
          return code.replaceAll(remoteLogoUrl, localLogoUrl)
        }
        return null
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
})
