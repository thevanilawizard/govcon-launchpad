const CACHE = 'gcl-v1';
const CORE = ['./govcon-launchpad.html', './', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Let news/RSS fetches always go to network
  const url = e.request.url;
  if (url.includes('rss2json') || url.includes('federalregister') || url.includes('news.google')) {
    e.respondWith(fetch(e.request).catch(() => new Response('offline', { status: 503 })));
    return;
  }
  // Everything else: cache-first, update in background
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
