const CACHE_NAME = 'dobotore-v3';

// インストール時：即座に有効化
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 有効化時：古いキャッシュをすべて削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ネットワーク優先（常に最新ファイルを取得）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});