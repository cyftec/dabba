import { component, m } from "@cyftec/maya/core";
import { tmpl } from "@cyftec/maya/signals";
import { css } from "../assets/styles.js";
import type { ClipboardEntry } from "../clipboard.js";

type ClipboardHistoryProps = {
  history: ClipboardEntry[];
};
// css("history-item");
// css("history-item-text");

// css("history-item-current");
// css("history-item-old");

export const ClipboardHistory = component<ClipboardHistoryProps>(
  ({ history }) =>
    m.Ol({
      class: css("history-list"),
      children: m.For({
        subject: history,
        itemKey: "id",
        map: (copiedItem, index) => {
          const { mediaType, text, imgSrc } = copiedItem.props();

          return m.Li({
            class: css(
              "history-item",
              css.when(index, "history-item-old", "history-item-current"),
            ),
            children: [
              m.Div({
                class: css("history-item-header"),
                children: [
                  m.Span({
                    class: css("fw7"),
                    children: index.if
                      .truthy()
                      .then(
                        index.toString().concat(".&nbsp; "),
                        "Current Clipboard:&nbsp; ",
                      ),
                  }),
                  m.Span({
                    class: css("gray"),
                    children: mediaType,
                  }),
                ],
              }),
              m.If({
                subject: imgSrc,
                isTruthy: (subjectSrc) =>
                  m.Img({
                    class: css("history-item-image"),
                    width: "200",
                    alt: tmpl`Clipboard image: ${text}`,
                    src: subjectSrc,
                  }),
              }),
              m.If({
                subject: text,
                isTruthy: (textSubject) =>
                  m.P({
                    class: css("history-item-text"),
                    children: textSubject,
                  }),
              }),
            ],
          });
        },
      }),
    }),
);
