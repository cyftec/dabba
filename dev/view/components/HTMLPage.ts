import { Child, component, m } from "@cyftec/maya/core";

type HTMLPageProps = {
  cssClasses?: string;
  body: Child;
  onMount?: () => void;
  onUnmount?: () => void;
  title?: string;
};

export const HTMLPage = component<HTMLPageProps>(
  ({ cssClasses, body, onMount, onUnmount, title = "Dabba (by Cyfer)" }) => {
    return m.Html({
      lang: "en",
      children: [
        m.Head({
          children: [
            m.Meta({
              "http-equiv": "Content-Security-Policy",
              content: `
                script-src 'self' https://accounts.google.com;
                style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com;
                font-src https://fonts.gstatic.com;
                connect-src 'self' https://www.googleapis.com https://oauth2.googleapis.com https://accounts.google.com;
                img-src 'self' data: blob: https:;
                frame-src https://accounts.google.com;
                object-src 'none';
                base-uri 'none';
              `,
            }),
            m.Title(title),
            m.Link({
              rel: "icon",
              type: "image/x-icon",
              href: "/assets/images/favicon.ico",
            }),
            m.Meta({ charset: "UTF-8" }),
            m.Meta({ "http-equiv": "X-UA-Compatible", content: "IE=edge" }),
            m.Meta({
              name: "viewport",
              content: "width=device-width, initial-scale=1.0",
            }),
            m.Link({ rel: "stylesheet", href: "/assets/styles.css" }),
            m.Link({ rel: "manifest", href: "/manifest.json" }),
            m.Script({ src: "/app.js", defer: true }),
            m.Script({ src: "main.js", defer: true }),
          ],
        }),
        m.Body({
          tabindex: "-1",
          class: cssClasses,
          onmount: onMount,
          onunmount: onUnmount,
          children: body,
        }),
      ],
    });
  },
);
