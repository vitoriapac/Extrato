const CACHE_NAME='studytrack-v8';
const APP_SHELL=[
  './','./index.html','./styles/tokens.css','./styles/app.css?v=8','./styles/print.css',
  './src/theme-bootstrap.js','./src/app.bundle.js?v=8','./src/pwa.js','./manifest.webmanifest',
  './icons/app-icon.svg','./icons/icon-192.png','./icons/icon-512.png',
  './icons/icon-maskable-512.png','./icons/apple-touch-icon.png'
];

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())
));

self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>{
    const network=fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)));}return response;});
    return cached?(event.waitUntil(network.catch(()=>null)),cached):network;
  }));
});
