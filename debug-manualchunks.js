// Quick debug plugin to log all module IDs passed to manualChunks
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

const logFile = 'manualchunks-ids.log'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          fs.appendFileSync(logFile, id + '\n')
          // Original logic
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          if (id.includes('hls.js')) {
            return 'vendor-video';
          }
          if (id.includes('react-use') || id.includes('react-helmet-async')) {
            return 'vendor-ui';
          }
          if (id.includes('appwrite')) {
            return 'vendor-appwrite';
          }
          if (id.includes('/context/AuthContext') || id.includes('/components/SEO')) {
            return 'shared-core';
          }
          if (id.includes('/components/Header') || id.includes('/components/Footer') || id.includes('/components/Spinner') || id.includes('/components/AdBanner')) {
            return 'shared-ui';
          }
        },
      },
    },
    sourcemap: false,
    chunkSizeWarningLimit: 300,
  },
})