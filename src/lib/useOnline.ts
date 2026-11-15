import { useSyncExternalStore } from 'react';

// Есть ли сеть. useSyncExternalStore — правильный способ подписаться на внешний источник
// (здесь события браузера online/offline), чтобы все компоненты видели одно и то же значение.

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
