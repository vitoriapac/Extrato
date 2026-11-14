const CACHE_NAME = 'studytrack-d55e9df43434';
const APP_SHELL = [
  './',
  './app',
  './styles/tokens.css',
  './styles/fonts.css',
  './fonts/fraunces-latin-opsz-normal.woff2',
  './fonts/ibm-plex-sans-latin-400-normal.woff2',
  './fonts/ibm-plex-sans-latin-500-normal.woff2',
  './fonts/ibm-plex-sans-latin-600-normal.woff2',
  './fonts/ibm-plex-mono-latin-400-normal.woff2',
  './fonts/ibm-plex-mono-latin-600-normal.woff2',
  './styles/tailwind.css?v=d55e9df43434',
  './styles/app.css?v=d55e9df43434',
  './styles/print.css',
  './src/theme-bootstrap.js',
  './src/app.bundle.js?v=d55e9df43434',
  './src/report.bundle.js?v=d55e9df43434',
  './src/exam-catalog.bundle.js?v=d55e9df43434',
  './src/help.bundle.js?v=d55e9df43434',
  './src/demo.bundle.js?v=d55e9df43434',
  './src/pwa.js',
  './src/landing.bundle.js?v=d55e9df43434',
  './manifest.webmanifest',
  './icons/app-icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './assets/achievements/allsubjects.png',
  './assets/achievements/coverage50.png',
  './assets/achievements/criticalCoverage.png',
  './assets/achievements/firstSession.png',
  './assets/achievements/hours10.png',
  './assets/achievements/hours100.png',
  './assets/achievements/hours50.png',
  './assets/achievements/mappedExam.png',
  './assets/achievements/q100.png',
  './assets/achievements/q1000.png',
  './assets/achievements/q500.png',
  './assets/achievements/recommendation1.png',
  './assets/achievements/recommendationPositive.png',
  './assets/achievements/reviews25.png',
  './assets/achievements/sim1.png',
  './assets/achievements/sim5.png',
  './assets/achievements/strategist.png',
  './assets/achievements/streak14.png',
  './assets/achievements/streak3.png',
  './assets/achievements/streak30.png',
  './assets/achievements/streak7.png',
  './assets/achievements/subject100.png',
  './assets/achievements/topics10.png',
  './assets/achievements/topics50.png',
];

self.addEventListener('install', event =>
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL.map(url => new Request(url, { cache: 'reload' }))))
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
    const url = new URL(event.request.url);
    event.respondWith(fetch(event.request).catch(() => {
      if (url.pathname === '/app/') {
        url.pathname = '/app';
        return Response.redirect(url.href, 308);
      }
      return caches.match(url.pathname === '/app' ? './app' : './');
    }));
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
