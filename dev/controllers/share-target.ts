import { blobToDataUrl } from "./media";

export const SHARE_TARGET_CACHE = "dabba-share-target-v1";
export const SHARE_TARGET_PAYLOAD_KEY = "/dabba/share-target/payload";
export const SHARE_TARGET_ACTION = "/share";
export const SHARE_TARGET_QUERY = "share-target";

export type SharePayload = {
  title: string;
  text: string;
  url: string;
  files: Array<{
    name: string;
    type: string;
    dataUrl: string;
  }>;
};

export async function sharePayloadFromFormData(
  formData: FormData,
): Promise<SharePayload> {
  const title = String(formData.get("title") ?? "");
  const text = String(formData.get("text") ?? "");
  const url = String(formData.get("url") ?? "");
  const files: SharePayload["files"] = [];

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

  return { title, text, url, files };
}

export async function storeSharePayload(payload: SharePayload): Promise<void> {
  const cache = await caches.open(SHARE_TARGET_CACHE);
  await cache.put(
    SHARE_TARGET_PAYLOAD_KEY,
    new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
    }),
  );
}

export async function consumeSharePayload(): Promise<SharePayload | null> {
  const cache = await caches.open(SHARE_TARGET_CACHE);
  const response = await cache.match(SHARE_TARGET_PAYLOAD_KEY);
  if (!response) {
    return null;
  }

  await cache.delete(SHARE_TARGET_PAYLOAD_KEY);
  return (await response.json()) as SharePayload;
}

function dataUrlToBlob(dataUrl: string, mimeType: string): Blob {
  const commaIndex = dataUrl.indexOf(",");
  const base64 = commaIndex === -1 ? "" : dataUrl.slice(commaIndex + 1);
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

export async function pushSharePayloadToDrive(
  payload: SharePayload,
  pushFile: (fileBlob: Blob, mimeType: string) => Promise<void>,
  pushText: (text: string) => Promise<void>,
): Promise<void> {
  const textParts = [payload.title, payload.text, payload.url].filter(Boolean);
  const sharedText = textParts.join("\n");

  for (const file of payload.files) {
    const mimeType = file.type || "application/octet-stream";
    await pushFile(dataUrlToBlob(file.dataUrl, mimeType), mimeType);
  }

  if (sharedText) {
    await pushText(sharedText);
  }
}

export async function handleShareTargetRequest(
  request: Request,
): Promise<Response> {
  const formData = await request.formData();
  const payload = await sharePayloadFromFormData(formData);
  await storeSharePayload(payload);

  const redirectUrl = new URL("/", self.location.origin);
  redirectUrl.searchParams.set(SHARE_TARGET_QUERY, "1");
  return Response.redirect(redirectUrl.href, 303);
}
