/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const SHARE_ACTION = "/share";
const SHARE_CACHE = "dabba-share-target-v1";
const SHARE_KEY = "/dabba/share-target/payload";
const SHARE_QUERY = "share-target";

async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }

  return `data:${blob.type || "application/octet-stream"};base64,${btoa(binary)}`;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "POST" || url.pathname !== SHARE_ACTION) {
    return;
  }

  event.respondWith(
    (async () => {
      const formData = await event.request.formData();
      const files: Array<{ name: string; type: string; dataUrl: string }> = [];

      for (const entry of formData.getAll("files")) {
        if (!(entry instanceof File) || entry.size === 0) {
          continue;
        }

        files.push({
          name: entry.name,
          type: entry.type || "application/octet-stream",
          dataUrl: await blobToDataUrl(entry),
        });
      }

      const cache = await caches.open(SHARE_CACHE);
      await cache.put(
        SHARE_KEY,
        new Response(
          JSON.stringify({
            title: String(formData.get("title") ?? ""),
            text: String(formData.get("text") ?? ""),
            url: String(formData.get("url") ?? ""),
            files,
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      );

      const redirectUrl = new URL("/", self.location.origin);
      redirectUrl.searchParams.set(SHARE_QUERY, "1");
      return Response.redirect(redirectUrl.href, 303);
    })(),
  );
});

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
