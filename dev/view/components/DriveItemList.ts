import { component, m } from "@cyftec/maya/core";
import { derive, effect, type Signal } from "@cyftec/maya/signals";
import { css } from "../pages/assets/styles";

type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  text?: string;
  previewUrl?: string;
};

type DriveItemListProps = {
  items: DriveItem[];
  disabled: Signal<boolean>;
  onDownload: (id: string, name: string) => void;
};

export const DriveItemList = component<DriveItemListProps>(
  ({ items, disabled, onDownload }) => {
    return m.Ul({
      class: css("item-grid"),
      children: m.For({
        subject: items,
        itemKey: "id",
        map: (item) => {
          const { name, mimeType, thumbnailLink } = item.props();
          const isText = mimeType.is.equalTo("text/plain");
          const isImage = mimeType.startsWith("image/");
          const text = derive(() => item.value.text ?? "EMPTY");
          const previewUrl = derive(() => item.value.previewUrl);

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
              m.If({
                subject: isText,
                isTruthy: () =>
                  m.P({
                    class: css("item-text"),
                    children: text,
                  }),
                isFalsy: () =>
                  m.If({
                    subject: isImage,
                    isTruthy: () =>
                      m.If({
                        subject: previewUrl,
                        isTruthy: (subjectPreviewUrl) =>
                          m.Img({
                            class: css("item-preview"),
                            alt: name,
                            src: subjectPreviewUrl,
                          }),
                        isFalsy: () => m.Span("previewUrl"),
                      }),
                    isFalsy: () =>
                      m.If({
                        subject: thumbnailLink,
                        isTruthy: () =>
                          m.Img({
                            class: css("item-preview"),
                            alt: name,
                            src: thumbnailLink,
                          }),
                        isFalsy: () => m.Span("DUFFER"),
                      }),
                  }),
              }),
              m.Div({
                class: css("item-actions"),
                children: m.Button({
                  type: "button",
                  class: css("item-button"),
                  disabled,
                  // onclick: () => onDownload(item.id, item.name),
                  onclick: () => onDownload(item.value.id, item.value.name),
                  children: "Download",
                }),
              }),
            ],
          });
        },
      }),
    });
  },
);
