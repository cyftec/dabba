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
    "hidden-input": "{ position: absolute; width: 0; height: 0; opacity: 0; overflow: hidden; }",
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
  "history-empty": "ma0 pa3 ba bw1 br3 b--dashed b--silver gray",
  "offline-banner": "mh3 mb3 pa3 br3 white bg-dark-red",
  "input-row": "flex flex-wrap ma0 mh3 mb3 pa0 list",
  "paste-zone": "flex-auto ma0 mr3 mb3 pa4 ba bw1 br3 b--dashed b--moon-gray pointer bg-near-white",
  "file-zone": "flex-auto ma0 mb3 pa4 ba bw1 br3 b--dashed b--moon-gray pointer bg-near-white",
  "zone-label": "ma0 fw7 f5",
  "zone-hint": "ma0 mt2 gray f6",
  "item-grid": "flex flex-column ma0 mh3 pa0 list",
  "item-tile": "mt0 mh0 mb3 pa3 f6 ba bw1 br3 b--dashed b--light-silver bg-white",
  "item-text": "ma0 mb3 special-wrap f4",
  "item-file-header": "flex justify-between mb3 f6",
  "item-actions": "flex flex-wrap",
  "item-button": "ma0 mr2 mb2 pa2 f6 ba bw1 br2 b--moon-gray bg-near-white pointer",
});

export type { ClassNamesPhrase };
export type ClassName = AppClassNames<
  AtomicClassName,
  typeof atomicClassOverrides,
  typeof compoundClasses
>;
export const css = getCss<ClassName, typeof compoundClasses>(compoundClasses);
