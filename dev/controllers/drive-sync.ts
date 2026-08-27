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

const POLL_INTERVAL_MS = 5000;

const socket = new DriveSocket({ clientId: GOOGLE_CLIENT_ID }, [
  "webContentLink",
]);

let pollTimer: ReturnType<typeof setInterval> | undefined;
let lastKnownIds = "";
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

async function metadataToDabbaItem(
  metadata: DriveFileMetadata,
): Promise<DabbaItem> {
  const item: DabbaItem = {
    id: metadata.id,
    name: metadata.name,
    mimeType: metadata.mimeType,
    createdTime: metadata.createdTime,
    webContentLink: metadata.webContentLink ?? "",
    isText: isTextItem(metadata),
  };

  if (item.isText) {
    const cached = textCache.get(item.id);
    if (cached !== undefined) {
      item.text = cached;
    } else {
      const message = await socket.getById(item.id);
      const text = await message.fileBlob.text();
      textCache.set(item.id, text);
      item.text = text;
    }
  }

  return item;
}

function metadataFingerprint(metadata: DriveFileMetadata[]): string {
  return metadata.map((item) => `${item.id}:${item.createdTime}`).join("|");
}

export async function connectDrive(): Promise<void> {
  assertOnline();
  await socket.connect();
}

export async function disconnectDrive(): Promise<void> {
  stopPolling();
  await socket.disconnect();
}

export function isDriveAuthenticated(): boolean {
  return socket.isAuthenticated();
}

export async function loadAllItems(): Promise<DabbaItem[]> {
  assertOnline();
  const metadata = (await socket.receive({
    as: "file-message-metadata",
  })) as DriveFileMetadata[];
  lastKnownIds = metadataFingerprint(metadata);

  const items: DabbaItem[] = [];
  for (const entry of metadata) {
    items.push(await metadataToDabbaItem(entry));
  }
  return items;
}

export async function pushFile(fileBlob: Blob, mimeType: string): Promise<void> {
  assertOnline();
  if (!socket.isAuthenticated()) {
    await connectDrive();
  }
  await socket.push(fileBlob, { mimeType });
  lastKnownIds = "";
}

export async function pushText(text: string): Promise<void> {
  await pushFile(new Blob([text], { type: "text/plain" }), "text/plain");
}

export function startPolling(onChange: () => void): void {
  stopPolling();
  pollTimer = setInterval(() => {
    if (!navigator.onLine || !socket.isAuthenticated()) {
      return;
    }

    void (async () => {
      const metadata = (await socket.receive({
    as: "file-message-metadata",
  })) as DriveFileMetadata[];
      const fingerprint = metadataFingerprint(metadata);
      if (fingerprint !== lastKnownIds) {
        lastKnownIds = fingerprint;
        onChange();
      }
    })();
  }, POLL_INTERVAL_MS);
}

export function stopPolling(): void {
  if (pollTimer !== undefined) {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }
}
