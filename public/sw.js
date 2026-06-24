/**
 * BucksBuddy Service Worker — PWA + Offline Caching
 * Handles: App Shell, Static Assets, Supabase API responses
 */

var CACHE_NAME = 'bucksbuddy-v1';
var SUPABASE_CACHE_NAME = 'bucksbuddy-supabase-v1';

// App Shell — files that make the app work offline
var APP_SHELL = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/app2.js',
  '/app3.js',
  '/app4.js',
  '/i18n.js',
  '/languages.js',
  '/rumik.js',
  '/production-features.js',
];

// ── Install Event ──────────────────────────────────────────
self.addEventListener('install', function (event) {
  console.log('[SW] Installing BucksBuddy Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log('[SW] Caching app shell');
      // Cache each individually so a single failure doesn't break all
      return Promise.all(
        APP_SHELL.map(function (url) {
          return cache.add(url).catch(function (err) {
            console.warn('[SW] Failed to cache:', url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// ── Activate Event ─────────────────────────────────────────
self.addEventListener('activate', function (event) {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (name) {
            return name !== CACHE_NAME && name !== SUPABASE_CACHE_NAME;
          })
          .map(function (name) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ── Fetch Event ────────────────────────────────────────────
self.addEventListener('fetch', function (event) {
  var url = event.request.url;

  // 1. Supabase API calls → NetworkFirst with 5 min cache
  if (url.includes('.supabase.co')) {
    event.respondWith(networkFirst(event.request, SUPABASE_CACHE_NAME, 300));
    return;
  }

  // 2. External CDN scripts (Sentry, PostHog, Razorpay, etc.) → StaleWhileRevalidate
  if (
    url.includes('cdn.jsdelivr.net') ||
    url.includes('js.sentry-cdn.com') ||
    url.includes('posthog.com') ||
    url.includes('checkout.razorpay.com')
  ) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // 3. Navigate requests (HTML) → NetworkFirst, fallback to cached /index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // 4. Static assets (JS, CSS, images, fonts) → CacheFirst
  if (
    url.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff|woff2|ttf)$/)
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // 5. Everything else → NetworkFirst
  event.respondWith(networkFirst(event.request, CACHE_NAME, 0));
});

// ── Caching Strategies ─────────────────────────────────────

/**
 * NetworkFirst: Try network, fall back to cache.
 * maxAgeSeconds: 0 means no expiry enforcement (just use cached on failure)
 */
function networkFirst(request, cacheName, maxAgeSeconds) {
  return fetch(request)
    .then(function (response) {
      if (response && response.ok) {
        var clone = response.clone();
        caches.open(cacheName).then(function (cache) {
          cache.put(request, clone);
        });
      }
      return response;
    })
    .catch(function () {
      return caches.match(request).then(function (cached) {
        if (cached) {
          // Check age if maxAgeSeconds is set
          if (maxAgeSeconds > 0) {
            var dateHeader = cached.headers.get('date');
            if (dateHeader) {
              var age = (Date.now() - new Date(dateHeader).getTime()) / 1000;
              if (age > maxAgeSeconds) return fetch(request); // stale, but network also failed
            }
          }
          return cached;
        }
        return new Response('Offline — content not cached.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      });
    });
}

/**
 * CacheFirst: Use cache if available, otherwise fetch and cache.
 */
function cacheFirst(request) {
  return caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (response) {
      if (response && response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, clone);
        });
      }
      return response;
    });
  });
}

/**
 * StaleWhileRevalidate: Return cache immediately, revalidate in background.
 */
function staleWhileRevalidate(request) {
  return caches.match(request).then(function (cached) {
    var fetchPromise = fetch(request).then(function (response) {
      if (response && response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, clone);
        });
      }
      return response;
    });
    return cached || fetchPromise;
  });
}

// ── Push Notifications (future use) ───────────────────────
self.addEventListener('push', function (event) {
  var data = event.data ? event.data.json() : {};
  var title = data.title || 'BucksBuddy';
  var options = {
    body: data.body || 'You have a new notification.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url || '/';
  event.waitUntil(clients.openWindow(url));
});

console.log('[SW] BucksBuddy Service Worker loaded ✅');
