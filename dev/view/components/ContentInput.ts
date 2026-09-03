import { component, DomEventValue, m } from "@cyftec/maya/core";
import { css } from "../pages/assets/styles";
import { Icon } from "./Icon";

type ContentInputProps = {
  classNames?: string;
  zonesDisabled: boolean;
  onPasteZoneTap: DomEventValue<"onclick", HTMLButtonElement>;
  onFileInputChange: DomEventValue<"onchange", HTMLInputElement>;
};

export const ContentInput = component<ContentInputProps>(
  ({ zonesDisabled, onPasteZoneTap, onFileInputChange }) => {
    return m.Div({
      class: css("input-row"),
      children: [
        m.Button({
          type: "button",
          class: css("paste-zone"),
          disabled: zonesDisabled,
          onclick: onPasteZoneTap,
          children: [
            Icon({
              classNames: css("flex self-center mb3"),
              name: "content_copy",
            }),
            m.P({
              class: css("zone-label"),
              children: "Paste clipboard content",
            }),
            m.P({
              class: css("zone-hint"),
              children: "Click here to paste & push content to Google Drive",
            }),
          ],
        }),
        m.Label({
          class: css("file-zone"),
          children: [
            Icon({
              classNames: css("flex self-center mb3"),
              name: "folder_open",
            }),
            m.P({
              class: css("zone-label"),
              children: "Share a file from device",
            }),
            m.P({
              class: css("zone-hint"),
              children: "Choose a file from device and push to Google Drive.",
            }),
            m.Input({
              type: "file",
              accept: "*/*",
              class: css("hidden-input"),
              disabled: zonesDisabled,
              onchange: onFileInputChange,
            }),
          ],
        }),
      ],
    });
  },
);
