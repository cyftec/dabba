import { component, m } from "@cyftec/maya/core";
import { css } from "../pages/assets/styles";

type EmptyListMessageProps = {
  classNames?: string;
  isListLoading: boolean;
};

export const EmptyListMessage = component<EmptyListMessageProps>(
  ({ isListLoading }) => {
    const message = isListLoading.if
      .truthy()
      .then(
        "Loading items from Google Drive...",
        "No shared items yet. Paste or upload something above.",
      );

    return m.P({
      class: css("history-empty"),
      children: message,
    });
  },
);
