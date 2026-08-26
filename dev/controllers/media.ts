export async function blobToDataUrl(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }

  return `data:${blob.type || "application/octet-stream"};base64,${btoa(binary)}`;
}

export function dataUrlToText(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    return "";
  }

  return atob(dataUrl.slice(commaIndex + 1));
}
