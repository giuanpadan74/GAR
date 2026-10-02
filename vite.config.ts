import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
      server: {
        port: 2001,
        strictPort: false,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              supabase: ['@supabase/supabase-js'],
              mapbox: ['mapbox-gl', 'maplibre-gl', 'react-map-gl'],
              charts: ['recharts'],
              ui: ['lucide-react']
            }
          }
        }
      }
    };
});
