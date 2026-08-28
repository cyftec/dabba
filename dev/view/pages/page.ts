import { DriveSocket } from "@cyftec/drive-socket";
import { m } from "@cyftec/maya/core";
import { derive, signal } from "@cyftec/maya/signals";
import { css } from "./assets/styles";
import {
  ContentInput,
  DriveItemList,
  EmptyListMessage,
  HTMLPage,
} from "../components/index";

const GOOGLE_CLIENT_ID =
  "862232516752-sn8vjtdkrhdfuf5lr6kej43kceap6d10.apps.googleusercontent.com";

const socket = new DriveSocket({ clientId: GOOGLE_CLIENT_ID }, [
  "thumbnailLink",
]);

type DabbaItem = {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  thumbnailLink?: string;
  text?: string;
  previewUrl?: string;
};

class ContentPush {
  private static readonly shareCache = "dabba-share-target-v1";
  private static readonly shareKey = "/dabba/share-target/payload";
  private static readonly shareQuery = "share-target";

  readonly busy = signal(false);

  constructor(private onPushed: () => Promise<void>) {}

  async consumePendingShare(): Promise<string | undefined> {
    if (!location.search.includes(ContentPush.shareQuery)) {
      return;
    }

    history.replaceState({}, "", location.pathname);

    const cache = await caches.open(ContentPush.shareCache);
    const response = await cache.match(ContentPush.shareKey);
    if (!response) {
      return;
    }

    await cache.delete(ContentPush.shareKey);

    const payload = (await response.json()) as {
      title: string;
      text: string;
      url: string;
      files: Array<{ name: string; type: string; dataUrl: string }>;
    };

    const sharedFile = payload.files[0];
    if (sharedFile) {
      const error = await this.fromFile(this.fileFromShare(sharedFile));
      if (error) {
        return error;
      }
    }

    const text = [payload.title, payload.text, payload.url]
      .filter(Boolean)
      .join("\n");
    if (!text) {
      return;
    }

    return this.push(new Blob([text], { type: "text/plain" }), "text/plain");
  }

  async fromClipboard(): Promise<string | undefined> {
    if (this.busy.value) {
      return;
    }

    try {
      const payload = await this.readClipboard();
      if (!payload) {
        return "Clipboard is empty or unsupported.";
      }

      return await this.push(payload.fileBlob, payload.mimeType);
    } catch (err) {
      console.error("Failed to push clipboard content:", err);
      return (
        this.clipboardError(err) ??
        (err instanceof Error
          ? err.message
          : "Could not push clipboard content.")
      );
    }
  }

  async fromFile(file: File): Promise<string | undefined> {
    if (this.busy.value) {
      return;
    }

    return this.push(file, file.type || "application/octet-stream");
  }

  private async push(
    fileBlob: Blob,
    mimeType: string,
  ): Promise<string | undefined> {
    if (!navigator.onLine) {
      return "Dabba requires an internet connection.";
    }

    this.busy.value = true;

    try {
      if (!socket.isAuthenticated()) {
        await socket.connect();
      }

      await socket.push(fileBlob, { mimeType });
      await this.onPushed();
    } catch (err) {
      console.error("Failed to push content:", err);
      return err instanceof Error ? err.message : "Could not push content.";
    } finally {
      this.busy.value = false;
    }
  }

  private async readClipboard(): Promise<{
    fileBlob: Blob;
    mimeType: string;
  } | null> {
    const clipboardContents = await navigator.clipboard.read();
    if (!clipboardContents.length) {
      return null;
    }

    for (const item of clipboardContents) {
      const imageType = item.types.find((type) => type.startsWith("image/"));
      if (imageType) {
        return {
          fileBlob: await item.getType(imageType),
          mimeType: imageType,
        };
      }

      if (item.types.includes("text/plain")) {
        return {
          fileBlob: await item.getType("text/plain"),
          mimeType: "text/plain",
        };
      }
    }

    return null;
  }

  private clipboardError(err: unknown): string | undefined {
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

  private fileFromShare(file: {
    name: string;
    type: string;
    dataUrl: string;
  }): File {
    const commaIndex = file.dataUrl.indexOf(",");
    const base64 = commaIndex === -1 ? "" : file.dataUrl.slice(commaIndex + 1);
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return new File([bytes], file.name, {
      type: file.type || "application/octet-stream",
    });
  }
}

const items = signal<DabbaItem[]>([]);
const appError = signal("");
const isOnline = signal(navigator.onLine);
const isBusy = signal(true);

let pageListeners: AbortController | undefined;
let loadPromise: Promise<void> | null = null;

async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }

  return `data:${blob.type || "application/octet-stream"};base64,${btoa(binary)}`;
}

async function loadItemPreview(id: string, mimeType: string) {
  if (mimeType !== "text/plain" && !mimeType.startsWith("image/")) {
    return;
  }

  try {
    const message = await socket.getById(id);

    if (mimeType === "text/plain") {
      const text = await message.fileBlob.text();
      items.value = items.value.map((item) =>
        item.id === id ? { ...item, text } : item,
      );
      return;
    }

    const previewUrl = await blobToDataUrl(message.fileBlob);
    items.value = items.value.map((item) =>
      item.id === id ? { ...item, previewUrl } : item,
    );
  } catch (err) {
    console.error(`Failed to load preview for ${id}:`, err);
  }
}

async function refreshItems() {
  const metadataList = await socket.receive({ as: "file-message-metadata" });
  const previousById = new Map(items.value.map((item) => [item.id, item]));

  items.value = metadataList.map((metadata) => {
    const previous = previousById.get(metadata.id);
    return {
      id: metadata.id,
      name: metadata.name,
      mimeType: metadata.mimeType,
      createdTime: metadata.createdTime,
      thumbnailLink: metadata.thumbnailLink,
      ...(previous?.previewUrl ? { previewUrl: previous.previewUrl } : {}),
      ...(previous?.text !== undefined ? { text: previous.text } : {}),
    };
  });

  for (const metadata of metadataList) {
    void loadItemPreview(metadata.id, metadata.mimeType);
  }
}

async function downloadItem(id: string, name: string) {
  if (!navigator.onLine) {
    appError.value = "Dabba requires an internet connection.";
    return;
  }

  try {
    if (!socket.isAuthenticated()) {
      await socket.connect();
    }

    const message = await socket.getById(id);
    const url = URL.createObjectURL(message.fileBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(`Failed to download ${id}:`, err);
    appError.value =
      err instanceof Error ? err.message : "Could not download the file.";
  }
}

const contentPush = new ContentPush(refreshItems);

const zonesDisabled = derive(
  () => !isOnline.value || isBusy.value || contentPush.busy.value,
);
const isListLoading = derive(() => isBusy.value && items.value.length === 0);

async function loadDriveContent(): Promise<void> {
  if (!isOnline.value) {
    isBusy.value = false;
    return;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    isBusy.value = true;
    appError.value = "";

    try {
      if (!socket.isAuthenticated()) {
        await socket.connect();
      }

      await refreshItems();
    } catch (err) {
      console.error("Failed to load Drive items:", err);
      appError.value =
        err instanceof Error ? err.message : "Could not load items from Drive.";
    } finally {
      isBusy.value = false;
    }
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }
}

async function reloadContent() {
  if (isBusy.value || contentPush.busy.value) {
    return;
  }

  await loadDriveContent();
}

async function initializeDrive() {
  if (!isOnline.value) {
    isBusy.value = false;
    return;
  }

  await loadDriveContent();

  const shareError = await contentPush.consumePendingShare();
  if (shareError) {
    appError.value = shareError;
  }
}

async function onPasteZoneTap() {
  const error = await contentPush.fromClipboard();
  appError.value = error ?? "";
}

async function onFileInputChange(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";

  if (!file) {
    return;
  }

  const error = await contentPush.fromFile(file);
  appError.value = error ?? "";
}

const syncOnlineStatus = () => {
  if (navigator.onLine === isOnline.value) {
    return;
  }

  if (navigator.onLine) {
    isOnline.value = true;
    appError.value = "";
    void initializeDrive();
    return;
  }

  isOnline.value = false;
  isBusy.value = false;
  loadPromise = null;
  appError.value = "Dabba requires an internet connection.";
};

const onPageMount = () => {
  pageListeners = new AbortController();
  const { signal: abortSignal } = pageListeners;

  window.addEventListener("online", syncOnlineStatus, { signal: abortSignal });
  window.addEventListener("offline", syncOnlineStatus, { signal: abortSignal });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "visible") {
        syncOnlineStatus();
      }
    },
    { signal: abortSignal },
  );

  void initializeDrive();
};

const onPageUnmount = () => {
  pageListeners?.abort();
  pageListeners = undefined;
  void socket.disconnect();
};

export default HTMLPage({
  onMount: onPageMount,
  onUnmount: onPageUnmount,
  cssClasses: "ma0",
  body: m.Section({
    class: css("history"),
    "aria-labelledby": "dabba-title",
    children: [
      m.Div({
        class: css("hero-row"),
        children: [
          m.H1({
            id: "dabba-title",
            class: css("hero-title"),
            children: "Dabba",
          }),
          m.Button({
            type: "button",
            class: css("refresh-button"),
            disabled: derive(() => isBusy.value || contentPush.busy.value),
            onclick: reloadContent,
            children: "Reload content",
          }),
        ],
      }),
      m.P({
        class: css("history-hint"),
        children:
          "Paste clipboard content or open a file to share it across your devices via Google Drive.",
      }),
      m.If({
        subject: isOnline,
        isFalsy: () =>
          m.P({
            class: css("offline-banner"),
            role: "alert",
            children: "Dabba requires an internet connection.",
          }),
      }),
      m.If({
        subject: appError,
        isTruthy: () =>
          m.P({
            class: css("history-error"),
            role: "alert",
            children: appError!,
          }),
      }),
      ContentInput({
        zonesDisabled,
        onPasteZoneTap,
        onFileInputChange,
      }),
      m.If({
        subject: isListLoading,
        isTruthy: () => EmptyListMessage({ isListLoading: true }),
        isFalsy: () =>
          m.If({
            subject: items.is.length.truthy(),
            isFalsy: () => EmptyListMessage({ isListLoading: false }),
            isTruthy: () =>
              DriveItemList({
                items: items,
                disabled: zonesDisabled,
                onDownload: downloadItem,
              }),
          }),
      }),
    ],
  }),
});
