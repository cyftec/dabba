// dev/view/pages/service-worker.ts
var SHARE_ACTION = "/share";
var SHARE_QUERY = "share-target";
var pendingShare = null;
async function blobToDataUrl(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0;i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return `data:${blob.type || "application/octet-stream"};base64,${btoa(binary)}`;
}
function deliverPendingShare(client) {
  if (!pendingShare) {
    return;
  }
  client.postMessage({ type: "dabba-share-target", payload: pendingShare });
  pendingShare = null;
}
self.addEventListener("message", (event) => {
  if (event.data?.type !== "dabba-consume-share") {
    return;
  }
  const client = event.source;
  if (client instanceof Client) {
    deliverPendingShare(client);
  }
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === SHARE_ACTION) {
    event.respondWith((async () => {
      const formData = await event.request.formData();
      const files = [];
      for (const entry of formData.getAll("files")) {
        if (!(entry instanceof File) || entry.size === 0) {
          continue;
        }
        files.push({
          name: entry.name,
          type: entry.type || "application/octet-stream",
          dataUrl: await blobToDataUrl(entry)
        });
      }
      pendingShare = {
        title: String(formData.get("title") ?? ""),
        text: String(formData.get("text") ?? ""),
        url: String(formData.get("url") ?? ""),
        files
      };
      const redirectUrl = new URL("/", self.location.origin);
      redirectUrl.searchParams.set(SHARE_QUERY, "1");
      return Response.redirect(redirectUrl.href, 303);
    })());
    return;
  }
  event.respondWith(fetch(event.request));
});
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
