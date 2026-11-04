const CACHE_NAME = 'studytrack-f664b328e66b';
const APP_SHELL = [
  './',
  './index.html',
  './styles/tokens.css',
  './styles/fonts.css',
  './fonts/fraunces-latin-opsz-normal.woff2',
  './fonts/ibm-plex-sans-latin-400-normal.woff2',
  './fonts/ibm-plex-sans-latin-500-normal.woff2',
  './fonts/ibm-plex-sans-latin-600-normal.woff2',
  './fonts/ibm-plex-mono-latin-400-normal.woff2',
  './fonts/ibm-plex-mono-latin-600-normal.woff2',
  './styles/tailwind.css?v=f664b328e66b',
  './styles/app.css?v=f664b328e66b',
  './styles/print.css',
  './src/theme-bootstrap.js',
  './src/app.bundle.js?v=f664b328e66b',
  './src/report.bundle.js?v=f664b328e66b',
  './src/exam-catalog.bundle.js?v=f664b328e66b',
  './src/help.bundle.js?v=f664b328e66b',
  './src/demo.bundle.js?v=f664b328e66b',
  './src/pwa.js',
  './manifest.webmanifest',
  './icons/app-icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', event =>
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
);

self.addEventListener('activate', event =>
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
);

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin)
    return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)));
        }
        return response;
      });
      return cached ? (event.waitUntil(network.catch(() => null)), cached) : network;
    })
  );
});
