import { component, m } from "@cyftec/maya/core";
import { ClassNamesPhrase, css } from "../pages/assets/styles";

type TitleProps = {
  classNames?: ClassNamesPhrase;
  text: string;
};

export const Title = component<TitleProps>(({ classNames, text }) => {
  return m.Div({
    class: css("silver", classNames),
    children: text,
  });
});
