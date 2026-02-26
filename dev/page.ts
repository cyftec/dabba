import { m } from "@mufw/maya";
import { HTMLPage } from "./components";
import { signal } from "@cyftech/signal";

const copiedItemType = signal("");
const copiedText = signal("");
const imgSrc = signal("");

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  const base64 = btoa(binary);
  return `data:${blob.type};base64,${base64}`;
}

async function getClipboardText() {
  try {
    const clipboardContents = await navigator.clipboard.read();
    for (const item of clipboardContents) {
      copiedItemType.value = item.types.toString();
      if (item.types.some((itemType) => itemType.startsWith("image/"))) {
        console.log(`image copied`);
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
    if (err.name === "NotAllowedError") {
      alert(
        "Permission to access clipboard was denied. Please grant permission in your browser settings.",
      );
    } else if (err.name === "SecurityError") {
      alert(
        "Clipboard access is restricted due to security policies (e.g., not on HTTPS).",
      );
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
  body: m.Div([
    m.H1({
      children: "Dabba",
    }),
    m.Img({
      width: "200",
      src: imgSrc,
    }),
    m.Div(copiedItemType),
    m.Div(copiedText),
  ]),
});
