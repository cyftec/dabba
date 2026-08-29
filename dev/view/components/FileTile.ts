import { component, m } from "@cyftec/maya/core";
import { derive, signal } from "@cyftec/maya/signals";
import { css } from "../pages/assets/styles";

type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
  fileBlob: Blob;
  isError?: boolean;
  text?: string;
  previewUrl?: string;
};

type FileTileProps = {
  item: DriveItem;
  onDownload: () => void;
  onCopy: () => void;
};

export const FileTile = component<FileTileProps>(
  ({ item, onDownload, onCopy }) => {
    const { name, mimeType } = item.props();
    const isError = derive(() => item.value.isError === true);
    const isText = mimeType.is.equalTo("text/plain");
    const isImage = mimeType.startsWith("image/");
    const text = derive(() => item.value.text ?? "EMPTY");
    const previewUrl = derive(() => item.value.previewUrl);
    const copyLabel = signal("Copy");

    const onCopyClick = () => {
      copyLabel.value = "Copied!!";
      onCopy();
      setTimeout(() => (copyLabel.value = "Copy"), 5000);
    };

    return m.Li({
      class: css("item-tile"),
      children: [
        m.If({
          subject: isError,
          isTruthy: () =>
            m.P({
              class: css("item-error"),
              children: derive(() => `Error downloading ${item.value.name}.`),
            }),
          isFalsy: () =>
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
                    }),
                }),
            }),
        }),
        m.Div({
          class: css("item-file-footer"),
          children: name,
        }),
        m.Div({
          class: css("item-actions"),
          children: [
            m.Button({
              type: "button",
              class: css("item-button"),
              onclick: onCopyClick,
              children: copyLabel,
            }),
            m.Button({
              type: "button",
              class: css("item-button"),
              onclick: onDownload,
              children: "Download",
            }),
          ],
        }),
      ],
    });
  },
);
