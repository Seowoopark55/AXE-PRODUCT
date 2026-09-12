const CACHE_VERSION = 'axe-product-pwa-3.18.3-r1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const CORE = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png'
];

async function primeBuiltAssets(cache) {
  try {
    const response = await fetch('/', { cache: 'no-store' });
    if (!response.ok) return;
    await cache.put('/', response.clone());
    const html = await response.text();
    const paths = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g)].map((m) => m[1]);
    await Promise.allSettled([...new Set(paths)].map((path) => cache.add(path)));
  } catch (_) {}
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_SHELL_CACHE);
    await Promise.allSettled(CORE.map((path) => cache.add(path)));
    await primeBuiltAssets(cache);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([APP_SHELL_CACHE, RUNTIME_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('axe-product-pwa-') && !keep.has(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(APP_SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response?.ok) cache.put('/', response.clone());
    return response;
  } catch (_) {
    return (await cache.match('/')) || (await cache.match('/offline.html')) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response?.ok && response.type === 'basic') cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Never cache or synthesize operational API responses.
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return;

  // External Supabase/OAuth/API traffic remains untouched by the service worker.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  const staticAsset = url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    ['style','script','image','font'].includes(request.destination);

  if (staticAsset) event.respondWith(staleWhileRevalidate(request));
});
