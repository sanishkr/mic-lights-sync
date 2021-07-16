const withOffline = require('next-offline')

const nextConfig = {
  reactStrictMode: true,
  target: 'serverless',
  // dontAutoRegisterSw: true,
  // devSwSrc: 'public/service-worker.js',
  generateInDevMode: true,
  generateSw: true,
  workboxOpts: {
    swDest: 'static/service-worker.js',
    runtimeCaching: [
      {
        urlPattern: /\.css$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cached-css',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      {
        urlPattern: /https:\/\/www.google-analytics.com\/.*\.(?:js)/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'google-analytics',
          expiration: {
            maxEntries: 1,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /\.(png|svg|jpg|jpeg|ico)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cached-images',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 15 * 24 * 60 * 60, // 15 days
          },
        },
      },
      {
        urlPattern: /\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'https-calls',
          networkTimeoutSeconds: 15,
          expiration: {
            maxEntries: 150,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 1 month
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
}

module.exports = withOffline(nextConfig);