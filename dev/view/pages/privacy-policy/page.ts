import { m } from "@cyftec/maya/core";
import { HTMLPage, LegalDocument } from "../../components/index";
import { css } from "../assets/styles";

export default HTMLPage({
  title: "Privacy Policy — Dabba",
  cssClasses: "ma0",
  body: LegalDocument({
    title: "Privacy Policy",
    children: [
      m.P({
        children:
          "Dabba is a cross-device clipboard and file sharing app published by Cyfer Tech. This policy explains what Dabba does and does not do with your information.",
      }),
      m.H2({
        class: css("legal-heading"),
        children: "We do not collect your data",
      }),
      m.P({
        children:
          "Dabba has no dedicated backend and does not operate its own database or cloud storage for your content. Cyfer Tech does not collect, store, sell, or receive the text, files, or other items you share through the app.",
      }),
      m.H2({
        class: css("legal-heading"),
        children: "Your Google account and Google Drive",
      }),
      m.P({
        children:
          "To sync content across your devices, Dabba uses Google APIs to access your Google account and store items in a folder in your own Google Drive. That content stays in your Google account under your control. When you sign in, Google handles authentication and may process information according to Google's privacy policy.",
      }),
      m.H2({
        class: css("legal-heading"),
        children: "Information stored on your device",
      }),
      m.P({
        children:
          "Dabba may store data locally in your browser or installed app, such as authentication tokens needed to stay signed in, cached app files for offline use, and temporary share-target data handled by the service worker. You can clear this local data at any time using the Refresh Page control on the homepage.",
      }),
      m.H2({
        class: css("legal-heading"),
        children: "Third-party services",
      }),
      m.P({
        children:
          "Dabba relies on Google services, including Google Sign-In and Google Drive. Your use of those services is governed by Google's terms and privacy policies. Cyfer Tech is not responsible for how Google processes your information.",
      }),
      m.H2({
        class: css("legal-heading"),
        children: "Changes to this policy",
      }),
      m.P({
        children:
          "We may update this privacy policy from time to time. Continued use of Dabba after changes are posted means you accept the updated policy.",
      }),
      m.H2({
        class: css("legal-heading"),
        children: "Contact",
      }),
      m.P({
        children: [
          "Questions about this policy can be sent through ",
          m.A({
            class: css("legal-link"),
            href: "https://www.cyfer.tech",
            rel: "noopener",
            target: "_blank",
            children: "Cyfer Tech",
          }),
          ".",
        ],
      }),
    ],
  }),
});
