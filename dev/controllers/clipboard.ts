export type ClipboardPushPayload = {
  fileBlob: Blob;
  mimeType: string;
};

export async function readClipboardForPush(): Promise<ClipboardPushPayload | null> {
  const clipboardContents = await navigator.clipboard.read();
  if (!clipboardContents.length) {
    return null;
  }

  for (const item of clipboardContents) {
    const imageType = item.types.find((type) => type.startsWith("image/"));
    if (imageType) {
      const fileBlob = await item.getType(imageType);
      return { fileBlob, mimeType: imageType };
    }

    if (item.types.includes("text/plain")) {
      const fileBlob = await item.getType("text/plain");
      const plainText = await fileBlob.text();
      if (
        (plainText.startsWith("http://") || plainText.startsWith("https://")) &&
        (plainText.endsWith(".gif") || plainText.endsWith(".png"))
      ) {
        continue;
      }
      return { fileBlob, mimeType: "text/plain" };
    }
  }

  return null;
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
