import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const useLocalAuth = process.env.VITE_USE_LOCAL_AUTH === 'true';
  const upstreamUrl = useLocalAuth
    ? `http://localhost:${process.env.AUTH_SERVER_PORT || '3001'}`
    : process.env.API_UPSTREAM_URL;

  if (!upstreamUrl) {
    console.warn('API_UPSTREAM_URL is not set; /api.php requests will return a proxy error.');
  }

  return {
    server: {
      host: '::',
      port: 8080,
      hmr: false,
      proxy: {
        '/api.php': {
          target: upstreamUrl || 'http://127.0.0.1:9',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
      VitePWA({
        manifest: {
          name: 'Helix General Hardware',
          short_name: 'Helix Hardware',
          description: 'Trusted supplier of general hardware and supplies',
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          runtimeCaching: [{
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          }],
          skipWaiting: true,
          clientsClaim: true,
        },
        devOptions: { enabled: true, navigateFallback: 'index.html', suppressWarnings: true },
      }),
    ].filter(Boolean),
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
  };
});
