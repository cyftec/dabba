import { WebAppManifest } from "web-app-manifest";

const assetsPath = "/assets";
const imagesPath = `${assetsPath}/images`;

type ChromeOnlyPwaManifest = {
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
  file_handlers: Array<{
    action: string;
    name: string;
    accept: Record<string, string[]>;
  }>;
};

const manifest: WebAppManifest & ChromeOnlyPwaManifest = {
  short_name: "Dabba",
  name: "Dabba",
  icons: [
    {
      src: `${imagesPath}/192_logo.png`,
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: `${imagesPath}/512_logo.png`,
      sizes: "512x512",
      type: "image/png",
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
          accept: ["image/*", "text/plain"],
        },
      ],
    },
  },
  file_handlers: [
    {
      action: "/",
      name: "Dabba",
      accept: {
        "image/apng": [".apng"],
        "image/avif": [".avif"],
        "image/bmp": [".bmp"],
        "image/gif": [".gif"],
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "image/svg+xml": [".svg"],
        "image/webp": [".webp"],
        "image/x-icon": [".ico"],
        "image/*": [
          ".apng",
          ".avif",
          ".bmp",
          ".gif",
          ".ico",
          ".jpg",
          ".jpeg",
          ".png",
          ".svg",
          ".webp",
        ],
      },
    },
  ],
};

export default manifest;
