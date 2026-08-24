import { m } from "@cyftec/maya/core";
import { HTMLPage } from "./components";
import { signal } from "@cyftec/maya/signals";

const copiedMediaType = signal("");
const copiedText = signal("");
const imgSrc = signal("");

async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }

  const base64 = btoa(binary);
  return `data:${blob.type};base64,${base64}`;
}

async function updateCopiedMediaType() {
  try {
    const clipboardItems = await navigator.clipboard.read();
    if (!clipboardItems.length) {
      console.error("Clipboard is empty");
      return;
    }

    for (const item of clipboardItems) {
      console.log(item);
      for (const type of item.types) {
        if (type.startsWith("image/")) {
          copiedMediaType.value = "Image";
        } else if (type === "text/plain") {
          copiedMediaType.value = "Plain text";
        } else if (type === "text/html") {
          copiedMediaType.value = "HTML text";
        } else if (type.startsWith("video/")) {
          copiedMediaType.value = "Video";
        } else if (type.startsWith("audio/")) {
          copiedMediaType.value = "Audio";
        } else {
          copiedMediaType.value = "Other type";
        }
      }
    }
  } catch (err) {
    console.error("Failed to read clipboard:", err);
  }
}

async function getClipboardText() {
  updateCopiedMediaType();
  try {
    const clipboardContents = await navigator.clipboard.read();
    for (const item of clipboardContents) {
      if (item.types.some((itemType) => itemType.startsWith("image/"))) {
        const type = item.types.find((t) => t.startsWith("image/")) as string;
        const blob = await item.getType(type);
        imgSrc.value = await blobToBase64(blob);
      }
      if (item.types.includes("text/plain")) {
        const blob = await item.getType("text/plain");
        const text = await blob.text();
        if (
          (text.startsWith("http://") || text.startsWith("https://")) &&
          (text.endsWith(".gif") || text.endsWith(".png"))
        ) {
          imgSrc.value = text;
          return;
        }
        copiedText.value = text;
      }
    }
  } catch (err) {
    console.error("Failed to read clipboard contents:", err);
    // Handle cases where permission is denied or clipboard is empty/not text
    if (err instanceof Error) {
      if (err.name === "NotAllowedError") {
        alert(
          "Permission to access clipboard was denied. Please grant permission in your browser settings.",
        );
      } else if (err.name === "SecurityError") {
        alert(
          "Clipboard access is restricted due to security policies (e.g., not on HTTPS).",
        );
      }
    } else {
      // alert("Could not read from clipboard. Is there text copied?");
    }
  }
}

const onPageMount = () => {
  getClipboardText();
  window.addEventListener("pageshow", getClipboardText);
};

export default HTMLPage({
  onMount: onPageMount,
  onClick: getClipboardText,
  body: m.Div([
    m.H1({
      children: "Dabba",
    }),
    m.Img({
      width: "200",
      src: imgSrc,
    }),
    m.Div(copiedMediaType),
    m.Div({
      class: "",
      children: copiedText,
    }),
  ]),
});
