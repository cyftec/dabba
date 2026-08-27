import { component, m } from "@cyftec/maya/core";
import { derive, type Signal } from "@cyftec/maya/signals";
import { css } from "../pages/assets/styles";
import type { DabbaItem } from "@controllers";

type DriveItemListProps = {
  items: DabbaItem[];
  disabled: Signal<boolean>;
};

export const DriveItemList = component<DriveItemListProps>(
  ({ items, disabled }) =>
    m.Ul({
      class: css("item-grid"),
      children: m.For({
        subject: items,
        itemKey: "id",
        map: (item) => {
          const { name, mimeType, text, webContentLink, isText } = item.props();

          return m.Li({
            class: css("item-tile"),
            children: m.If({
              subject: isText,
              isTruthy: () => [
                m.P({
                  class: css("item-text"),
                  children: derive(() => item.value.text || ""),
                }),
                m.Div({
                  class: css("item-actions"),
                  children: [
                    m.Button({
                      type: "button",
                      class: css("item-button"),
                      disabled,
                      onclick: () => {
                        if (!text) {
                          return;
                        }
                        const currentText = text.value;
                        if (currentText) {
                          void navigator.clipboard.writeText(currentText);
                        }
                      },
                      children: "Copy text",
                    }),
                    m.A({
                      class: css("item-button"),
                      href: disabled.if
                        .truthy()
                        .then(undefined, webContentLink),
                      download: name,
                      target: "_blank",
                      rel: "noopener",
                      children: "Download as .TXT file",
                    }),
                  ],
                }),
              ],
              isFalsy: () => [
                m.Div({
                  class: css("item-file-header"),
                  children: [
                    m.Span({
                      class: css("fw7"),
                      children: name,
                    }),
                    m.Span({
                      class: css("gray"),
                      children: mimeType,
                    }),
                  ],
                }),
                m.Div({
                  class: css("item-actions"),
                  children: m.A({
                    class: css("item-button"),
                    href: disabled.if.truthy().then(undefined, webContentLink),
                    target: "_blank",
                    rel: "noopener",
                    children: "Download",
                  }),
                }),
              ],
            }),
          });
        },
      }),
    }),
);
