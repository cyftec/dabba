import {
  defineCompoundClasses,
  getCss,
  type AppAtomicClassNames,
  type AppClassNames,
  type AtomicClassOverrides,
  type AtomicClassName,
  type ClassNamesPhrase,
  type MediaConstraintsOverrides,
} from "@cyftec/maya/nocss";

/**
 * This file is an example app stylesheet source. Brahma reads its exported
 * atomic maps at build time and writes a sibling styles.css file. The compound
 * map is also passed to css so role names expand to atoms in the browser.
 */
export const mediaConstraintsOverrides = {
  ns: { minWidth: "30em" },
  m: { minWidth: "30em", maxWidth: "60em" },
  l: { minWidth: "60em" },
} as const satisfies MediaConstraintsOverrides;

export const atomicClassOverrides = {
  default: {
    "special-wrap": "{ white-space: pre-wrap; overflow-wrap: anywhere; }",
  },
} as const satisfies AtomicClassOverrides;

type AppAtomicClassName = AppAtomicClassNames<
  AtomicClassName,
  typeof atomicClassOverrides
>;

export const compoundClasses = defineCompoundClasses<AppAtomicClassName>()({
  history: "mw7 ma0 pa3 center min-vh-100",
  "history-hint": "mh3 mid-gray f5",
  "history-error": "mh3 pa3 br3 red bg-light-red",
  "history-list": "flex flex-column ma0 pa0 list ",
  "history-item": "mt0 mh0 mb3 pa3 f6 ba bw1 br3 b--dashed",
  "history-empty": "ma0 pa3 ba bw1 br3 b--dashed b--silver gray",
  "history-item-current": "b--moon-gray bg-near-white",
  "history-item-old": "b--light-silver bg-moon-gray",
  "history-item-header": "flex justify-between mb3 f6",
  "history-item-image": "db br3",
  "history-item-text": "ma0 special-wrap f4",
});

export type { ClassNamesPhrase };
export type ClassName = AppClassNames<
  AtomicClassName,
  typeof atomicClassOverrides,
  typeof compoundClasses
>;
export const css = getCss<ClassName, typeof compoundClasses>(compoundClasses);
