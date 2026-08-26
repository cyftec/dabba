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
  start_url: ".",
  scope: "/",
  display: "standalone",
  theme_color: "#ee4440",
  background_color: "#ffffff",
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
};

export default manifest;
