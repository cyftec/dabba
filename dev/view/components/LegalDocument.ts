import { Children, component, m } from "@cyftec/maya/core";
import { css } from "../pages/assets/styles";
import { SiteFooter } from "./SiteFooter";

type LegalDocumentProps = {
  title: string;
  children: Children;
};

export const LegalDocument = component<LegalDocumentProps>(
  ({ title, children }) =>
    m.Section({
      class: css("legal-page"),
      children: [
        m.H1({
          class: css("legal-title"),
          children: title,
        }),
        m.Div({
          class: css("legal-content"),
          children,
        }),
        m.A({
          class: css("legal-back-button"),
          href: "/",
          children: "Back to homepage",
        }),
        SiteFooter({}),
      ],
    }),
);
