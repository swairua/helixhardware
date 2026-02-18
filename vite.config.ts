import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use local auth server for development if VITE_USE_LOCAL_AUTH is set
  const useLocalAuth = process.env.VITE_USE_LOCAL_AUTH === 'true';

  // API configuration - prioritize environment variable, fall back to relative /api.php
  let apiUrl: string;

  if (useLocalAuth) {
    // Local auth server mode - use localhost:3001
    apiUrl = 'http://localhost:3001';
    console.log('✅ Using LOCAL authentication server at http://localhost:3001');
  } else if (process.env.VITE_EXTERNAL_API_URL) {
    // Use explicitly configured external API URL
    apiUrl = process.env.VITE_EXTERNAL_API_URL;
    // Remove trailing /api.php if present (we'll add it back in proxy config)
    apiUrl = apiUrl.replace(/\/api\.php$/, '');
    console.log(`🌐 Using EXTERNAL API configured via VITE_EXTERNAL_API_URL: ${apiUrl}/api.php`);
  } else {
    // Default: use relative /api.php (works on any locally running server)
    apiUrl = '';
    console.log(`📍 Using relative API endpoint: /api.php (will connect to current hostname)`);
  }

  const apiEndpoint = apiUrl ? `${apiUrl}/api.php` : '/api.php';

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: false,
      // SPA routing fallback: serve index.html for all non-file requests
      // This ensures page refresh works on nested routes without 404
      middlewareMode: false,
      proxy: {
        // ===== CRITICAL: Proxy /api.php requests (document number generation, etc.) =====
        // Document numbering and other API calls go directly to /api.php
        // ALWAYS active to handle local backend calls
        '/api.php': {
          target: apiUrl || 'http://localhost', // Use external API if configured, else local
          changeOrigin: true,
          rewrite: (path) => {
            // Keep /api.php as-is, just forward to backend
            return path;
          },
          secure: false,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`📡 [API.PHP] Proxying: ${req.method} ${req.url}`);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log(`✅ [API.PHP] Response: ${proxyRes.statusCode}`);
            });
            proxy.on('error', (err, req, res) => {
              console.error(`❌ [API.PHP] Proxy error: ${err.message}`);
            });
          }
        },

        // ===== CRITICAL: Proxy all /proxy routes to bypass CORS =====
        // This acts as a bridge between frontend and backend
        ...(apiUrl ? {
          '/proxy': {
            target: apiUrl,
            changeOrigin: true,
            pathRewrite: {
              '^/proxy': '', // Remove /proxy prefix to make clean request to backend
            },
            secure: false,
            ws: false,
            configure: (proxy, options) => {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                // Add debugging
                console.log(`🔗 Proxying: ${req.method} ${req.url} → ${apiUrl}${req.url.replace('/proxy', '')}`);
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                // Log response
                console.log(`✅ Proxy response: ${proxyRes.statusCode}`);
              });
              proxy.on('error', (err, req, res) => {
                console.error(`❌ Proxy error: ${err.message}`);
              });
            }
          }
        } : {}),

        // File upload requests - forward to main API (preserve path for upload detection)
        ...(apiUrl ? {
          '/api/uploads': {
            target: apiUrl,
            changeOrigin: true,
            rewrite: (path) => path, // Keep the path as-is so the backend recognizes it as upload
          }
        } : {}),

        // Logo/file upload endpoint
        ...(apiUrl ? {
          '/api/upload_file': {
            target: apiUrl,
            changeOrigin: true,
            pathRewrite: {
              '^/api/upload_file': '/api.php?action=upload_file', // Rewrite to backend endpoint
            },
            secure: false,
            configure: (proxy, options) => {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                console.log(`📤 [UPLOAD] ${req.method} ${req.url}`);
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log(`✅ [UPLOAD] Response: ${proxyRes.statusCode}`);
              });
              proxy.on('error', (err, req, res) => {
                console.error(`❌ [UPLOAD] Proxy error: ${err.message}`);
              });
            }
          }
        } : {}),

        // Proxy API requests to external backend or local server
        // ALWAYS active to handle all /api requests
        '/api': {
          target: apiUrl || 'http://localhost', // Use external API if configured, else local
          changeOrigin: true,
          rewrite: (path) => {
            // Skip file uploads - keep as /api/uploads
            if (path.startsWith('/api/uploads')) {
              return path;
            }
            // For query string requests: /api?action=X → /api.php?action=X
            if (path.includes('?')) {
              const rewritten = path.replace('/api?', '/api.php?');
              console.log(`🔄 Rewrite: ${path} → ${rewritten}`);
              return rewritten;
            }
            // For path-based requests: /api/upload_file → /api.php/upload_file
            if (path.startsWith('/api/')) {
              return '/api.php' + path.substring(4);
            }
            // Just /api → /api.php
            return '/api.php';
          },
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`📡 Proxying: ${req.method} ${req.url}`);

              // Log authorization header for debugging
              if (req.headers.authorization) {
                console.log(`🔐 Authorization header: ${req.headers.authorization.substring(0, 30)}...`);
              } else {
                console.log(`⚠️  No Authorization header present`);
              }
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log(`✅ Response: ${proxyRes.statusCode}`);
            });
            proxy.on('error', (err, req, res) => {
              console.error(`❌ Proxy error: ${err.message}`);
            });
          },
        },

        ...(apiUrl ? {
          '/api/db': {
            target: apiUrl,
            changeOrigin: true,
            rewrite: (path) => {
              // Convert /api/db/* paths to API calls
              const pathParts = path.replace('/api/db', '').split('/').filter(Boolean);
              if (pathParts.length === 0) return '/?action=health';

              // Handle different endpoint patterns
              const [resource, action, id] = pathParts;
              if (resource === 'health') return '/?action=health';
              if (resource === 'auth-context') return `/?action=check_auth`;
              if (resource === 'select' && action) return `/?action=read&table=${action}`;
              if (resource === 'select-one' && action && id) return `/?action=read&table=${action}&where={"id":"${id}"}`;
              if (resource === 'insert' && action) return `/?action=create&table=${action}`;
              if (resource === 'insert-many' && action) return `/?action=create&table=${action}`;
              if (resource === 'update' && action && id) return `/?action=update&table=${action}&where={"id":"${id}"}`;
              if (resource === 'update-many' && action) return `/?action=update&table=${action}`;
              if (resource === 'delete' && action && id) return `/?action=delete&table=${action}&where={"id":"${id}"}`;
              if (resource === 'delete-many' && action) return `/?action=delete&table=${action}`;
              if (resource === 'raw') return '/?action=raw';
              if (resource === 'auth') {
                if (action === 'can-read') return '/?action=check_auth';
                if (action === 'can-write') return '/?action=check_auth';
                if (action === 'can-delete') return '/?action=check_auth';
              }

              return path;
            },
          }
        } : {}),
      },
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Ensure build output is properly structured for SPA
    },
  };
});
