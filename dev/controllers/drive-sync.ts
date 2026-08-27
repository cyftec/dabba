import { DriveSocket } from "@cyftec/drive-socket";
import { GOOGLE_CLIENT_ID } from "./drive-config";

export type DabbaItem = {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  webContentLink: string;
  isText: boolean;
  text?: string;
};

type DriveFileMetadata = {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  webContentLink?: string;
};

const socket = new DriveSocket({ clientId: GOOGLE_CLIENT_ID }, [
  "webContentLink",
]);

let textCache = new Map<string, string>();

function assertOnline(): void {
  if (!navigator.onLine) {
    throw new Error("Dabba requires an internet connection.");
  }
}

function isTextItem(item: { mimeType: string; name: string }): boolean {
  return (
    item.mimeType === "text/plain" || item.name.toLowerCase().endsWith(".txt")
  );
}

function metadataToDabbaItem(metadata: DriveFileMetadata): DabbaItem {
  const item: DabbaItem = {
    id: metadata.id,
    name: metadata.name,
    mimeType: metadata.mimeType,
    createdTime: metadata.createdTime,
    webContentLink: metadata.webContentLink ?? "",
    isText: isTextItem(metadata),
  };

  const cached = textCache.get(item.id);
  if (cached !== undefined) {
    item.text = cached;
  }

  return item;
}

async function enrichItemWithFileBlob(item: DabbaItem): Promise<DabbaItem> {
  if (!item.isText) {
    return item;
  }

  const cached = textCache.get(item.id);
  if (cached !== undefined) {
    return { ...item, text: cached };
  }

  const message = await socket.getById(item.id);
  const text = await message.fileBlob.text();
  textCache.set(item.id, text);
  return { ...item, text };
}

async function fetchMetadata(): Promise<DriveFileMetadata[]> {
  return (await socket.receive({
    as: "file-message-metadata",
  })) as DriveFileMetadata[];
}

export async function connectDrive(): Promise<void> {
  assertOnline();
  await socket.connect();
}

export async function disconnectDrive(): Promise<void> {
  await socket.disconnect();
}

export function isDriveAuthenticated(): boolean {
  return socket.isAuthenticated();
}

export async function loadMetadataItems(): Promise<DabbaItem[]> {
  assertOnline();
  const metadata = await fetchMetadata();
  return metadata.map(metadataToDabbaItem);
}

export function enrichItemsWithFileBlob(
  items: DabbaItem[],
  onItemEnriched: (item: DabbaItem) => void,
): void {
  for (const item of items) {
    if (!item.isText || item.text !== undefined) {
      continue;
    }

    void enrichItemWithFileBlob(item)
      .then(onItemEnriched)
      .catch((err) => {
        console.error(`Failed to load file data for ${item.id}:`, err);
      });
  }
}

export async function pushFile(
  fileBlob: Blob,
  mimeType: string,
): Promise<void> {
  assertOnline();
  if (!socket.isAuthenticated()) {
    await connectDrive();
  }
  await socket.push(fileBlob, { mimeType });
}

export async function pushText(text: string): Promise<void> {
  await pushFile(new Blob([text], { type: "text/plain" }), "text/plain");
}
