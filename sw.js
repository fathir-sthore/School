// ============================================================
// Service Worker — Kelas IX C PWA
// ============================================================
const CACHE_NAME  = 'kelas9c-v2';
const STATIC_URLS = [
  '/',
  '/index.html',
  '/admin.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install — pre-cache statics
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(c =>
      Promise.allSettled(STATIC_URLS.map(u => c.add(u).catch(() => {})))
    )
  );
});

// Activate — delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for statics, network-first for API
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and external APIs (Supabase/Cloudinary)
  if (request.method !== 'GET') return;
  if (url.hostname.includes('supabase') || url.hostname.includes('cloudinary')) return;

  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, copy));
        return response;
      }).catch(() => {
        // Offline fallback for navigation
        if (request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});
