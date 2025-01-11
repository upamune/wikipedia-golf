const CACHE_NAME = 'wikipedia-golf-cache-v1';
const WIKIPEDIA_API_CACHE_NAME = 'wikipedia-api-cache-v1';

const WIKIPEDIA_API_ENDPOINTS = [
  'https://ja.wikipedia.org/w/api.php',
  'https://ja.wikipedia.org/w/load.php',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('wikipedia-'))
          .filter((name) => name !== CACHE_NAME && name !== WIKIPEDIA_API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Wikipedia APIのリクエストの場合
  if (WIKIPEDIA_API_ENDPOINTS.some(endpoint => url.href.startsWith(endpoint))) {
    event.respondWith(
      caches.open(WIKIPEDIA_API_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // 通常のアセットの場合
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
}); 