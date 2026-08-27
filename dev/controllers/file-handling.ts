type FileLaunchConsumer = (files: File[]) => void;

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

export async function filesFromFileHandles(
  handles: FileSystemFileHandle[],
): Promise<File[]> {
  const files: File[] = [];

  for (const handle of handles) {
    files.push(await handle.getFile());
  }

  return files;
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
    const files = await filesFromFileHandles(handles);
    if (files.length > 0) {
      consumer(files);
    }
  });
}
