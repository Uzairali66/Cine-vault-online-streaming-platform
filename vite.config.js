import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    // Use build.rolldownOptions (RolldownOptions pass-through) instead of deprecated
    // build.rollupOptions, because Vite 8 strips the `output` property from the
    // environment-level rollupOptions before passing to Rolldown.
    rolldownOptions: {
      output: {
        // Rolldown-native codeSplitting.groups is the correct API.
        // manualChunks is deprecated and IGNORED when codeSplitting is enabled (default: true).
        codeSplitting: {
          // IMPORTANT: Set to false so that dependencies of matched modules are NOT
          // recursively included with the group's priority. Otherwise, AuthContext's
          // dependency on `react` would pull React into shared-core (priority 2),
          // beating vendor-react (priority 1).
          includeDependenciesRecursively: false,

          groups: [
            // ===== APP-SPECIFIC SHARED CHUNKS (highest priority) =====
            {
              name: 'shared-core',
              test(id) {
                return id.includes('/context/AuthContext') || id.includes('/components/SEO');
              },
              priority: 2,
            },
            {
              name: 'shared-ui',
              test(id) {
                return id.includes('/components/Header') || id.includes('/components/Footer') || id.includes('/components/Spinner') || id.includes('/components/AdBanner');
              },
              priority: 2,
            },

            // ===== VENDOR CHUNKS (medium priority) =====
            // React ecosystem: react, react-dom, react-helmet-async and its deps
            // (react-fast-compare, invariant, shallowequal), react-router, react-use, scheduler
            // MUST be grouped together to avoid splitting React across chunks
            {
              name: 'vendor-react',
              test(id) {
                if (!id.includes('node_modules')) return false;
                return id.includes('react') || id.includes('react-dom') || id.includes('react-helmet-async') || id.includes('react-router') || id.includes('react-use') || id.includes('react-fast-compare') || id.includes('invariant') || id.includes('shallowequal') || id.includes('scheduler');
              },
              priority: 1,
            },
            {
              name: 'vendor-video',
              test(id) {
                return id.includes('node_modules') && id.includes('hls.js');
              },
              priority: 1,
            },
            {
              name: 'vendor-appwrite',
              test(id) {
                return id.includes('node_modules') && (id.includes('appwrite') || id.includes('json-bigint') || id.includes('bignumber.js'));
              },
              priority: 1,
            },

            // ===== CATCH-ALL VENDOR (lowest priority) =====
            {
              name: 'vendor-other',
              test(id) {
                return id.includes('node_modules');
              },
              priority: 0,
            },
          ],
        },
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Enable sourcemaps temporarily for debugging
    sourcemap: true,
    // Chunk size warning limit (raised for modern apps)
    chunkSizeWarningLimit: 300,
  },

  // Optimize deps pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'hls.js'],
  },
})
