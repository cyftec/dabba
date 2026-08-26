import { effect, signal } from "@cyftec/maya/signals";
import { ClipboardHistory } from "./components/ClipboardHistory.js";
import { HTMLPage } from "./components/index.js";
import {
  clipboardErrorMessage,
  prependHistory,
  readClipboardEntry,
  type ClipboardEntry,
} from "./clipboard.js";
import { m } from "@cyftec/maya/core";
import { css } from "./assets/styles.js";

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

let pageListeners: AbortController | undefined;

const onPageMount = () => {
  pageListeners = new AbortController();
  void refreshClipboard();
  window.addEventListener(
    "pageshow",
    () => {
      void refreshClipboard();
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
        children: "Tap anywhere to refresh. Newest copy appears at the top.",
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
