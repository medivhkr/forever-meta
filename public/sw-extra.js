// Дополнение к service worker, который собирает Workbox (подключается через importScripts).
//
// Когда выходит новая версия сайта, новый service worker забирает открытые вкладки под контроль.
// Но страница в такой вкладке всё ещё старая: её код уже загружен. Поэтому после обновления
// перезагружаем открытые вкладки сами, и человек сразу видит новую версию, даже если старая
// страница не умеет перезагружаться.
//
// При самом первом заходе перезагружать нечего. Отличаем его так: во время установки нового
// service worker старый ещё активен (registration.active), только если это обновление.
let replacingOldVersion = false;

self.addEventListener('install', () => {
  replacingOldVersion = Boolean(self.registration.active);
});

self.addEventListener('activate', (event) => {
  if (!replacingOldVersion) return;
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const windows = await self.clients.matchAll({ type: 'window' });
      for (const client of windows) {
        if ('navigate' in client) client.navigate(client.url).catch(() => {});
      }
    })(),
  );
});
