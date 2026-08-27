import { m } from "@cyftec/maya/core";
import { derive, signal } from "@cyftec/maya/signals";
import { css } from "./assets/styles";
import {
  ContentInput,
  DriveItemList,
  EmptyListMessage,
  HTMLPage,
} from "../components/index";
import {
  clipboardErrorMessage,
  connectDrive,
  consumeSharePayload,
  disconnectDrive,
  enrichItemsWithFileBlob,
  isDriveAuthenticated,
  loadMetadataItems,
  pushFile,
  pushSharePayloadToDrive,
  pushText,
  readClipboardForPush,
  registerFileLaunchConsumer,
  SHARE_TARGET_QUERY,
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
let isConnecting = false;
let initialLoadActive = true;
let pendingInitialFocusRefresh = false;
let loadInFlight = false;

async function refreshItems() {
  const metadataItems = await loadMetadataItems();
  items.value = metadataItems;
  isLoading.value = false;
  enrichItemsWithFileBlob(metadataItems, (updated: DabbaItem) => {
    items.value = items.value.map((existing) =>
      existing.id === updated.id ? updated : existing,
    );
  });
}

async function loadDriveContent() {
  if (!isOnline.value) {
    isLoading.value = false;
    return;
  }

  if (loadInFlight) {
    if (initialLoadActive) {
      pendingInitialFocusRefresh = true;
    }
    return;
  }

  loadInFlight = true;
  isLoading.value = true;
  appError.value = "";

  try {
    if (!isDriveAuthenticated()) {
      isConnecting = true;
      try {
        await connectDrive();
      } catch (err) {
        console.error("Failed to connect to Google Drive:", err);
        appError.value =
          err instanceof Error
            ? err.message
            : "Could not connect to Google Drive.";
        isLoading.value = false;
        return;
      } finally {
        isConnecting = false;
      }
    }

    await refreshItems();
  } catch (err) {
    console.error("Failed to load Drive items:", err);
    appError.value =
      err instanceof Error ? err.message : "Could not load items from Drive.";
    isLoading.value = false;
  } finally {
    loadInFlight = false;
  }
}

async function reloadContent() {
  if (isLoading.value || isBusy.value) {
    return;
  }

  await loadDriveContent();
}

async function refreshOnInitialLoadFocus() {
  if (!initialLoadActive || !isOnline.value || isBusy.value) {
    return;
  }

  if (isConnecting || isLoading.value || loadInFlight) {
    pendingInitialFocusRefresh = true;
    return;
  }

  await loadDriveContent();
}

async function pushFiles(files: File[]) {
  for (const file of files) {
    await pushFile(file, file.type || "application/octet-stream");
  }
  await refreshItems();
}

async function onPasteZoneTap() {
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

async function onFileInputChange(event: Event) {
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
      err instanceof Error ? err.message : "Could not push the file to Drive.";
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
  initialLoadActive = true;
  pendingInitialFocusRefresh = false;

  if (!isOnline.value) {
    isLoading.value = false;
    initialLoadActive = false;
    return;
  }

  await loadDriveContent();

  try {
    const consumedShare = await consumeSharedContent();
    if (!consumedShare && !wasFileLaunchPending()) {
      // no-op: share and file launch flows push on their own callbacks
    }
  } catch (err) {
    console.error("Failed to consume shared content:", err);
  }

  if (pendingInitialFocusRefresh) {
    pendingInitialFocusRefresh = false;
    await loadDriveContent();
  }

  initialLoadActive = false;
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
    appError.value = "Dabba requires an internet connection.";
  };

  const onInitialLoadFocus = () => {
    void refreshOnInitialLoadFocus();
  };

  window.addEventListener("online", setOnline, { signal: abortSignal });
  window.addEventListener("offline", setOffline, { signal: abortSignal });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "visible") {
        onInitialLoadFocus();
      }
    },
    { signal: abortSignal },
  );
  window.addEventListener("pageshow", onInitialLoadFocus, {
    signal: abortSignal,
  });
  window.addEventListener("focus", onInitialLoadFocus, { signal: abortSignal });

  void initializeDrive();
};

const onPageUnmount = () => {
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
            disabled: isLoading,
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
        subject: isLoading,
        isTruthy: () => EmptyListMessage({ isListLoading: true }),
        isFalsy: () =>
          m.If({
            subject: items.length(),
            isFalsy: () => EmptyListMessage({ isListLoading: false }),
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
