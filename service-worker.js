const CACHE_NAME = 'studytrack-3370af232b03';
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
  './styles/tailwind.css?v=3370af232b03',
  './styles/app.css?v=3370af232b03',
  './styles/print.css',
  './src/theme-bootstrap.js',
  './src/app.bundle.js?v=3370af232b03',
  './src/report.bundle.js?v=3370af232b03',
  './src/exam-catalog.bundle.js?v=3370af232b03',
  './src/help.bundle.js?v=3370af232b03',
  './src/demo.bundle.js?v=3370af232b03',
  './src/pwa.js',
  './src/landing.bundle.js?v=3370af232b03',
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
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME && key !== REMINDER_CACHE)
            .map(key => caches.delete(key))
        )
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

// Local review reminder (Periodic Background Sync, Chrome/Edge with the app installed). The page
// stores only due dates; countDue and reminderText mirror src/domain/reviews/review-reminder.ts.
const REMINDER_CACHE = 'extrato-reminder';
const REMINDER_TAG = 'extrato-review-reminder';
const reminderKey = name => new URL(name, self.registration.scope).href;

function localToday() {
  const now = new Date();
  const pad = value => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function countDue(digest, today) {
  return {
    reviews: (digest.reviewDates || []).filter(date => date <= today).length,
    flashcards: (digest.flashcardDates || []).filter(date => date <= today).length,
  };
}

function reminderText({ reviews, flashcards }) {
  if (!reviews && !flashcards) return null;
  const parts = [
    reviews ? `${reviews} ${reviews === 1 ? 'revisão de tópico' : 'revisões de tópico'}` : '',
    flashcards ? `${flashcards} ${flashcards === 1 ? 'flashcard' : 'flashcards'}` : '',
  ].filter(Boolean);
  return `${parts.join(' e ')} para hoje. Abra a Revisão de hoje no Extrato.`;
}

async function remindDueReviews() {
  const cache = await caches.open(REMINDER_CACHE);
  const [digestResponse, lastResponse] = await Promise.all([
    cache.match(reminderKey('__reminder-digest')),
    cache.match(reminderKey('__reminder-last')),
  ]);
  if (!digestResponse) return;
  const today = localToday();
  // At most one notice a day.
  if (lastResponse && (await lastResponse.text()) === today) return;
  const body = reminderText(countDue(await digestResponse.json(), today));
  if (!body) return;
  await self.registration.showNotification('Revisão de hoje', {
    body,
    tag: REMINDER_TAG,
    icon: 'icons/icon-192.png',
    data: { url: './app#hoje' },
  });
  await cache.put(reminderKey('__reminder-last'), new Response(today));
}

self.addEventListener('periodicsync', event => {
  if (event.tag === REMINDER_TAG) event.waitUntil(remindDueReviews());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || './app#hoje', self.location.href).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const open = clients.find(client => new URL(client.url).pathname.startsWith('/app'));
      if (open) return open.navigate(url).then(client => (client || open).focus());
      return self.clients.openWindow(url);
    })
  );
});
