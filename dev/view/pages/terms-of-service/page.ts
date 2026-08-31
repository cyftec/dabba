import { m } from "@cyftec/maya/core";
import { HTMLPage, LegalDocument } from "../../components/index";
import { css } from "../assets/styles";

export default HTMLPage({
  title: "Terms of Service — Dabba",
  cssClasses: "ma0",
  body: LegalDocument({
    title: "Terms of Service",
    children: [
      m.P({
        children:
          "These terms govern your use of Dabba, a progressive web app published by Cyfer Tech. By using Dabba, you agree to these terms.",
      }),
      m.H2({
        class: css("legal-heading"),
        children: "The service",
      }),
      m.P({
        children:
          "Dabba lets you paste or upload content and access it across your devices. The app does not provide its own backend or hosted storage. Instead, it uses Google APIs so you can work with content stored in your own Google Drive account.",
      }),
      m.H2({
        class: css("legal-heading"),
        children: "Your account and content",
      }),
      m.P({
        children:
          "You are responsible for signing in with a Google account you are authorized to use and for the content you choose to store or share through Dabba. Items are saved to a folder in your Google Drive. You must comply with Google's terms of service and any applicable laws when using the app.",
      }),
      m.H2({
        class: css("legal-heading"),
        children: "Acceptable use",
      }),
      m.P({
        children:
          "Do not use Dabba to store, transmit, or share unlawful, harmful, or infringing material. Do not attempt to interfere with the app, Google services, or other users' accounts or data.",
      }),
      m.H2({
        class: css("legal-heading"),
        children: "No data collection by Cyfer Tech",
      }),
      m.P({
        children:
          "Cyfer Tech does not operate a Dabba backend that collects or stores your shared content. Availability of the service depends on your device, browser, network connection, and Google services.",
      }),
      m.H2({
        class: css("legal-heading"),
        children: "Disclaimer of warranties",
      }),
      m.P({
        children:
          'Dabba is provided "as is" and "as available" without warranties of any kind, whether express or implied, including fitness for a particular purpose, reliability, or uninterrupted availability.',
      }),
      m.H2({
        class: css("legal-heading"),
        children: "Limitation of liability",
      }),
      m.P({
        children:
          "To the fullest extent permitted by law, Cyfer Tech will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of data, profits, or business arising from your use of Dabba or Google services.",
      }),
      m.H2({
        class: css("legal-heading"),
        children: "Changes to these terms",
      }),
      m.P({
        children:
          "We may update these terms from time to time. Continued use of Dabba after updated terms are posted means you accept the revised terms.",
      }),
      m.H2({
        class: css("legal-heading"),
        children: "Contact",
      }),
      m.P({
        children: [
          "Questions about these terms can be sent through ",
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
