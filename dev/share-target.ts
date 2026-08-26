import { blobToDataUrl, dataUrlToText } from "./media.js";
import type { ClipboardEntry } from "./clipboard.js";

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

function mediaTypeFromMime(type: string): string {
  if (type.startsWith("image/")) {
    return "Image";
  }
  if (type === "text/plain") {
    return "Plain text";
  }
  return "Other type";
}

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

export function clipboardEntryFromSharePayload(
  payload: SharePayload,
): ClipboardEntry | null {
  const textParts = [payload.title, payload.text, payload.url].filter(Boolean);
  let text = textParts.join("\n");
  let imgSrc = "";
  let mediaType = "Plain text";

  const imageFile = payload.files.find((file) => file.type.startsWith("image/"));
  if (imageFile) {
    imgSrc = imageFile.dataUrl;
    mediaType = "Image";
  }

  const textFile = payload.files.find((file) => file.type.startsWith("text/"));
  if (textFile) {
    const fileText = dataUrlToText(textFile.dataUrl);
    text = text ? `${text}\n${fileText}` : fileText;
    if (!imageFile) {
      mediaType = "Plain text";
    }
  }

  if (!imageFile && payload.files.length > 0 && !textFile) {
    mediaType = mediaTypeFromMime(payload.files[0]!.type);
  }

  if (!text && !imgSrc) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    mediaType,
    text,
    imgSrc,
  };
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
