import { component, m } from "@cyftec/maya/core";
import { css } from "../pages/assets/styles";
import { derive } from "@cyftec/maya/signals";

type ListMessageProps = {
  classNames?: string;
  isListLoading: boolean;
  isPushingFile?: boolean;
};

export const ListMessage = component<ListMessageProps>(
  ({ isListLoading, isPushingFile }) => {
    const message = derive(() =>
      isListLoading.value
        ? isPushingFile?.value
          ? "Uploading to Google Drive..."
          : "Loading items from Google Drive..."
        : "No shared items yet. Paste or upload something above.",
    );

    return m.P({
      class: css("items-message"),
      children: message,
    });
  },
);
