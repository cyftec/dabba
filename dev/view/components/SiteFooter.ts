import { component, m } from "@cyftec/maya/core";
import { css } from "../pages/assets/styles";

export const SiteFooter = component<Record<string, never>>(() =>
  m.Footer({
    class: css("site-footer"),
    children: [
      m.A({
        class: css("site-footer-brand"),
        href: "https://www.cyfer.tech",
        rel: "noopener",
        target: "_blank",
        children: [
          m.Img({
            class: css("site-footer-logo"),
            src: "/assets/images/512_dabba.png",
            alt: "Cyfer Tech",
            height: "24",
            width: "24",
          }),
          m.Span({ children: "Cyfer Tech" }),
        ],
      }),
      m.Nav({
        class: css("site-footer-links"),
        "aria-label": "Legal",
        children: [
          m.A({
            class: css("footer-link mh3"),
            href: "/privacy-policy/",
            children: "Privacy Policy",
          }),
          m.A({
            class: css("footer-link mh3"),
            href: "/terms-of-service/",
            children: "Terms of Service",
          }),
        ],
      }),
      m.P({
        class: css("site-footer-maya"),
        children: [
          "This app is created using ",
          m.A({
            class: css("legal-link"),
            href: "https://maya.cyfer.tech",
            rel: "noopener",
            target: "_blank",
            children: "Maya",
          }),
        ],
      }),
    ],
  }),
);
