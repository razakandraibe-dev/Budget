// Budget familial : garde l'appli en mémoire pour qu'elle s'ouvre sans internet
const CACHE = 'budget-familial-v1';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Sert la copie gardée tout de suite, et la met à jour en arrière-plan quand internet est là
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const net = fetch(req).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => null);
  e.waitUntil(net);
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit =>
    hit || net.then(res => res || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
