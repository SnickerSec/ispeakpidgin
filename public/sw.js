const CACHE_NAME = 'chokepidgin-v2.6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dictionary.html',
  '/translator.html',
  '/learning-hub.html',
  '/phrases.html',
  '/about.html',
  '/css/tailwind.css',
  '/css/main.css',
  '/js/components/main.js',
  '/js/components/navigation.js',
  '/js/components/dictionary-cache.js',
  '/js/components/supabase-data-loader.js',
  '/js/components/elevenlabs-speech.js',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/favicon.svg',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css'
];

// Install Event - Cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching App Shell');
      return cache.addAll(STATIC_ASSETS).catch(error => {
        console.warn('SW: Pre-caching failed, but continuing...', error);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('chokepidgin-') && key !== CACHE_NAME && key !== 'chokepidgin-data') {
            console.log('SW: Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // BYPASS TRACKING AND ANALYTICS COMPLETELY
  // Let the browser handle these natively without SW interference
  if (url.hostname.includes('google-analytics') || 
      url.hostname.includes('googletagmanager') || 
      url.hostname.includes('stats.g.doubleclick.net') ||
      url.hostname.includes('doubleclick.net') ||
      url.pathname.includes('gtag.js') ||
      url.pathname.includes('analytics.js')) {
    return;
  }

  // 1. Dictionary API - Cache First
  if (url.pathname === '/api/dictionary/all' || url.pathname === '/api/dictionary') {
    event.respondWith(
      caches.open('chokepidgin-data').then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(err => {
            return cachedResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 2. Other API Requests - Network Only
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 3. HTML Navigation - Network First
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then(cached => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // 4. Static Assets - Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Only cache successful requests
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      });

      // Crucial: return cachedResponse immediately or wait for the fetchPromise
      // NEVER return null or undefined to respondWith
      return cachedResponse || fetchPromise;
    })
  );
});
