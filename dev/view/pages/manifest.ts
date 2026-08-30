import { MIME_TO_EXTENSION } from "@cyftec/drive-socket";
import { WebAppManifest } from "web-app-manifest";

const assetsPath = "/assets";
const imagesPath = `${assetsPath}/images`;

const fileHandlerAccept = Object.fromEntries(
  Object.entries(MIME_TO_EXTENSION).map(([mimeType, extension]) => [
    mimeType,
    [`.${extension}`],
  ]),
) as Record<string, string[]>;

type ChromeShareTargetManifest = {
  share_target: {
    action: string;
    method: string;
    enctype: string;
    params: {
      title: string;
      text: string;
      url: string;
      files: Array<{
        name: string;
        accept: string[];
      }>;
    };
  };
};

type ChromeFileHandlerManifest = {
  file_handlers: Array<{
    action: string;
    accept: Record<string, string[]>;
    launch_type: "single-client";
  }>;
};

type ChromeLaunchHandlerManifest = {
  launch_handler: {
    client_mode: "focus-existing";
  };
};

const manifest: WebAppManifest &
  ChromeShareTargetManifest &
  ChromeFileHandlerManifest &
  ChromeLaunchHandlerManifest = {
  id: "/",
  short_name: "Dabba",
  name: "Dabba",
  description:
    "Share clipboard content and files across your devices via Google Drive.",
  icons: [
    {
      src: `${imagesPath}/192_dabba.png`,
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: `${imagesPath}/512_dabba.png`,
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: `${imagesPath}/192_dabba.png`,
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: `${imagesPath}/512_dabba.png`,
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
  start_url: "/",
  scope: "/",
  display: "standalone",
  theme_color: "#ee4440",
  background_color: "#ffffff",
  launch_handler: {
    client_mode: "focus-existing",
  },
  file_handlers: [
    {
      action: "/",
      accept: fileHandlerAccept,
      launch_type: "single-client",
    },
  ],
  share_target: {
    action: "/share",
    method: "POST",
    enctype: "multipart/form-data",
    params: {
      title: "title",
      text: "text",
      url: "url",
      files: [
        {
          name: "files",
          accept: ["*/*"],
        },
      ],
    },
  },
};

export default manifest;
