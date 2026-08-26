import { blobToDataUrl } from "./media.js";
import type { ClipboardEntry } from "./clipboard.js";

type FileLaunchConsumer = (entries: ClipboardEntry[]) => void;

type LaunchParams = {
  files?: FileSystemFileHandle[];
};

type LaunchQueue = {
  setConsumer(
    callback: (launchParams: LaunchParams) => void | Promise<void>,
  ): void;
};

let fileLaunchPending = false;

export function wasFileLaunchPending(): boolean {
  const pending = fileLaunchPending;
  fileLaunchPending = false;
  return pending;
}

const IMAGE_EXTENSION_PATTERN =
  /\.(apng|avif|bmp|gif|heic|heif|ico|jpe?g|png|svg|webp)$/i;

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true;
  }

  return IMAGE_EXTENSION_PATTERN.test(file.name);
}

export async function clipboardEntryFromFile(
  file: File,
): Promise<ClipboardEntry | null> {
  if (!isImageFile(file)) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    mediaType: "Image",
    text: file.name,
    imgSrc: await blobToDataUrl(file),
  };
}

export async function clipboardEntriesFromFileHandles(
  handles: FileSystemFileHandle[],
): Promise<ClipboardEntry[]> {
  const entries: ClipboardEntry[] = [];

  for (const handle of handles) {
    const entry = await clipboardEntryFromFile(await handle.getFile());
    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
}

export function registerFileLaunchConsumer(consumer: FileLaunchConsumer): void {
  const launchQueue = (window as Window & { launchQueue?: LaunchQueue })
    .launchQueue;
  if (!launchQueue) {
    return;
  }

  launchQueue.setConsumer(async (launchParams) => {
    const handles = launchParams.files ?? [];
    if (!handles.length) {
      return;
    }

    fileLaunchPending = true;
    const entries = await clipboardEntriesFromFileHandles(handles);
    if (entries.length > 0) {
      consumer(entries);
    }
  });
}
