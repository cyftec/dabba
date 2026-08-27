import { component, m } from "@cyftec/maya/core";
import type { Signal } from "@cyftec/maya/signals";
import { css } from "../pages/assets/styles";

type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
  webContentLink: string;
};

type DriveItemListProps = {
  items: DriveItem[];
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
          const { name, mimeType, webContentLink } = item.props();

          return m.Li({
            class: css("item-tile"),
            children: [
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
                  download: name,
                  target: "_blank",
                  rel: "noopener",
                  children: "Download",
                }),
              }),
            ],
          });
        },
      }),
    }),
);
