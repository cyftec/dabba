import { blobToDataUrl } from "./media.js";

export type ClipboardEntry = {
  id: string;
  mediaType: string;
  text: string;
  imgSrc: string;
};

const MAX_HISTORY = 50;

function mediaTypeFromMime(type: string): string {
  if (type.startsWith("image/")) {
    return "Image";
  }
  if (type === "text/plain") {
    return "Plain text";
  }
  if (type === "text/html") {
    return "HTML text";
  }
  if (type.startsWith("video/")) {
    return "Video";
  }
  if (type.startsWith("audio/")) {
    return "Audio";
  }
  return "Other type";
}

export function entriesEqual(a: ClipboardEntry, b: ClipboardEntry): boolean {
  return (
    a.mediaType === b.mediaType && a.text === b.text && a.imgSrc === b.imgSrc
  );
}

export function prependHistory(
  history: ClipboardEntry[],
  entry: ClipboardEntry,
): ClipboardEntry[] {
  if (history.length > 0 && entriesEqual(history[0]!, entry)) {
    return history;
  }

  return [entry, ...history].slice(0, MAX_HISTORY);
}

export async function readClipboardEntry(): Promise<ClipboardEntry | null> {
  const clipboardContents = await navigator.clipboard.read();
  if (!clipboardContents.length) {
    return null;
  }

  let mediaType = "Other type";
  let text = "";
  let imgSrc = "";

  for (const item of clipboardContents) {
    for (const type of item.types) {
      mediaType = mediaTypeFromMime(type);
    }

    const imageType = item.types.find((type) => type.startsWith("image/"));
    if (imageType) {
      const blob = await item.getType(imageType);
      imgSrc = await blobToDataUrl(blob);
      mediaType = "Image";
    }

    if (item.types.includes("text/plain")) {
      const blob = await item.getType("text/plain");
      const plainText = await blob.text();
      if (
        (plainText.startsWith("http://") || plainText.startsWith("https://")) &&
        (plainText.endsWith(".gif") || plainText.endsWith(".png"))
      ) {
        imgSrc = plainText;
        mediaType = "Image";
      } else {
        text = plainText;
        if (!imageType) {
          mediaType = "Plain text";
        }
      }
    }
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

export function clipboardErrorMessage(err: unknown): string | undefined {
  if (!(err instanceof Error)) {
    return undefined;
  }

  if (err.name === "NotAllowedError") {
    return "Permission to access clipboard was denied. Grant clipboard access in your browser settings.";
  }

  if (err.name === "SecurityError") {
    return "Clipboard access is restricted (for example, when not served over HTTPS).";
  }

  return undefined;
}
