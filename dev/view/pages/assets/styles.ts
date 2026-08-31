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
    theme: "{ color: #e44400 }",
    "bg-theme": "{ background-color: #e44400 }",
    "special-wrap": "{ white-space: pre-wrap; overflow-wrap: anywhere; }",
    "hidden-input":
      "{ position: absolute; width: 0; height: 0; opacity: 0; overflow: hidden; }",
    mxh1: "{ max-height: 1rem; }",
    mxh2: "{ max-height: 2rem; }",
    mxh3: "{ max-height: 4rem; }",
    mxh4: "{ max-height: 8rem; }",
    mxh5: "{ max-height: 16rem; }",
    mxh6: "{ max-height: 32rem; }",
    mxh7: "{ max-height: 48rem; }",
    mxh8: "{ max-height: 64rem; }",
    mxh9: "{ max-height: 96rem; }",
    "break-word": "{ overflow-wrap: break-word; }",
    "w-fill": "{ width: -webkit-fill-available; }",
    "footer-link":
      "{ color: inherit; text-decoration: none; } .footer-link:hover, .footer-link:focus-visible { text-decoration: underline; }",
    "legal-link":
      "{ color: #e44400; text-decoration: underline; text-underline-offset: 0.15em; }",
  },
} as const satisfies AtomicClassOverrides;

type AppAtomicClassName = AppAtomicClassNames<
  AtomicClassName,
  typeof atomicClassOverrides
>;

export const compoundClasses = defineCompoundClasses<AppAtomicClassName>()({
  force:
    "relative absolute right-1 top-1 right-2 top-2 left-1 z-0 z-1 nl3 pl1 pb0 nt1 mb2 shadow-2 br-100 pa1 pa2",
  history: "system-sans-serif mw7 ma0 pa3 center min-vh-100",
  "hero-row": "flex justify-between items-center mt3 mb2 mh0",
  "hero-title": "ma0 mr3",
  "refresh-page-button":
    "flex items-center justify-between ma0 pa2 f5 fw7 ba bw1 br3 b--moon-gray bg-white pointer",
  "history-hint": "mt1 mb4 mh0 silver f6",
  "history-error": "mh0 pa3 br3 theme bg-washed-red",
  "items-message": "ma0 mv3 pa3 tc mid-gray f5 fw7",
  "offline-banner": "mh0 mv4 pa3 br3 white bg-theme",
  "input-row": "flex mh0 mv4 mb3 pa0 list",
  "paste-zone":
    "flex flex-column w-fill mr2 pa4 ba bw1 br3 b--dashed b--moon-gray pointer bg-white",
  "file-zone":
    "flex flex-column tc items-center w-fill ml2 pa4 ba bw1 br3 b--dashed b--moon-gray pointer bg-white",
  "zone-label": "ma0 fw7 f5",
  "zone-hint": "ma0 mt2 gray f6",
  "item-grid": "flex flex-column mv4 mh0 pa0 list",
  "item-tile": "ma0 mb3 f6 br4 bg-near-white",
  "item-content": "relative pt3 ph3 pb0",
  "copy-icon":
    "flex absolute right-1 top-1 shadow-1 br-100 pa1 pointer bg-white",
  "item-text": "ma0 mb3 special-wrap f5 pointer",
  "item-preview": "db h-auto mw-100 mxh5 mb3 br2 pointer",
  "item-error": "ma0 mb3 red",
  "item-actions":
    "ph2 pt2 flex items-center justify-between br--bottom br4 bg-moon-gray",
  "item-file-name": "ml2 mb2 near-black f7 fw7 break-word overflow-auto",
  "item-actions-buttons": "flex items-center",
  "item-button": "mb2 ml2 pa2 f6 ba bw1 br3 b--moon-gray bg-near-white pointer",
  "site-footer":
    "mt5 pt4 bt b--moon-gray tc system-sans-serif mid-gray f6",
  "site-footer-brand":
    "footer-link inline-flex items-center justify-center mb3 near-black fw6 f6 no-underline",
  "site-footer-logo": "mr2 br2",
  "site-footer-links": "flex justify-center items-center mb3 f6",
  "site-footer-maya":
    "ma0 pa2 br2 theme bg-washed-yellow f7 fw6",
  "legal-page": "system-sans-serif mw7 ma0 pa3 center min-vh-100",
  "legal-title": "ma0 mt3 mb4 near-black f3 fw7",
  "legal-heading": "mt4 mb2 near-black f4 fw6",
  "legal-content": "mh0 mb4 mid-gray f5 lh-copy",
  "legal-back-button":
    "footer-link db tc mb4 pa2 f6 fw7 ba bw1 br3 b--moon-gray bg-white pointer no-underline",
});

export type { ClassNamesPhrase };
export type ClassName = AppClassNames<
  AtomicClassName,
  typeof atomicClassOverrides,
  typeof compoundClasses
>;
export const css = getCss<ClassName, typeof compoundClasses>(compoundClasses);
