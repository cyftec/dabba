import { m } from "@cyftec/maya/core";
import { derive, signal } from "@cyftec/maya/signals";
import { css } from "./assets/styles";
import { DriveItemList, HTMLPage } from "../components/index";
import {
  clipboardErrorMessage,
  connectDrive,
  consumeSharePayload,
  disconnectDrive,
  loadAllItems,
  pushFile,
  pushSharePayloadToDrive,
  pushText,
  readClipboardForPush,
  registerFileLaunchConsumer,
  SHARE_TARGET_QUERY,
  startPolling,
  stopPolling,
  type DabbaItem,
  wasFileLaunchPending,
} from "@controllers";

const items = signal<DabbaItem[]>([]);
const appError = signal("");
const isLoading = signal(true);
const isOnline = signal(navigator.onLine);
const isBusy = signal(false);

const zonesDisabled = derive(
  () => !isOnline.value || isBusy.value || isLoading.value,
);

let pageListeners: AbortController | undefined;

async function refreshItems() {
  items.value = await loadAllItems();
}

async function pushFiles(files: File[]) {
  for (const file of files) {
    await pushFile(file, file.type || "application/octet-stream");
  }
  await refreshItems();
}

async function handlePasteZoneClick() {
  if (!isOnline.value || isBusy.value) {
    return;
  }

  isBusy.value = true;
  appError.value = "";

  try {
    const payload = await readClipboardForPush();
    if (!payload) {
      appError.value = "Clipboard is empty or unsupported.";
      return;
    }

    await pushFile(payload.fileBlob, payload.mimeType);
    await refreshItems();
  } catch (err) {
    console.error("Failed to push clipboard content:", err);
    appError.value =
      clipboardErrorMessage(err) ??
      (err instanceof Error
        ? err.message
        : "Could not push clipboard content.");
  } finally {
    isBusy.value = false;
  }
}

async function handleFileInputChange(event: Event) {
  if (!isOnline.value || isBusy.value) {
    return;
  }

  const input = event.currentTarget as HTMLInputElement;
  const selectedFiles = [...(input.files ?? [])];
  input.value = "";

  if (!selectedFiles.length) {
    return;
  }

  isBusy.value = true;
  appError.value = "";

  try {
    await pushFiles(selectedFiles);
  } catch (err) {
    console.error("Failed to push file:", err);
    appError.value =
      err instanceof Error ? err.message : "Could not push file to Drive.";
  } finally {
    isBusy.value = false;
  }
}

async function consumeSharedContent() {
  if (!location.search.includes(SHARE_TARGET_QUERY)) {
    return false;
  }

  try {
    const payload = await consumeSharePayload();
    appError.value = "";

    if (payload) {
      await pushSharePayloadToDrive(payload, pushFile, pushText);
      await refreshItems();
    }

    history.replaceState({}, "", location.pathname);
    return true;
  } catch (err) {
    console.error("Failed to push shared content:", err);
    appError.value = "Could not push shared content to Drive.";
    return true;
  }
}

async function initializeDrive() {
  if (!isOnline.value) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  appError.value = "";

  try {
    await connectDrive();
    await refreshItems();

    const consumedShare = await consumeSharedContent();
    if (!consumedShare && !wasFileLaunchPending()) {
      // no-op: share and file launch flows push on their own callbacks
    }

    startPolling(() => {
      void refreshItems().catch((err) => {
        console.error("Failed to refresh Drive items:", err);
      });
    });
  } catch (err) {
    console.error("Failed to initialize Drive sync:", err);
    appError.value =
      err instanceof Error ? err.message : "Could not connect to Google Drive.";
  } finally {
    isLoading.value = false;
  }
}

registerFileLaunchConsumer((files) => {
  if (!isOnline.value) {
    appError.value = "Dabba requires an internet connection.";
    return;
  }

  isBusy.value = true;
  appError.value = "";

  void (async () => {
    try {
      await pushFiles(files);
    } catch (err) {
      console.error("Failed to push opened file:", err);
      appError.value =
        err instanceof Error ? err.message : "Could not push opened file.";
    } finally {
      isBusy.value = false;
    }
  })();
});

const onPageMount = () => {
  pageListeners = new AbortController();
  const { signal: abortSignal } = pageListeners;

  const setOnline = () => {
    isOnline.value = true;
    void initializeDrive();
  };
  const setOffline = () => {
    isOnline.value = false;
    stopPolling();
    appError.value = "Dabba requires an internet connection.";
  };

  window.addEventListener("online", setOnline, { signal: abortSignal });
  window.addEventListener("offline", setOffline, { signal: abortSignal });

  void initializeDrive();
};

const onPageUnmount = () => {
  stopPolling();
  pageListeners?.abort();
  pageListeners = undefined;
  void disconnectDrive();
};

export default HTMLPage({
  onMount: onPageMount,
  onUnmount: onPageUnmount,
  cssClasses: "ma0",
  body: m.Section({
    class: css("history"),
    "aria-labelledby": "dabba-title",
    children: [
      m.H1({
        id: "dabba-title",
        class: css("mv3"),
        children: "Dabba",
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
      m.Div({
        class: css("input-row"),
        children: [
          m.Button({
            type: "button",
            class: css("paste-zone"),
            disabled: zonesDisabled,
            onclick: () => {
              void handlePasteZoneClick();
            },
            children: [
              m.P({
                class: css("zone-label"),
                children: "Paste clipboard content",
              }),
              m.P({
                class: css("zone-hint"),
                children: "Click here, then allow clipboard access to upload.",
              }),
            ],
          }),
          m.Label({
            class: css("file-zone"),
            children: [
              m.P({
                class: css("zone-label"),
                children: "Open a file to share",
              }),
              m.P({
                class: css("zone-hint"),
                children: "Choose a file to push to Google Drive.",
              }),
              m.Input({
                type: "file",
                accept: "*/*",
                multiple: true,
                class: css("hidden-input"),
                disabled: zonesDisabled,
                onchange: handleFileInputChange,
              }),
            ],
          }),
        ],
      }),
      m.If({
        subject: isLoading,
        isTruthy: () =>
          m.P({
            class: css("history-empty"),
            children: "Loading items from Google Drive...",
          }),
        isFalsy: () =>
          m.If({
            subject: items.length(),
            isFalsy: () =>
              m.P({
                class: css("history-empty"),
                children:
                  "No shared items yet. Paste or upload something above.",
              }),
            isTruthy: () =>
              DriveItemList({
                items: items,
                disabled: zonesDisabled,
              }),
          }),
      }),
    ],
  }),
});
