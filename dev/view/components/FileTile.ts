import { component, m } from "@cyftec/maya/core";
import { derive, op, signal } from "@cyftec/maya/signals";
import { css } from "../pages/assets/styles";
import { FileIcon } from "./FileIcon";
import {
  fileExtensionColors,
  MIME_TO_EXTENSION,
  SupportedMimeType,
} from "@cyftec/drive-socket";
import { Icon, IconName } from "./Icon";

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
    const fileExtension = derive(
      () => MIME_TO_EXTENSION[mimeType.value as SupportedMimeType],
    );
    const fileExtensionColor = derive(
      () => fileExtensionColors[fileExtension.value],
    );
    const textOrImage = op(isText).or(isImage).truthy;
    const copyIconName = signal<IconName>("content_copy");
    const copyIconColor = signal("#666");

    const onCopyClick = () => {
      copyIconName.value = "done_all";
      copyIconColor.value = "dodgerblue";
      onCopy();
      setTimeout(() => {
        copyIconName.value = "content_copy";
        copyIconColor.value = "#666";
      }, 2000);
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
        m.If({
          subject: textOrImage,
          isTruthy: () =>
            m.Div({
              onclick: onCopyClick,
              class: css("copy-icon"),
              children: Icon({ name: copyIconName, color: copyIconColor }),
            }),
          isFalsy: () =>
            m.Div({
              class: css("nl3 nt1 pl1 mb2"),
              children: FileIcon({
                size: 80,
                color: fileExtensionColor,
                extension: fileExtension,
              }),
            }),
        }),
        m.Div({
          class: css("item-actions"),
          children: [
            m.Div({
              class: css("item-file-name"),
              children: name,
            }),
            m.Div({
              class: css("item-actions-buttons"),
              children: [
                m.Button({
                  type: "button",
                  class: css("item-button"),
                  onclick: onCopyClick,
                  children: "Delete",
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
        }),
      ],
    });
  },
);
