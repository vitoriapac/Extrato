const CACHE_NAME='studytrack-test-version-a';
const MARKER='/* studytrack-test-version-a */';
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  for(const path of ['./styles/app.css','./src/app.bundle.js']){
    const response=await fetch(path);
    await cache.put(path,new Response(`${await response.text()}\n${MARKER}`,{headers:{'Content-Type':path.endsWith('.css')?'text/css':'text/javascript'}}));
  }
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const path=new URL(event.request.url).pathname;
  if(path.endsWith('/styles/app.css')||path.endsWith('/src/app.bundle.js')){
    event.respondWith(caches.open(CACHE_NAME).then(cache=>cache.match(new URL(path,location.origin).href)));
  }
});
