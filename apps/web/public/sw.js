globalThis.addEventListener("install", () => {
  globalThis.skipWaiting();
});

globalThis.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

globalThis.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
