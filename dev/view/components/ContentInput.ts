import { component, DomEventValue, m } from "@cyftec/maya/core";
import { css } from "../pages/assets/styles";

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
            m.P({
              class: css("zone-label"),
              children: "Paste clipboard content",
            }),
            m.P({
              class: css("zone-hint"),
              children: "Click here, then allow clipboard access to upload.",
            }),
          ],
        }),
        m.Label({
          class: css("file-zone"),
          children: [
            m.P({
              class: css("zone-label"),
              children: "Open a file from device to share",
            }),
            m.P({
              class: css("zone-hint"),
              children: "Choose a file to push to Google Drive.",
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
