import {
  fileExtensionColors,
  MIME_TO_EXTENSION,
  SupportedMimeType,
} from "@cyftec/drive-socket";
import { component, m } from "@cyftec/maya/core";
import { derive, op } from "@cyftec/maya/signals";
import { resettableSignal } from "@controllers/resettable-signal";
import { css } from "../pages/assets/styles";
import { FileIcon } from "./FileIcon";
import { Icon, IconName } from "./Icon";

type DriveItem = {
  id: string;
  name: string;
  createdTime: string;
  mimeType: string;
  fileBlob: Blob;
  isError?: boolean;
  text?: string;
  previewUrl?: string;
};

type FileTileProps = {
  item: DriveItem;
  onCopy: () => void;
  onDelete: () => void;
  onDownload: () => void;
};

export const FileTile = component<FileTileProps>(
  ({ item, onCopy, onDelete, onDownload }) => {
    const { name, mimeType } = item.props();
    const isError = derive(() => item.value.isError === true);
    const isText = mimeType.is.equalTo("text/plain");
    const isImage = mimeType.startsWith("image/");
    const text = derive(() => item.value.text ?? "EMPTY");
    const previewUrl = derive(() => item.value.previewUrl);
    const createdTime = derive(() =>
      new Date(item.value.createdTime).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    );
    const fileExtension = derive(
      () => MIME_TO_EXTENSION[mimeType.value as SupportedMimeType],
    );
    const fileExtensionColor = derive(
      () => fileExtensionColors[fileExtension.value],
    );
    const textOrImage = op(isText).or(isImage).truthy;

    const copyIconName = resettableSignal<IconName>("content_copy", 2000);
    const copyIconColor = resettableSignal<string>("#666", 2000);
    const downloadIconName = resettableSignal<IconName>("download", 2000);
    const downloadIconColor = resettableSignal<string>("#666", 2000);

    const onCopyClick = () => {
      copyIconName.value = "done_all";
      copyIconColor.value = "dodgerblue";
      onCopy();
    };

    const onDownloadClick = () => {
      downloadIconName.value = "download_done";
      downloadIconColor.value = "dodgerblue";
      onDownload();
    };

    return m.Li({
      class: css("item-tile"),
      children: [
        m.Div({
          class: css("item-content"),
          children: [
            m.If({
              subject: isError,
              isTruthy: () =>
                m.P({
                  class: css("item-error"),
                  children: derive(
                    () => `Error downloading ${item.value.name}.`,
                  ),
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
              isFalsy: () =>
                m.Div({
                  class: css("item-file-icon"),
                  children: FileIcon({
                    size: 80,
                    color: fileExtensionColor,
                    extension: fileExtension,
                  }),
                }),
            }),
            m.Div({
              class: css("item-tile-header"),
              children: [
                m.Div({
                  class: css("item-file-name"),
                  children: name,
                }),
                m.Div({
                  class: css("item-created-time"),
                  children: createdTime,
                }),
              ],
            }),
          ],
        }),
        m.Div({
          class: css("item-actions"),
          children: [
            m.Button({
              type: "button",
              class: css("item-action-button button-warn"),
              onclick: onDelete,
              children: [
                Icon({
                  size: 16,
                  name: "delete",
                  color: "#bb3c05",
                }),
                m.Span({
                  class: css("icon-button-label"),
                  children: "Delete",
                }),
              ],
            }),
            m.Div({
              class: css("item-actions-buttons"),
              children: [
                m.Button({
                  type: "button",
                  class: css("item-action-button button-normal"),
                  onclick: onDownloadClick,
                  children: [
                    Icon({
                      size: 16,
                      name: downloadIconName,
                      color: downloadIconColor,
                    }),
                    m.Span({
                      class: css("icon-button-label"),
                      children: "Download",
                    }),
                  ],
                }),
                m.If({
                  subject: textOrImage,
                  isTruthy: () =>
                    m.Button({
                      type: "button",
                      class: css("item-action-button button-normal"),
                      onclick: onCopyClick,
                      children: [
                        Icon({
                          size: 16,
                          name: copyIconName,
                          color: copyIconColor,
                        }),
                        m.Span({
                          class: css("icon-button-label"),
                          children: "Copy",
                        }),
                      ],
                    }),
                }),
              ],
            }),
          ],
        }),
      ],
    });
  },
);
