import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isAnalyze = mode === 'analyze';
  
  return {
    plugins: [
      react(),
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
      
      // Minify options
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: mode === 'production' ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          passes: 2,
        },
        mangle: {
          toplevel: true,
        },
      } : undefined,
      
      // Target modern browsers for smaller bundles
      target: 'es2015',
      
      // Optimize bundle splitting and tree shaking
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform') || id.includes('node_modules/zod')) {
              return 'form-vendor';
            }
            if (id.includes('node_modules/@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('node_modules/@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('node_modules/react-beautiful-dnd')) {
              return 'dnd-vendor';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'icons-vendor';
            }
            // Feature chunks
            if (id.includes('src/components/masters') || id.includes('src/hooks/masters') || id.includes('src/services/masters')) {
              return 'masters';
            }
            if (id.includes('src/components/warehouse') || id.includes('src/hooks/warehouse')) {
              return 'warehouse';
            }
            if (id.includes('src/components/inventory') || id.includes('src/hooks/inventory') || id.includes('src/services/inventory')) {
              return 'inventory';
            }
          },
        },
        treeshake: {
          moduleSideEffects: true,
          propertyReadSideEffects: true,
          unknownGlobalSideEffects: true,
        },
      },
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
      ],
      exclude: [
        // Exclude large dependencies from pre-bundling
        '@tanstack/react-virtual',
        'react-beautiful-dnd',
      ],
      // Force optimization of specific packages
      force: true,
      // Handle prop-types import issue
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
    },
  };
});
