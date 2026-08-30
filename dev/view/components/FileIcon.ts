import { MIME_TO_EXTENSION, SupportedMimeType } from "@cyftec/drive-socket";
import { component, m } from "@cyftec/maya/core";
import { Icon } from "./Icon";
import { css } from "../pages/assets/styles";
import { nonSignal, tmpl } from "@cyftec/maya/signals";

// <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#1f1f1f"><path d="M0 0h24v24H0z" fill="none"/><path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/></svg>

type FileIconProps = {
  size: number;
  color: string;
  extension: (typeof MIME_TO_EXTENSION)[SupportedMimeType];
};

export const FileIcon = component<FileIconProps>(
  ({ size, color, extension }) => {
    const sizePx = tmpl`${size}px`;
    const fontSizePx = tmpl`${() => size.value / 5}px`;
    const fillColor = nonSignal(color).or("#000");

    return m.Div({
      class: css("relative"),
      style: tmpl`height: ${sizePx}; width: ${sizePx};`,
      children: [
        m.Svg({
          class: css("absolute z-0"),
          xmlns: "http://www.w3.org/2000/svg",
          height: sizePx,
          width: sizePx,
          viewBox: "0 0 24 24",
          fill: fillColor,
          children: m.Path({
            d: "M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z",
          }),
        }),
        m.Div({
          class: css("absolute z-1"),
          style: tmpl`bottom: 18%; right: 28%; font-size: ${fontSizePx};`,
          children: extension,
        }),
      ],
    });
  },
);
