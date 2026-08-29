import {
  DriveSocket,
  mimeToExtension,
  supportedMimeType,
  type SupportedMimeType,
} from "@cyftec/drive-socket";
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

const socket = new DriveSocket({
  clientId: GOOGLE_CLIENT_ID,
  folderName: "dabba-items",
  pollIntervalInMs: 5000,
  maxFiles: 15,
});

type DabbaItem = {
  id: string;
  name: string;
  mimeType: string;
  fileBlob: Blob;
  text?: string;
  previewUrl?: string;
};

type SharePayload = {
  title: string;
  text: string;
  url: string;
  files: Array<{ name: string; type: string; dataUrl: string }>;
};

const items = signal<DabbaItem[]>([]);
const appError = signal("");
const hasReceived = signal(false);

function fileNameForMime(
  mimeType: SupportedMimeType,
  preferredName?: string,
): string {
  const extension = mimeToExtension(mimeType);
  const preferredExtension = preferredName?.split(".").pop()?.toLowerCase();

  if (preferredName && preferredExtension === extension.toLowerCase()) {
    return preferredName;
  }

  return `message-${Date.now()}.${extension}`;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }

  return `data:${blob.type || "application/octet-stream"};base64,${btoa(binary)}`;
}

async function toDabbaItem(message: {
  id: string;
  name: string;
  fileBlob: Blob;
}): Promise<DabbaItem> {
  const mimeType = message.fileBlob.type || "application/octet-stream";
  const item: DabbaItem = {
    id: message.id,
    name: message.name,
    mimeType,
    fileBlob: message.fileBlob,
  };

  if (mimeType === "text/plain") {
    item.text = await message.fileBlob.text();
  } else if (mimeType.startsWith("image/")) {
    item.previewUrl = await blobToDataUrl(message.fileBlob);
  }

  return item;
}

function prependItem(item: DabbaItem) {
  hasReceived.value = true;
  items.value = [
    item,
    ...items.value.filter((existing) => existing.id !== item.id),
  ];
}

class ContentPush {
  private static readonly shareQuery = "share-target";

  readonly busy = signal(false);

  async consumePendingShare(): Promise<string | undefined> {
    if (!location.search.includes(ContentPush.shareQuery)) {
      return;
    }

    history.replaceState({}, "", location.pathname);

    const payload = await this.readPendingShare();
    if (!payload) {
      return;
    }

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

    return this.push(file, file.type || "application/octet-stream", file.name);
  }

  private async push(
    fileBlob: Blob,
    mimeType: string,
    preferredName?: string,
  ): Promise<string | undefined> {
    if (!supportedMimeType(mimeType)) {
      return `Unsupported file type: ${mimeType}`;
    }

    this.busy.value = true;

    try {
      await socket.connect({ interactive: true });
      const message = await socket.push(fileBlob, {
        mimeType,
        fileName: fileNameForMime(mimeType, preferredName),
      });
      prependItem(await toDabbaItem(message));
    } catch (err) {
      console.error("Failed to push content:", err);
      return err instanceof Error ? err.message : "Could not push content.";
    } finally {
      this.busy.value = false;
    }
  }

  private async readPendingShare(): Promise<SharePayload | undefined> {
    if (!navigator.serviceWorker) {
      return;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        navigator.serviceWorker.removeEventListener("message", onMessage);
        resolve(undefined);
      }, 3000);

      const onMessage = (event: MessageEvent) => {
        if (event.data?.type !== "dabba-share-target") {
          return;
        }

        clearTimeout(timeout);
        navigator.serviceWorker.removeEventListener("message", onMessage);
        resolve(event.data.payload as SharePayload);
      };

      navigator.serviceWorker.addEventListener("message", onMessage);
      navigator.serviceWorker.controller?.postMessage({
        type: "dabba-consume-share",
      });
    });
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

socket.onReceive((messages) => {
  hasReceived.value = true;
  void Promise.all(messages.map(toDabbaItem)).then((nextItems) => {
    items.value = nextItems;
  });
});

const contentPush = new ContentPush();
const zonesDisabled = derive(() => contentPush.busy.value);
const isListLoading = derive(
  () => !hasReceived.value && items.value.length === 0,
);

function downloadItem(item: DabbaItem) {
  const url = URL.createObjectURL(item.fileBlob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = item.name;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function clearAppStorage() {
  await socket.disconnect();

  const cacheKeys = await caches.keys();
  await Promise.all(cacheKeys.map((key) => caches.delete(key)));

  localStorage.clear();
  sessionStorage.clear();

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister()),
    );
  }

  location.reload();
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

const onPageMount = () => {
  void contentPush.consumePendingShare().then((shareError) => {
    if (shareError) {
      appError.value = shareError;
    }
  });
};

const onPageUnmount = () => {
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
            class: css("clear-storage-button"),
            onclick: clearAppStorage,
            children: "Refresh Page",
          }),
        ],
      }),
      m.P({
        class: css("history-hint"),
        children:
          "Paste clipboard content or open a file to share it across your devices via Google Drive.",
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
