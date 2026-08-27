// dev/controllers/drive-config.ts
var GOOGLE_CLIENT_ID = "862232516752-sn8vjtdkrhdfuf5lr6kej43kceap6d10.apps.googleusercontent.com";
// node_modules/@cyftec/drive-socket/src/errors/drive-api-error.ts
class DriveApiError extends Error {
  status;
  reason;
  constructor(message, status, reason) {
    super(message);
    this.name = "DriveApiError";
    this.status = status;
    this.reason = reason;
  }
}

// node_modules/@cyftec/drive-socket/src/errors/not-authenticated-error.ts
class NotAuthenticatedError extends Error {
  constructor(message = "Not authenticated. Call connect() first.") {
    super(message);
    this.name = "NotAuthenticatedError";
  }
}

// node_modules/@cyftec/drive-socket/src/errors/message-exists-error.ts
class MessageExistsError extends Error {
  fileName;
  constructor(fileName) {
    super(`Message file already exists: ${fileName}`);
    this.name = "MessageExistsError";
    this.fileName = fileName;
  }
}
// node_modules/@cyftec/drive-socket/src/errors/invalid-mime-error.ts
class InvalidMimeError extends Error {
  mimeType;
  constructor(mimeType, reason) {
    super(`Invalid MIME type "${mimeType}": ${reason}`);
    this.name = "InvalidMimeError";
    this.mimeType = mimeType;
  }
}
// node_modules/@cyftec/drive-socket/src/google/constants.ts
var DRIVE_APPDATA_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
var GSI_CLIENT_URL = "https://accounts.google.com/gsi/client";
var DRIVE_API = "https://www.googleapis.com/drive/v3";
var DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3";

// node_modules/@cyftec/drive-socket/src/google/auth/gogle-sign-in-loader.ts
var GoogleSignInLoader = (() => {
  let loadPromise = null;
  function load() {
    if (typeof google !== "undefined" && google.accounts?.oauth2) {
      return Promise.resolve();
    }
    if (!loadPromise) {
      loadPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = GSI_CLIENT_URL;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load Google Sign-In script: ${GSI_CLIENT_URL}`));
        document.head.appendChild(script);
      });
    }
    return loadPromise;
  }
  return { load };
})();

// node_modules/@cyftec/drive-socket/src/google/auth/google-oauth.ts
class GoogleOAuth {
  clientId;
  token = null;
  constructor(clientId) {
    this.clientId = clientId;
  }
  getAccessToken() {
    return this.token;
  }
  async connect() {
    await GoogleSignInLoader.load();
    await new Promise((resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: DRIVE_APPDATA_SCOPE,
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error ?? "OAuth failed"));
            return;
          }
          if (!google.accounts.oauth2.hasGrantedAllScopes(response, DRIVE_APPDATA_SCOPE)) {
            reject(new Error("drive.appdata scope not granted"));
            return;
          }
          this.token = response.access_token;
          resolve();
        }
      });
      client.requestAccessToken();
    });
  }
  async disconnect() {
    const token = this.token;
    if (!token)
      return;
    await new Promise((resolve) => {
      google.accounts.oauth2.revoke(token, () => {
        this.token = null;
        resolve();
      });
    });
  }
}
// node_modules/@cyftec/drive-socket/src/google/drive/parse-drive-error.ts
async function parseDriveError(response) {
  let message = `Drive API error: ${response.status}`;
  let reason = "unknown";
  try {
    const body = await response.json();
    message = body.error?.message ?? message;
    reason = body.error?.errors?.[0]?.reason ?? reason;
  } catch {}
  return new DriveApiError(message, response.status, reason);
}

// node_modules/@cyftec/drive-socket/src/google/drive/drive-client.ts
class GoogleDriveClient {
  oauth;
  constructor(oauth) {
    this.oauth = oauth;
  }
  encodeMultipart(metadata, fileBlob, mimeType) {
    const boundary = `drive_socket_${crypto.randomUUID()}`;
    const metaPart = `--${boundary}\r
Content-Type: application/json; charset=UTF-8\r
\r
${JSON.stringify(metadata)}\r
`;
    const filePartHeader = `--${boundary}\r
Content-Type: ${mimeType}\r
\r
`;
    const closing = `\r
--${boundary}--`;
    return new Blob([metaPart, filePartHeader, fileBlob, closing], {
      type: `multipart/related; boundary=${boundary}`
    });
  }
  buildQuery(contains, trashed = false, timeQuery) {
    const baseQuery = `name contains '${contains}' and trashed=${trashed}`;
    if (!timeQuery)
      return baseQuery;
    const exclusiveTimeComparison = timeQuery.relation === "since" ? ">" : "<";
    const timeComparison = exclusiveTimeComparison + (timeQuery.includingDate ? "=" : "");
    const dateISO = timeQuery.date.toISOString();
    return `${baseQuery} and createdTime ${timeComparison} '${dateISO}'`;
  }
  async request(path, init, base = DRIVE_API) {
    const token = this.oauth.getAccessToken();
    if (!token)
      throw new NotAuthenticatedError;
    const response = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...init?.headers
      }
    });
    if (!response.ok)
      throw await parseDriveError(response);
    return response;
  }
  async saveNewFile(fileName, mimeType, fileBlob, metadataFields = ["id", "name", "createdTime", "mimeType", "size"]) {
    const fileMetadata = {
      name: fileName,
      parents: ["appDataFolder"],
      mimeType
    };
    const body = this.encodeMultipart(fileMetadata, fileBlob, mimeType);
    const response = await this.request(`/files?uploadType=multipart&fields=${metadataFields.join(",")}`, { method: "POST", body }, DRIVE_UPLOAD);
    return await response.json();
  }
  async downloadFiles(query, options = {
    metadataFields: ["id", "name", "createdTime", "mimeType", "size"]
  }) {
    const params = new URLSearchParams({
      spaces: "appDataFolder",
      q: query,
      fields: `nextPageToken,files(${(options?.metadataFields || []).join(",")})`,
      pageSize: String(options?.pageSize ?? 100)
    });
    if (options?.orderBy)
      params.set("orderBy", options.orderBy);
    if (options?.pageToken)
      params.set("pageToken", options.pageToken);
    const response = await this.request(`/files?${params.toString()}`);
    return await response.json();
  }
  async downloadFile(fileId) {
    const response = await this.request(`/files/${fileId}?alt=media`);
    return response.blob();
  }
  async deleteFile(fileId) {
    await this.request(`/files/${fileId}`, { method: "DELETE" });
  }
  async fileExists(fileName) {
    const result = await this.downloadFiles(`name='${fileName.replace(/'/g, "\\'")}'`);
    return (result.files?.length ?? 0) > 0;
  }
}
// node_modules/@cyftec/drive-socket/src/google/mime-helpers.ts
var MIME_TO_EXTENSION = {
  "application/atom+xml": "atom",
  "application/epub+zip": "epub",
  "application/gzip": "gz",
  "application/json": "json",
  "application/ld+json": "jsonld",
  "application/msword": "doc",
  "application/octet-stream": "bin",
  "application/pdf": "pdf",
  "application/pkcs7-mime": "p7m",
  "application/pkcs8": "p8",
  "application/postscript": "ps",
  "application/rtf": "rtf",
  "application/vnd.amazon.ebook": "azw",
  "application/vnd.android.package-archive": "apk",
  "application/vnd.apple.installer+xml": "mpkg",
  "application/vnd.apple.pkpass": "pkpass",
  "application/vnd.google-apps.audio": "gdaudio",
  "application/vnd.google-apps.document": "gdoc",
  "application/vnd.google-apps.drawing": "gdraw",
  "application/vnd.google-apps.drive-sdk": "gdrive-sdk",
  "application/vnd.google-apps.file": "gfile",
  "application/vnd.google-apps.folder": "gfolder",
  "application/vnd.google-apps.form": "gform",
  "application/vnd.google-apps.fusiontable": "gtable",
  "application/vnd.google-apps.jam": "gjam",
  "application/vnd.google-apps.map": "gmap",
  "application/vnd.google-apps.photo": "gphoto",
  "application/vnd.google-apps.presentation": "gslides",
  "application/vnd.google-apps.script": "gscript",
  "application/vnd.google-apps.shortcut": "gshortcut",
  "application/vnd.google-apps.site": "gsite",
  "application/vnd.google-apps.spreadsheet": "gsheet",
  "application/vnd.google-apps.video": "gvideo",
  "application/vnd.ms-excel": "xls",
  "application/vnd.ms-excel.sheet.macroenabled.12": "xlsm",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.ms-powerpoint.presentation.macroenabled.12": "pptm",
  "application/vnd.ms-word.document.macroenabled.12": "docm",
  "application/vnd.oasis.opendocument.chart": "odc",
  "application/vnd.oasis.opendocument.database": "odb",
  "application/vnd.oasis.opendocument.formula": "odf",
  "application/vnd.oasis.opendocument.graphics": "odg",
  "application/vnd.oasis.opendocument.presentation": "odp",
  "application/vnd.oasis.opendocument.spreadsheet": "ods",
  "application/vnd.oasis.opendocument.text": "odt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.rar": "rar",
  "application/vnd.visio": "vsd",
  "application/wasm": "wasm",
  "application/x-7z-compressed": "7z",
  "application/x-bittorrent": "torrent",
  "application/x-bzip": "bz",
  "application/x-bzip2": "bz2",
  "application/x-cdf": "cdf",
  "application/x-csh": "csh",
  "application/x-debian-package": "deb",
  "application/x-freearc": "arc",
  "application/x-gtar": "gtar",
  "application/x-httpd-php": "php",
  "application/x-msdownload": "exe",
  "application/x-sh": "sh",
  "application/x-shockwave-flash": "swf",
  "application/x-tar": "tar",
  "application/x-www-form-urlencoded": "urlencoded",
  "application/x-x509-ca-cert": "crt",
  "application/x-yaml": "yaml",
  "application/xml": "xml",
  "application/zip": "zip",
  "audio/aac": "aac",
  "audio/flac": "flac",
  "audio/midi": "midi",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "oga",
  "audio/opus": "opus",
  "audio/wav": "wav",
  "audio/webm": "weba",
  "audio/x-m4a": "m4a",
  "audio/x-wav": "wav",
  "font/collection": "ttc",
  "font/otf": "otf",
  "font/ttf": "ttf",
  "font/woff": "woff",
  "font/woff2": "woff2",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/tiff": "tiff",
  "image/vnd.microsoft.icon": "ico",
  "image/webp": "webp",
  "image/x-icon": "ico",
  "model/gltf+json": "gltf",
  "model/gltf-binary": "glb",
  "model/obj": "obj",
  "model/stl": "stl",
  "text/calendar": "ics",
  "text/csv": "csv",
  "text/markdown": "md",
  "text/plain": "txt",
  "text/tab-separated-values": "tsv",
  "text/vcard": "vcf",
  "text/vtt": "vtt",
  "text/xml": "xml",
  "video/3gpp": "3gp",
  "video/mp2t": "ts",
  "video/mp4": "mp4",
  "video/mpeg": "mpeg",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-flv": "flv",
  "video/x-matroska": "mkv",
  "video/x-msvideo": "avi"
};
var SUPPORTED_MIME_TYPES = Object.keys(MIME_TO_EXTENSION);
function isValidMimeType(mimeType) {
  return mimeType in MIME_TO_EXTENSION;
}
function mimeToExtension(mimeType) {
  return MIME_TO_EXTENSION[mimeType];
}

// node_modules/@cyftec/drive-socket/src/drive-socket/socket.ts
class DriveSocket {
  oauth;
  gDriveClient;
  filenamePrefix = "msg-";
  baseQuery;
  metadataFields = new Set([
    "id",
    "name",
    "createdTime",
    "mimeType",
    "size"
  ]);
  constructor(config, metadataFields) {
    this.oauth = new GoogleOAuth(config.clientId);
    this.gDriveClient = new GoogleDriveClient(this.oauth);
    this.baseQuery = this.gDriveClient.buildQuery(this.filenamePrefix);
    metadataFields?.forEach((field) => this.metadataFields.add(field));
  }
  getTimedQuery(timeQuery) {
    return this.gDriveClient.buildQuery(this.filenamePrefix, false, timeQuery);
  }
  async collectFileMessageMetadata(query, orderBy) {
    const metadata = [];
    const metadataFields = [...this.metadataFields];
    let pageToken;
    do {
      const result = await this.gDriveClient.downloadFiles(query, {
        pageToken,
        orderBy,
        metadataFields
      });
      for (const file of result.files ?? [])
        metadata.push(file);
      pageToken = result.nextPageToken;
    } while (pageToken);
    return metadata;
  }
  async deleteFileMessageMetadata(metadata, dryRun, keptCount = 0) {
    if (dryRun) {
      return { deleted: metadata, deletedCount: metadata.length, keptCount };
    }
    for (const file of metadata)
      await this.gDriveClient.deleteFile(file.id);
    return { deleted: metadata, deletedCount: metadata.length, keptCount };
  }
  newFileName(extension, length = 8) {
    const randomSuffix = crypto.randomUUID().replace(/-/g, "").slice(0, length);
    const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    return `msg-${timestamp}-${randomSuffix}.${extension}`;
  }
  sortMetadataFilesByCreatedTimeDesc(files) {
    return [...files].sort((a, b) => {
      const timeDiff = b.createdTime.localeCompare(a.createdTime);
      return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
    });
  }
  connect() {
    return this.oauth.connect();
  }
  disconnect() {
    return this.oauth.disconnect();
  }
  isAuthenticated() {
    return this.oauth.getAccessToken() !== null;
  }
  async push(fileBlob, options) {
    const { mimeType } = options;
    if (!isValidMimeType(mimeType)) {
      throw new InvalidMimeError(mimeType, "not supported");
    }
    const fileName = this.newFileName(mimeToExtension(mimeType));
    if (await this.gDriveClient.fileExists(fileName)) {
      throw new MessageExistsError(fileName);
    }
    const metadata = await this.gDriveClient.saveNewFile(fileName, mimeType, fileBlob, [...this.metadataFields]);
    return { ...metadata, fileBlob };
  }
  async receive(options) {
    const metadataList = this.sortMetadataFilesByCreatedTimeDesc(await this.collectFileMessageMetadata(this.getTimedQuery(options.timeQuery), "createdTime desc"));
    const selectedMetadataList = options.limit ? metadataList.slice(0, options.limit) : metadataList;
    if (options.as === "file-message-metadata")
      return selectedMetadataList;
    const messages = [];
    for (const metadata of selectedMetadataList) {
      const fileBlob = await this.gDriveClient.downloadFile(metadata.id);
      messages.push({ ...metadata, fileBlob });
    }
    return messages;
  }
  async getById(fileId) {
    const fields = [...this.metadataFields].join(",");
    const response = await this.gDriveClient.request(`/files/${fileId}?fields=${fields}`);
    const metadata = await response.json();
    const fileBlob = await this.gDriveClient.downloadFile(fileId);
    return { ...metadata, fileBlob };
  }
  async pruneByCount(options) {
    if (options.keep < 0)
      throw new RangeError("keep must be >= 0");
    const metadata = this.sortMetadataFilesByCreatedTimeDesc(await this.collectFileMessageMetadata(this.baseQuery, "createdTime desc"));
    const toDelete = metadata.slice(options.keep);
    return this.deleteFileMessageMetadata(toDelete, options.dryRun, metadata.length - toDelete.length);
  }
  async pruneBefore(options) {
    const all = await this.collectFileMessageMetadata(this.baseQuery);
    const beforeTimeQuery = {
      date: options.before,
      includingDate: false,
      relation: "until"
    };
    const toDelete = await this.collectFileMessageMetadata(this.getTimedQuery(beforeTimeQuery));
    return this.deleteFileMessageMetadata(toDelete, options.dryRun, all.length - toDelete.length);
  }
}

// dev/controllers/drive-sync.ts
var socket = new DriveSocket({ clientId: GOOGLE_CLIENT_ID }, [
  "webContentLink"
]);
var textCache = new Map;
// dev/controllers/media.ts
async function blobToDataUrl(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0;i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return `data:${blob.type || "application/octet-stream"};base64,${btoa(binary)}`;
}
// dev/controllers/share-target.ts
var SHARE_TARGET_CACHE = "dabba-share-target-v1";
var SHARE_TARGET_PAYLOAD_KEY = "/dabba/share-target/payload";
var SHARE_TARGET_ACTION = "/share";
var SHARE_TARGET_QUERY = "share-target";
async function sharePayloadFromFormData(formData) {
  const title = String(formData.get("title") ?? "");
  const text = String(formData.get("text") ?? "");
  const url = String(formData.get("url") ?? "");
  const files = [];
  for (const entry of formData.getAll("files")) {
    if (!(entry instanceof File) || entry.size === 0) {
      continue;
    }
    files.push({
      name: entry.name,
      type: entry.type || "application/octet-stream",
      dataUrl: await blobToDataUrl(entry)
    });
  }
  return { title, text, url, files };
}
async function storeSharePayload(payload) {
  const cache = await caches.open(SHARE_TARGET_CACHE);
  await cache.put(SHARE_TARGET_PAYLOAD_KEY, new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" }
  }));
}
async function handleShareTargetRequest(request) {
  const formData = await request.formData();
  const payload = await sharePayloadFromFormData(formData);
  await storeSharePayload(payload);
  const redirectUrl = new URL("/", self.location.origin);
  redirectUrl.searchParams.set(SHARE_TARGET_QUERY, "1");
  return Response.redirect(redirectUrl.href, 303);
}
// dev/view/pages/service-worker.ts
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === SHARE_TARGET_ACTION) {
    event.respondWith(handleShareTargetRequest(event.request));
  }
});
