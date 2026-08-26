/// <reference lib="webworker" />

import { handleShareTargetRequest, SHARE_TARGET_ACTION } from "@controllers";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === "POST" && url.pathname === SHARE_TARGET_ACTION) {
    event.respondWith(handleShareTargetRequest(event.request));
  }
});
