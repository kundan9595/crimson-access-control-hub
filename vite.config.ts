import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isAnalyze = mode === 'analyze';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: false,
        },
        workbox: {
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          // Activate new SW immediately so precache matches new hashed chunks (avoids
          // stale index + old icons-vendor / react-vendor mismatch after deploy).
          skipWaiting: true,
          clientsClaim: true,
        },
        includeAssets: ['favicon.ico', 'placeholder.svg', 'robots.txt', 'icon.svg', 'polyfills.js'],
        manifest: {
          name: 'ScottOne',
          short_name: 'ScottOne',
          description: 'A comprehensive access control and inventory management system',
          theme_color: '#dc2626',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'favicon.ico',
              sizes: '64x64 32x32 24x24 16x16',
              type: 'image/x-icon'
            },
            {
              src: 'icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: 'icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      }),
      // Fix react-is import issues
      {
        name: 'fix-react-is-imports',
        resolveId(source: string) {
          if (source === 'react-is') {
            return { id: path.resolve(__dirname, 'node_modules/react-is/index.js'), external: false };
          }
          return null;
        },
      },
      // Add bundle analyzer in analyze mode
      isAnalyze && {
        name: 'bundle-analyzer',
        apply: 'build' as const,
        generateBundle(options: any, bundle: any) {
          const { visualizer } = require('rollup-plugin-visualizer');
          return visualizer({
            filename: 'dist/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
          });
        },
      },
    ].filter(Boolean),

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Fix react-is version conflicts
        'react-is': path.resolve(__dirname, 'node_modules/react-is'),
        // Force react-redux to use the correct react-is version
        'react-redux/react-is': path.resolve(__dirname, 'node_modules/react-is'),
      },
    },

    build: {
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,

      // Enable source maps in development
      sourcemap: mode === 'development',

      // Optimize CSS
      cssCodeSplit: true,

      // Use esbuild for minification — more reliable than terser for complex bundles
      // and avoids TDZ/variable-mangling bugs that arise with terser's multi-pass compression.
      minify: mode === 'production' ? 'esbuild' : false,

      // Target modern browsers for smaller bundles
      target: 'es2015',

      // Optimize bundle splitting and tree shaking
      rollupOptions: {
        treeshake: {
          moduleSideEffects: true,
          propertyReadSideEffects: true,
          unknownGlobalSideEffects: true,
        },
      },
    },

    // Explicitly disable development JSX transform so esbuild always uses
    // react/jsx-runtime (jsx/jsxs) instead of react/jsx-dev-runtime (jsxDEV).
    // esbuild 0.20+ auto-enables jsxDev when NODE_ENV !== 'production', which
    // breaks production builds in environments like Vercel that set NODE_ENV=development.
    esbuild: {
      jsxDev: false,
    },

    // Development server optimization
    server: {
      port: 3000,
      host: true,
      // Enable HMR optimization
      hmr: {
        overlay: false,
      },
    },

    // Preview server
    preview: {
      port: 4173,
      host: true,
    },

    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@tanstack/react-query',
        '@supabase/supabase-js',
        'react-hook-form',
        '@hookform/resolvers',
        'zod',
        'lucide-react',
        'prop-types',
        'hoist-non-react-statics',
        'react-redux',
        'react-is',
        'react-beautiful-dnd',
      ],
      exclude: [
        // Exclude large dependencies from pre-bundling
        '@tanstack/react-virtual',
      ],
      // Force optimization of specific packages
      force: true,
      // Handle prop-types import issue and Node.js polyfills
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },

    // Define environment variables
    define: {
      __DEV__: mode === 'development',
      __PROD__: mode === 'production',
      // Fix prop-types import issue
      'process.env.NODE_ENV': JSON.stringify(mode),
      // Fix global is not defined error
      global: 'globalThis',
      // Fix process object issues
      'process.env': '{}',
      'process.version': '"v18.0.0"',
      'process.versions': '{}',
      'process.platform': '"browser"',
    },
  };
});
