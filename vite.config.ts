/// <reference types="vite/client" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { compression } from 'vite-plugin-compression2'
import * as workbox from 'workbox-build'

export default defineConfig(({ mode }) => {
  // Load env variables based on mode (development, production, etc.)
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  
  // Validate required environment variables
  const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
  const missingEnvVars = requiredEnvVars.filter(key => !env[key])
  
  if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`)
    if (isProduction) {
      throw new Error('Missing required environment variables for production build')
    }
  }
  
  return {
    plugins: [
      react(),
      // Add compression for production builds
      compression(),
      // TEMPORARILY DISABLE PWA PLUGIN TO FIX LOADING ISSUES
      // VitePWA({
      //   registerType: 'prompt',
      //   includeAssets: [
      //     'favicon.ico', 
      //     'apple-touch-icon.png', 
      //     'masked-icon.svg', 
      //     'offline.html',
      //     'manifest.json',
      //     'manifest.webmanifest',
      //     'pre-sw.js'
      //   ],
      //   // Use our custom service worker file
      //   strategies: 'injectManifest',
      //   srcDir: './',
      //   filename: 'src/sw.js',
      //   manifest: {
      //     name: env.VITE_APP_NAME || 'St. Trinity Food Pantry',
      //     short_name: 'St. Trinity',
      //     description: env.VITE_APP_DESCRIPTION || 'Client Management System for St. Trinity Food Pantry',
      //     theme_color: env.VITE_PWA_THEME_COLOR || '#2E3766',
      //     background_color: '#ffffff',
      //     display: 'standalone',
      //     start_url: '/',
      //     orientation: 'portrait',
      //     icons: [
      //       {
      //         src: '/icons/icon-192x192.png',
      //         sizes: '192x192',
      //         type: 'image/png'
      //       },
      //       {
      //         src: '/icons/icon-512x512.png',
      //         sizes: '512x512',
      //         type: 'image/png'
      //       },
      //       {
      //         src: '/icons/pwa-512x512.png',
      //         sizes: '512x512',
      //         type: 'image/png',
      //         purpose: 'any maskable'
      //       }
      //     ]
      //   },
      //   devOptions: {
      //     enabled: true, // Enable PWA in development for testing
      //     type: 'module',
      //     navigateFallback: 'index.html',
      //     suppressWarnings: true // Suppress warnings in development
      //   },
      //   // Customize the logging
      //   injectManifest: {
      //     maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      //     globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
      //     globIgnores: [
      //       '**/@vite/client*',
      //       '**/@react-refresh*',
      //       '**/src/main.tsx*',
      //       '**/src/registerSW.ts*',
      //       '**/@vite-plugin-pwa*',
      //       '**/node_modules/**'
      //     ]
      //   },
      //   workbox: {
      //     globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
      //     navigateFallback: '/index.html',
      //     navigateFallbackDenylist: [/^\/api/, /\.[^.]+$/],
      //     globIgnores: [
      //       '**/@vite/client*',
      //       '**/@react-refresh*',
      //       '**/src/main.tsx*',
      //       '**/src/registerSW.ts*',
      //       '**/@vite-plugin-pwa*',
      //       '**/node_modules/**'
      //     ],
      //     skipWaiting: true,
      //     clientsClaim: true,
      //     cleanupOutdatedCaches: true,
      //     offlineGoogleAnalytics: false,
      //     // Explicitly add additional items to precache
      //     additionalManifestEntries: [
      //       { url: '/', revision: null },
      //       { url: '/index.html', revision: null },
      //       { url: '/manifest.json', revision: null },
      //       { url: '/manifest.webmanifest', revision: null },
      //       { url: '/offline.html', revision: null }
      //     ],
      //     runtimeCaching: [
      //       {
      //         // Cache the app shell for offline access
      //         urlPattern: /^\/(?!api|.*\.[^.]+$).*/,
      //         handler: 'StaleWhileRevalidate',
      //         options: {
      //           cacheName: 'app-shell',
      //           expiration: {
      //             maxEntries: 1,
      //             maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
      //           },
      //           cacheableResponse: {
      //             statuses: [0, 200]
      //           }
      //         }
      //       },
      //       {
      //         // Handle resource requests with a custom fallback strategy
      //         urlPattern: ({ url }) => url.pathname.endsWith('.html') || 
      //                               url.pathname === '/' ||
      //                               url.pathname === '/index.html',
      //         handler: 'NetworkFirst',
      //         options: {
      //           cacheName: 'html-cache',
      //           expiration: {
      //             maxEntries: 10,
      //             maxAgeSeconds: 60 * 60 * 24 // 24 hours
      //           },
      //           networkTimeoutSeconds: 3,
      //           cacheableResponse: {
      //             statuses: [0, 200]
      //           },
      //           // This ensures we can use cached resources when offline
      //           plugins: [{
      //             // Fallback to index.html if network request fails and it's not in cache
      //             handlerDidError: async () => {
      //               try {
      //                 // First try to use the cached index.html
      //                 const cachedIndex = await caches.match('/index.html');
      //                 if (cachedIndex) return cachedIndex;
      //                 
      //                 // If index.html isn't cached, use the offline page
      //                 return await caches.match('/offline.html');
      //               } catch (error) {
      //                 // Final fallback if all else fails
      //                 return await caches.match('/offline.html');
      //               }
      //             }
      //           }]
      //         }
      //       },
      //       {
      //         // Cache all navigation requests (pages/routes)
      //         urlPattern: ({ request }) => request.mode === 'navigate',
      //         handler: 'NetworkFirst',
      //         options: {
      //           cacheName: 'pages-cache',
      //           expiration: {
      //             maxEntries: 50,
      //             maxAgeSeconds: 24 * 60 * 60 // 24 hours
      //           },
      //           networkTimeoutSeconds: 3,
      //           cacheableResponse: {
      //             statuses: [0, 200]
      //           }
      //         }
      //       },
      //       {
      //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      //         handler: 'CacheFirst',
      //         options: {
      //           cacheName: 'google-fonts-cache',
      //           expiration: {
      //             maxEntries: 10,
      //             maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      //           },
      //           cacheableResponse: {
      //             statuses: [0, 200]
      //           }
      //         }
      //       },
      //       {
      //         urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      //         handler: 'CacheFirst',
      //         options: {
      //           cacheName: 'gstatic-fonts-cache',
      //           expiration: {
      //             maxEntries: 10,
      //             maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      //           },
      //           cacheableResponse: {
      //             statuses: [0, 200]
      //           }
      //         }
      //       },
      //       {
      //         urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      //         handler: 'CacheFirst',
      //         options: {
      //           cacheName: 'images',
      //           expiration: {
      //             maxEntries: 60,
      //             maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      //           }
      //         }
      //       },
      //       {
      //         urlPattern: /manifest\.json$/,
      //         handler: 'StaleWhileRevalidate',
      //         options: {
      //           cacheName: 'manifest',
      //           expiration: {
      //             maxAgeSeconds: 60 * 60 * 24 // 24 hours
      //           },
      //           cacheableResponse: {
      //             statuses: [0, 200]
      //           }
      //         }
      //       },
      //       {
      //         urlPattern: /\/manifest\.webmanifest$/,
      //         handler: 'StaleWhileRevalidate',
      //         options: {
      //           cacheName: 'manifest',
      //           expiration: {
      //             maxAgeSeconds: 60 * 60 * 24 // 24 hours
      //           },
      //           cacheableResponse: {
      //             statuses: [0, 200]
      //           }
      //         }
      //       },
      //       // Development mode resources that need special handling
      //       {
      //         urlPattern: ({ url }) => {
      //           const paths = [
      //             '/@vite/client',
      //             '/@react-refresh',
      //             '/src/main.tsx',
      //             '/src/registerSW.ts',
      //             '/@vite-plugin-pwa/pwa-entry-point-loaded'
      //           ];
      //           return paths.some(path => url.pathname.includes(path));
      //         },
      //         handler: 'StaleWhileRevalidate',
      //         options: {
      //           cacheName: 'dev-resources',
      //           expiration: {
      //             maxEntries: 20,
      //             maxAgeSeconds: 24 * 60 * 60 // 24 hours
      //           },
      //           // In offline mode, allow fallbacks
      //           plugins: [{
      //             handlerDidError: async () => {
      //               // Return an empty response rather than failing
      //               return new Response('', { 
      //                 status: 200,
      //                 headers: { 'Content-Type': 'application/javascript' }
      //               });
      //             }
      //           }]
      //         }
      //       },
      //       {
      //         urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      //         handler: 'NetworkFirst',
      //         options: {
      //           cacheName: 'api-cache',
      //           networkTimeoutSeconds: 5,
      //           expiration: {
      //             maxEntries: 200,
      //             maxAgeSeconds: 24 * 60 * 60 // 24 hours
      //           },
      //           cacheableResponse: {
      //             statuses: [0, 200]
      //           },
      //           matchOptions: {
      //             ignoreSearch: true,  // Ignore query parameters in the URL
      //             ignoreVary: true     // Ignore the Vary header
      //           },
      //           fetchOptions: {
      //             credentials: 'include' // Include credentials in the request
      //           }
      //         }
      //       }
      //     ]
      //   }
      // })
    ],
    build: {
      sourcemap: !isProduction, // Only generate sourcemaps for development
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      } : undefined,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@mui/material', '@mui/icons-material']
          }
        }
      }
    },
    server: {
      port: 5174,
      strictPort: true,
      headers: isProduction ? {
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      } : undefined
    }
  }
}) 