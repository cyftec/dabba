import { m } from "@cyftec/maya/core";
import { signal } from "@cyftec/maya/signals";
import { css } from "./assets/styles";
import { ClipboardHistory } from "../components/ClipboardHistory";
import { HTMLPage } from "../components/index";
import {
  ClipboardEntry,
  clipboardEntryFromSharePayload,
  clipboardErrorMessage,
  consumeSharePayload,
  prependHistory,
  readClipboardEntry,
  registerFileLaunchConsumer,
  SHARE_TARGET_QUERY,
  wasFileLaunchPending,
} from "@controllers";

const clipboardHistory = signal<ClipboardEntry[]>([]);
const clipboardError = signal("");

async function refreshClipboard() {
  try {
    const entry = await readClipboardEntry();
    clipboardError.value = "";

    if (!entry) {
      return;
    }

    clipboardHistory.value = prependHistory(clipboardHistory.value, entry);
  } catch (err) {
    console.error("Failed to read clipboard contents:", err);
    const message = clipboardErrorMessage(err);
    if (message) {
      clipboardError.value = message;
    }
  }
}

async function consumeSharedContent() {
  if (!location.search.includes(SHARE_TARGET_QUERY)) {
    return false;
  }

  try {
    const payload = await consumeSharePayload();
    clipboardError.value = "";

    if (payload) {
      const entry = clipboardEntryFromSharePayload(payload);
      if (entry) {
        clipboardHistory.value = prependHistory(clipboardHistory.value, entry);
      }
    }

    history.replaceState({}, "", location.pathname);
    return true;
  } catch (err) {
    console.error("Failed to read shared content:", err);
    clipboardError.value = "Could not load shared content.";
    return true;
  }
}

let pageListeners: AbortController | undefined;

function addEntriesToHistory(entries: ClipboardEntry[]) {
  clipboardError.value = "";

  for (const entry of entries) {
    clipboardHistory.value = prependHistory(clipboardHistory.value, entry);
  }
}

registerFileLaunchConsumer((entries) => {
  addEntriesToHistory(entries);
});

const onPageMount = () => {
  pageListeners = new AbortController();

  void (async () => {
    const consumedShare = await consumeSharedContent();
    if (!consumedShare && !wasFileLaunchPending()) {
      await refreshClipboard();
    }
  })();

  window.addEventListener(
    "pageshow",
    () => {
      void (async () => {
        const consumedShare = await consumeSharedContent();
        if (!consumedShare) {
          await refreshClipboard();
        }
      })();
    },
    { signal: pageListeners.signal },
  );
};

const onPageUnmount = () => {
  pageListeners?.abort();
  pageListeners = undefined;
};

export default HTMLPage({
  onMount: onPageMount,
  onUnmount: onPageUnmount,
  onClick: () => {
    void refreshClipboard();
  },
  body: m.Section({
    class: css("history"),
    "aria-labelledby": "clipboard-history-title",
    children: [
      m.H1({
        id: "clipboard-history-title",
        class: css("ma2"),
        children: "Dabba",
      }),
      m.P({
        class: css("history-hint"),
        children:
          "Tap anywhere to refresh clipboard history, share to Dabba from mobile apps, or use Open With on Mac and other desktops to open image files in Dabba.",
      }),
      m.If({
        subject: clipboardError,
        isTruthy: () =>
          m.P({
            class: css("history-error"),
            role: "alert",
            children: clipboardError!,
          }),
      }),
      m.If({
        subject: clipboardHistory.length(),
        isFalsy: () =>
          m.P({
            class: css("history-empty"),
            children: "No clipboard items yet. Copy something, then tap here.",
          }),
        isTruthy: () =>
          ClipboardHistory({
            history: clipboardHistory,
          }),
      }),
    ],
  }),
});
