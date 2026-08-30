import { component, m } from "@cyftec/maya/core";
import { derive, nonSignal, tmpl } from "@cyftec/maya/signals";
import { ClassNamesPhrase } from "../pages/assets/styles";

export const ICONS_MAP = {
  content_copy:
    "M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z",
  done_all:
    "M268-240 42-466l57-56 170 170 56 56-57 56Zm226 0L268-466l56-57 170 170 368-368 56 57-424 424Zm0-226-57-56 198-198 57 56-198 198Z",
  folder_open:
    "M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640H447l-80-80H160v480l96-320h684L837-217q-8 26-29.5 41.5T760-160H160Zm84-80h516l72-240H316l-72 240Zm0 0 72-240-72 240Zm-84-400v-80 80Z",
  refresh:
    "M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z",
  file_icon_solid:
    "M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z",
} as const;

export type IconName = keyof typeof ICONS_MAP;

type IconProps = {
  classNames?: ClassNamesPhrase;
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export const Icon = component<IconProps>(
  ({ classNames, name, size, color, strokeWidth }) => {
    const pathD = derive(() => ICONS_MAP[name.value]);
    const sizePx = tmpl`${() => size?.value || 24}px`;
    const strokeWidthPx = tmpl`${() => strokeWidth?.value || 1}px`;
    const fillColor = nonSignal(color).or("#000");

    return m.Svg({
      xmlns: "http://www.w3.org/2000/svg",
      class: classNames,
      height: sizePx,
      width: sizePx,
      viewBox: "0 -960 960 960",
      "stroke-width": strokeWidthPx,
      fill: fillColor,
      children: m.Path({ d: pathD }),
    });
  },
);
