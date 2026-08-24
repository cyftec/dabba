# Maya Application Coding Specification

**Status:** normative common contract

**Audience:** coding agents and engineers building Maya applications

**Verified against:** `@cyftec/maya` 0.2.2, `@cyftec/brahma` 0.2.2, NoCSS, and TypeScript 7.0.2 in this repository

**Required companion:** choose one profile below

- For every application, read [`NOCSS_CODING_SPEC.md`](./NOCSS_CODING_SPEC.md).
- For document-style applications, dashboards, forms, and sites, read [`MAYA_UI_CODING_SPEC.md`](./MAYA_UI_CODING_SPEC.md).
- For real-time games rendered with HTML canvas, read [`MAYA_CANVAS_GAME_CODING_SPEC.md`](./MAYA_CANVAS_GAME_CODING_SPEC.md).
- A game with menus, settings, or other DOM interface reads both profiles.

This file contains only the rules shared by both kinds of application: Maya's build/mount model, component boundary, lifecycle, source layout, Brahma output, routing, and verification. A profile may strengthen this contract for its domain, but it must not contradict it.

Maya is not React with different names. It has no JSX, virtual DOM, component rerender loop, or hydration diff. A Maya page is TypeScript that declares a DOM tree with node getters. Brahma runs the page once in a build DOM to emit HTML, runs it again in the browser to attach behavior to the same nodes, and then allows signals or application code to update the mounted page.

---

## 1. Normative language

The words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** express requirements:

- **MUST / MUST NOT**: required for a valid, conventional Maya application.
- **SHOULD / SHOULD NOT**: the strong default; deviate for a documented reason.
- **MAY**: optional.

When repository implementation and prose disagree, the checked-in package and tests are the source of truth. Update this specification when that happens.

---

## 2. Shared non-negotiable rules

1. Import DOM factories and composition helpers from `@cyftec/maya/core`.
2. Import signals from `@cyftec/maya/signals`.
3. A route entry **MUST** default-export one Maya node getter, normally the result of `m.Html(...)`.
4. A reusable unit that returns Maya UI **MUST** use `component()` when it returns one `Child`, or `fragment()` when it can return broader `Children`.
5. Ordinary functions and classes are correct for simulation, geometry, physics, AI, parsing, formatting, validation, data access, and other non-UI work. Do not wrap game/domain logic in Maya components.
6. The initial build and browser mount **MUST** invoke node getters in the same order.
7. Do not read browser-only or nondeterministic state while constructing the initial tree. This includes `window`, `document`, layout, storage, location, `Date.now()`, `performance.now()`, and random values.
8. Browser APIs belong in `onmount`, DOM events, or a separately emitted browser script.
9. Every resource started by a mounted component—animation frame, observer, timer, listener, effect, request, audio node—**MUST** have an explicit cleanup path.
10. Maya children are strings, `undefined`, node getters, arrays of those, or signalified equivalents. Numbers, booleans, `null`, arbitrary objects, and DOM nodes are not children.
11. Use a string or `tmpl` when displaying a numeric or boolean value.
12. Do not use `innerHTML`. Build DOM structure with `m.*`; render canvas pixels through `CanvasRenderingContext2D` or another canvas context.
13. Include the route's exact generated script in its HTML: `page.ts` loads `main.js`; `name.page.ts` loads `name.main.js`.
14. Keep authored source and assets out of Karma's `disposable` list.
15. A task is not complete because it type-checks. Build the production output and verify the mounted app in a real browser.
16. Coding agents **MUST** author CSS-based styling only through NoCSS, import the app's typed `css` helper, and pass every class value through it. They **MUST NOT** write stylesheets, inline CSS, injected CSS, or raw class strings. This agent-only restriction does not limit Maya applications: human authors may use a deliberately scoped hybrid alongside NoCSS, including third-party asset styles.

---

## 3. Imports and package boundary

Use explicit subpaths:

```ts
import {
  component,
  fragment,
  m,
  type Child,
  type Children,
  type MayaNode,
  type MayaNodeGetter,
} from "@cyftec/maya/core";

import {
  derive,
  dispose,
  effect,
  promstates,
  signal,
  tmpl,
  value,
  type Signal,
  type SourceSignal,
} from "@cyftec/maya/signals";

import { query } from "@cyftec/maya/toolkit";

// Adjust the relative path to the project's configured NoCSS source.
import { css } from "./assets/styles.js";
```

The root `@cyftec/maya` path is not exported by the current package. Its public exports are `./core`, `./signals`, `./immut`, `./nocss`, `./nocss/compiler`, `./nocss/probe`, and `./toolkit`. Application components normally import the typed `css` helper from their local NoCSS `styles.ts` module rather than constructing another helper from the package.

Use type-only imports when a value is not needed at runtime. Do not silence a Maya type error with `any` merely to make generated code compile; child, attribute, and tag-specific types catch real runtime mistakes.

---

## 4. Runtime mental model

### 4.1 A Maya element is a node getter

`m.Div(...)` returns a callable `MayaNodeGetter`, not a JSX value and not a permanent mounted-element reference:

```ts
type MayaNodeGetter = {
  (): MayaNode;
  isMayaNodeGetter: true;
};
```

The getter participates in the build and mount passes. Calling it later during the run phase may create a fresh node. Capture a mounted element in `onmount`, or use an event's `currentTarget`.

### 4.2 Build

Brahma bundles a page, creates a JSDOM environment, starts Maya's `build` phase, resets the global element ID counter, invokes the default-exported getter, and serializes the resulting root's `outerHTML` with `<!DOCTYPE html>`.

During build:

- element getters create DOM nodes;
- Maya writes deterministic `data-elem-id` markers;
- initial signal values provide initial attributes and text;
- `onmount` does not run;
- event listeners have no useful user interaction;
- browser layout, canvas rendering contexts, media, audio, and storage must not be assumed.

### 4.3 Mount

The emitted route script starts Maya's `mount` phase, resets the same ID counter, and invokes the same root getter again. Each getter queries its `data-elem-id`, attaches events/effects, and removes that temporary marker.

This is deterministic attachment, not reconciliation. A branch that creates a different getter sequence in the browser causes the wrong nodes—or no nodes—to be mounted.

### 4.4 Run

After mounting, Brahma changes the phase to `run`. Source-signal writes notify dependent effects synchronously. Maya updates the affected attribute or child position directly. Components are not rerun as a render strategy.

A canvas game normally performs its own frame rendering after mount. Signals remain useful for low-frequency DOM state such as score, menus, and status, but they are not a replacement for the frame loop.

### 4.5 Deterministic-tree invariant

Do not do this during module initialization, component invocation, or getter construction:

```ts
// Invalid: build and browser can disagree.
const compact = window.innerWidth < 720;
const seed = Math.random();
const greeting = Date.now() % 2 ? "Hello" : "Welcome";

export default compact ? m.Div("Small") : m.Div("Large");
```

Start from stable markup and adapt after mount:

```ts
const compact = signal(false);

const panel = m.Section({
  class: css("pa3", css.when(compact, "pa2", "pa4")),
  onmount: () => {
    const media = window.matchMedia("(max-width: 45rem)");
    compact.value = media.matches;
  },
  children: "Content",
});
```

Prefer NoCSS responsive classes and configured media rules for layout. Use `onmount` when JavaScript must observe the browser.

---

## 5. Components, fragments, and props

### 5.1 What must be a component

This reusable UI helper is invalid:

```ts
// Invalid reusable Maya UI.
function Action(props: { label: string }) {
  return m.Button({ children: props.label });
}
```

Use `component()`:

```ts
type ActionProps = {
  label: string;
  disabled?: boolean;
  onActivate: (event: MouseEvent) => void;
};

export const Action = component<ActionProps>(
  ({ label, disabled, onActivate }) =>
    m.Button({
      type: "button",
      disabled,
      onclick: onActivate,
      children: label,
    }),
);
```

Use `fragment()` for multiple siblings or another broad `Children` result:

```ts
export const NameValue = fragment<{ name: string; value: string }, Child[]>(
  ({ name, value }) => [m.Dt({ children: name }), m.Dd({ children: value })],
);
```

Use ordinary functions for work that does not produce Maya UI:

```ts
export const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));
```

### 5.2 Prop normalization

Declare external props as simple domain types:

```ts
type MeterProps = {
  label: string;
  value: number;
  max?: number;
  onReset: () => void;
};
```

Callers may pass a plain value or a compatible signal. Inside a component, ordinary data props are normalized to signalified objects and current values are available through `.value`. Functions, callbacks, explicit signals, Maya node getters, and supported child shapes pass through according to their type. Omitted optional props may be absent.

```ts
export const Meter = component<MeterProps>(
  ({ label, value: currentValue, max, onReset }) =>
    m.Section({
      children: [
        m.H2({ children: label }),
        m.P({
          children: tmpl`${currentValue} / ${() => max?.value ?? 100}`,
        }),
        m.Button({ type: "button", onclick: onReset, children: "Reset" }),
      ],
    }),
);
```

Important distinctions:

- call `onReset()`; callbacks do not use `.value`;
- `max?.value` handles an omitted optional prop;
- forwarding `label` directly preserves child reactivity;
- reading `label.value` during tree construction takes a snapshot;
- read within `tmpl`, `derive`, `effect`, or an event when future updates matter.

Prefer a value plus an intent callback over mutating caller-owned state:

```ts
type VolumeProps = {
  value: number;
  onChange: (next: number) => void;
};
```

For a canvas component, props should configure the DOM/lifecycle boundary. Mutable world state belongs to a plain game session, not a signalified prop object.

---

## 6. Shared lifecycle contract

### 6.1 `onmount`

`onmount` runs asynchronously after a getter is attached outside the build phase. The callback receives the mounted `MayaNode`.

Use it for:

- canvas context creation;
- `ResizeObserver`, `IntersectionObserver`, or media queries;
- initial focus or measurements;
- browser storage reads;
- browser fetches;
- animation frame and audio setup.

```ts
let observer: ResizeObserver | undefined;

const observed = m.Div({
  onmount: (node) => {
    observer = new ResizeObserver(() => {
      // React to size.
    });
    observer.observe(node);
  },
  onunmount: () => {
    observer?.disconnect();
    observer = undefined;
  },
});
```

### 6.2 `onunmount`

Supplying `onunmount` starts Maya's document-level removal observer outside the build phase. It runs child-first for a removed Maya subtree. Maya also disposes effects attached internally to the element.

Application-owned work still requires cleanup:

- cancel the most recent animation-frame ID;
- clear timeouts and intervals;
- abort requests and event-listener controllers;
- disconnect observers;
- dispose application-created effects;
- release pointer capture where relevant;
- stop or disconnect audio;
- clear retained node/session references.

Because `onmount` is deferred, cleanup code SHOULD tolerate an element being removed before its mount callback executes.

### 6.3 Event ownership

Maya accepts lowercase event prop names such as `onclick`, `oninput`, `onkeydown`, and `onpointerdown`. Use `event.currentTarget`, not `event.target`, when the handler owns the element.

Listeners registered manually in `onmount` are not automatically removed by Maya. Prefer an `AbortController`:

```ts
let listeners: AbortController | undefined;

const focusRegion = m.Div({
  onmount: (node) => {
    listeners = new AbortController();
    node.addEventListener("keydown", handleKey, {
      signal: listeners.signal,
    });
  },
  onunmount: () => {
    listeners?.abort();
    listeners = undefined;
  },
});
```

---

## 7. Children, attributes, and safety

The core shape is:

```ts
type RawChild = undefined | string;
type Child = RawChild | MayaNodeGetter;
type AttributeValue = string | boolean | undefined;
```

`Children` also accepts arrays and signalified forms of valid children.

Valid:

```ts
m.P({ children: "Static text" });
m.P({ children: tmpl`Score: ${score}` });
m.Div({ children: [m.Strong("Name"), " — Maya"] });
m.Div({ children: undefined });
```

Invalid:

```ts
m.P({ children: 42 });
m.P({ children: false });
m.P({ children: null });
m.Div({ children: document.createElement("span") });
```

Attributes use serialized HTML names: `class`, `for`, `tabindex`, `http-equiv`, and `aria-*`, not React spellings. Boolean attributes are present when true and removed when false. The input `value` path updates the DOM property.

The current runtime rejects dangerous `href` protocols and unsafe inline `style` payloads such as `expression(...)` and executable or data URL schemes. A `url(...)` in a style value is permitted only when it names a strict local asset path, for example `url("./images/logo.svg")`, `url("../shared/icon.svg")`, or `url("/assets/logo.svg")`. Those paths may contain only letters, numbers, `/`, `.`, `_`, and `-`; URLs with schemes, protocol-relative prefixes, backslashes, whitespace, quotes outside the URL syntax, query strings, fragments, or parentheses are rejected. Coding agents do not use inline styles at all: use the typed NoCSS helper and do not attempt to bypass these checks. Never put untrusted text into executable code, HTML, CSS, storage keys, or asset URLs without validation appropriate to the sink.

---

## 8. Signals: shared use

Create writable state with `signal()`:

```ts
const score = signal(0);
score.value += 10;
```

Use `derive()` for computed state:

```ts
const rank = derive(() => (score.value >= 1_000 ? "expert" : "rookie"));
```

Use `tmpl` for reactive strings:

```ts
m.Output({ children: tmpl`Score: ${score}` });
```

Use `effect()` for imperative reactions and dispose application-created effects when their owner unmounts:

```ts
const sync = effect(() => {
  console.log(score.value);
});

sync.dispose();
```

Do not use signals automatically for every game entity or every frame value. Per-frame positions, velocities, collision caches, particle pools, and input sets are normally plain mutable data owned by the game loop. Publish only meaningful changes to DOM-facing signals.

Effects collect dependencies during their initial execution. Read all dependencies that may matter before an early return or branch.

---

## 9. Brahma project contract

### 9.1 Commands

Brahma is the Bun-first CLI for scaffolding, installing, staging, serving, and publishing Maya apps.

```sh
bun add --global @cyftec/brahma
brahma create my-app --web
cd my-app
brahma install
brahma stage
```

Supported application modes are `web` (default), `pwa`, and `ext`.

| Command | Alias | Purpose |
| --- | --- | --- |
| `brahma create <name> [--web\|--pwa\|--ext]` | `brahma c` | Copy an embedded scaffold and Karma files. |
| `brahma install [package]` | `brahma i` | Generate config/install all dependencies, or add one package. |
| `brahma uninstall [package]` | `brahma u` | Remove generated install artifacts, or one package. |
| `brahma stage` | `brahma s` | Rebuild staging output, serve it, and watch source. |
| `brahma publish` | `brahma p` | Build production output and minify page bundles. |
| `brahma reset [--soft\|--hard]` | `brahma r` | Regenerate Karma files; hard resets mode to web. |
| `brahma version` | `brahma v` | Show the installed Brahma and configured Maya versions. |
| `brahma version --v=<version\|latest>` | `brahma v` | Change the global CLI version. |

Run `brahma install` before the first `brahma stage` (and whenever you need to regenerate the configuration or synchronize dependencies from `karma.ts`). `brahma stage` only builds, serves, and watches the installed app.

### 9.2 App source and view-root layout

The shipped web scaffold is copied from `brahma/src/probe-helpers/probe/apps/web`, with shared Karma files copied from `brahma/src/probe-helpers/probe/base-karma`. It uses:

```text
my-app/
├── _karma/
│   ├── karma.ts
│   └── types.ts
└── dev/
    ├── controllers/
    ├── models/
    └── view/
        ├── elements/
        │   └── reusable-ui.ts
        └── pages/
            ├── assets/
            │   └── styles.ts
            ├── about/
            │   └── page.ts
            ├── living-room/
            │   ├── @components/
            │   ├── sample-assets/
            │   └── page.ts
            ├── contacts.page.ts
            ├── examples.page.ts
            └── page.ts
```

The checked-in scaffold config has:

```ts
appSrcDir: "dev";
appViewDir: "dev/view/pages";
buildablePageFileName: "page.ts";
buildableStylesheetFileName: "styles.ts";
assetsDirName: "assets";
buildableManifestFileName: "manifest.ts";
ignoreDelimiter: "@";
stagingDir: "stage";
```

PWA and extension scaffolds start from the same base Karma file and are transformed during create/reset to use their mode-specific app type, dependencies, `publishDir: "prod"`, and `appViewDir: "dev"`.

This structure is a build-boundary choice, not a rule that web, PWA, extension, or canvas-game apps require different architecture. `appViewDir` is the directory Brahma recursively treats as buildable view output. If that root also contains controllers, models, game engines, API clients, parsers, or other business modules, Brahma must inspect more files and will emit ordinary non-page TypeScript as standalone JavaScript unless those files are ignored.

There are two valid ways to keep private source from becoming public output:

1. Put private modules inside `appViewDir` with a basename that starts with `ignoreDelimiter`, such as `@components`, `@elements`, `@game`, or `@models`. This is useful for route-local helpers and colocated modules, but heavy use can make the route tree noisy.
2. Keep `appViewDir` focused on route pages only, such as `appViewDir: "dev/view/pages"`, and place reusable view modules in sibling source directories like `dev/view/components` and `dev/view/elements`. Place business logic in sibling source directories such as `dev/controllers`, `dev/models`, `dev/services`, or `dev/game`. These files are bundled when imported by a page, but they are not scanned as route output.

The web scaffold uses the second pattern because `brahma create` is most often used for web apps and the sample is intended to show an MVC-friendly layout that avoids both view-folder bloat and widespread ignore-prefix noise.

The current PWA and extension scaffolds are intentionally simpler probe apps, so their transformed Karma uses `appViewDir: "dev"`. That difference reflects the current sample complexity and mode-specific emitted files such as manifests, service workers, content scripts, and popup pages. It does not mean PWA or extension apps cannot use a more explicit MVC-style source layout when a project needs one.

Do not silently change `appViewDir` to a different invented canonical layout. A project may deliberately configure another subtree, but agents MUST read `_karma/karma.ts` and follow that project.

Within `appViewDir`:

- every file or directory whose basename starts with `ignoreDelimiter` is skipped as independent output;
- an ignored TypeScript module can still be imported into a page and bundled;
- ordinary non-page TypeScript files are emitted independently as `.js`;
- the single configured NoCSS stylesheet module is compiled to generated CSS in the output assets directory after page class usage is collected;
- non-TypeScript files are copied while preserving relative paths;
- the configured manifest at the app-view root becomes `manifest.json`;
- empty output directories are removed;
- staging/production output is recreated, so never edit it as source.

Reusable modules may also live outside `appViewDir` but inside `appSrcDir`, such as the generated web scaffold's `dev/view/elements`; they are bundled when imported by a page, but they are not emitted as route outputs. The `@game`, `@components`, or `@elements` convention remains useful for private bundled modules inside the emitted route tree. Public assets must not be placed under an ignored directory.

### 9.3 NoCSS styling and build contract

NoCSS is Maya's recommended atomic path for an application's own elemental styling. Its configured TypeScript module exports the base overrides, media-constraint overrides, compound classes, complete `ClassName` type, and the app's `css` helper. Components that use NoCSS import that helper and use it for every NoCSS-managed `class` attribute, including single static classes:

```ts
import { css } from "../assets/styles.js";

m.Main({
  class: css("center mw8 pa3", css.when(compact, "pa4-ns", "pa2")),
});
```

Brahma resets the usage registry, statically builds the pages, collects the classes registered by `css`, imports the one configured `styles.ts`, emits only the used rules, applies responsive media groups, and writes a minified `styles.css` to the output assets directory. `css.when` and `css.cases` register all declared runtime outcomes during the build; use them instead of dynamic class interpolation.

The generated CSS is output, not authored source. Maya permits a hybrid when a human author deliberately retains or introduces a separate owner, such as an icon set, syntax-highlighting theme, or library widget stylesheet; keep that ownership clear and test the resulting cascade. Coding agents remain restricted to NoCSS and must not create or edit `.css` files, inline CSS, style elements, injected CSS, or raw class strings. Canvas drawing properties are rendering commands rather than DOM styling.

Read [`NOCSS_CODING_SPEC.md`](./NOCSS_CODING_SPEC.md) for the complete helper API, configuration types, responsive groups, compounds, reset behavior, and verification checklist.

### 9.4 Karma rules

The named configuration export MUST remain `karma`. Important fields:

- `appSrcDir`: authored source root;
- `appViewDir`: tree recursively emitted by Brahma;
- `skipErrorAndBuildNext`: keep `false` for agent and CI work;
- `ignoreDelimiter`: prefix that suppresses direct output;
- `buildablePageFileName`: page-entry suffix;
- `buildableStylesheetFileName`: the single NoCSS TypeScript source basename;
- `assetsDirName`: source/output assets directory containing NoCSS source and generated CSS respectively;
- `buildableManifestFileName`: manifest source filename;
- `stagingDir` / `publishDir`: recreated output paths;
- `disposable`: install/generated paths that Brahma may remove;
- `watchDir` / `serveDir`: development watcher and server roots;
- `maya`: generated `package.json` data and dependency pins;
- `tsconfig`: generated TypeScript configuration.

Treat `disposable` as destructive configuration. Never add authored source, assets, tests, saves, or hand-maintained configuration to it.

Generated apps pin exactly TypeScript `7.0.2` in `maya.devDependencies` and use the same strict DOM-capable compiler options as this monorepo:

```ts
tsconfig: {
  compilerOptions: {
    lib: ["ESNext", "DOM", "DOM.Iterable"],
    target: "ESNext",
    module: "ESNext",
    moduleResolution: "Bundler",
    moduleDetection: "force",
    allowImportingTsExtensions: true,
    isolatedModules: true,
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    noErrorTruncation: true,
    noFallthroughCasesInSwitch: true,
    noPropertyAccessFromIndexSignature: true,
    noUncheckedIndexedAccess: true,
    noUncheckedSideEffectImports: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    types: ["bun-types"],
  },
  include: ["_karma/**/*.ts", "dev/**/*.ts"],
}
```

Repository projects extend `tsconfig.base.json`; local configs change only file boundaries or required type-test aliases. A generated app is outside that inheritance tree, so Karma carries the equivalent full configuration and regenerates its disposable `tsconfig.json`. Change `_karma/karma.ts`, not the generated config. Do not downgrade TypeScript or widen its version to work around a diagnostic.

---

## 10. Routing and output

Brahma recognizes only the exact configured page filename or a dotted prefix ending in that filename.

With `page.ts` as the configured filename:

| Source | HTML | JavaScript | URL |
| --- | --- | --- | --- |
| `dev/view/pages/page.ts` | `stage/index.html` | `stage/main.js` | `/` |
| `dev/view/pages/about/page.ts` | `stage/about/index.html` | `stage/about/main.js` | `/about/` |
| `dev/view/pages/help.page.ts` | `stage/help.html` | `stage/help.main.js` | `/help.html` |

`homepage.ts` is not a page. It is emitted as `homepage.js` unless ignored.

Each page must load its own bundle:

```ts
// page.ts
m.Script({ src: "main.js", defer: true });

// help.page.ts
m.Script({ src: "help.main.js", defer: true });
```

For a folder route, asset paths are relative to that folder's output unless root-relative URLs are intentionally used. Verify direct navigation and refresh for every route.

---

## 11. Minimal route anatomy

```ts
import { m } from "@cyftec/maya/core";
import { css } from "./assets/styles.js";

export default m.Html({
  lang: "en",
  children: [
    m.Head({
      children: [
        m.Meta({ charset: "UTF-8" }),
        m.Meta({
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        }),
        m.Title({ children: "Maya application" }),
        m.Link({ rel: "stylesheet", href: "/assets/styles.css" }),
      ],
    }),
    m.Body({
      children: [
        m.Main({
          class: css("center mw8 pa3"),
          children: "Replace with the selected profile's root.",
        }),
        m.Script({ src: "main.js", defer: true }),
      ],
    }),
  ],
});
```

Requirements:

- export the getter, not an invoked DOM node;
- include a complete `html`, `head`, and `body`;
- keep the initial tree deterministic;
- use the script name generated for that route;
- include the viewport declaration;
- link the CSS generated from the configured NoCSS source;
- pass every class through the app's typed `css` helper.

---

## 12. PWA and extension notes

PWA and extension targets obey the same Maya runtime rules.

For a PWA:

- the root `manifest.ts` is emitted as `manifest.json`;
- service workers and other non-page TypeScript are emitted as JavaScript;
- cache versioning and update behavior must be tested;
- canvas/audio assets needed offline must be explicitly included in caching.

For an extension:

- `manifest.ts` is emitted as `manifest.json`;
- popup pages still load their matching page bundle;
- service workers and content scripts must respect extension CSP;
- production output is archived as a zip and its source directory is removed by the current Brahma extension publish path.

Do not rely on remote executable scripts in a PWA or extension. Confirm target browser permissions, CSP, storage, and audio behavior.

---

## 13. Verification protocol

### 13.1 Structural audit

Before running commands, verify:

- imports use package subpaths;
- route entries default-export one `m.Html(...)` getter;
- reusable Maya UI uses `component()` or `fragment()`;
- non-UI game/domain code remains plain TypeScript;
- no browser globals or nondeterminism run during tree construction;
- every agent-authored first-party elemental class is registered by the app's typed NoCSS helper, while any hybrid style source has explicit ownership;
- private modules and public assets respect the configured ignore delimiter;
- every page script name matches its output;
- cleanup exists for every mounted resource.

### 13.2 Build audit

Run the project's checks, then:

```sh
brahma publish
```

Confirm:

- the command exits successfully;
- no page was silently skipped;
- each expected HTML and JavaScript file exists;
- generated NoCSS, copied images, audio, fonts, and manifests exist at referenced paths;
- no private `@` directory leaked into output;
- generated HTML begins with a doctype and contains initial content;
- each page references an existing matching bundle.

Do not hand-edit `stage` or production output to fix a source problem.

### 13.3 Browser audit

Serve the generated output and test a browser, not only JSDOM:

- direct-load and refresh every route;
- inspect the console for mount/query errors;
- use keyboard-only navigation;
- test pointer/touch where applicable;
- test narrow, ordinary, and wide viewports;
- test hidden/background-tab behavior;
- test reduced motion and zoom;
- exercise error, empty, loading, pause, and restart states that apply;
- confirm teardown when a mounted subtree is removed or replaced.

The selected profile adds domain-specific checks.

### 13.4 Handoff

Report:

- profile(s) followed;
- routes and modules changed;
- source and generated-output locations;
- commands and results;
- browser sizes and interactions verified;
- accessibility checks;
- deliberate deviations and remaining limitations.

---

## 14. Common failure catalogue

### Static HTML appears, but interaction does nothing

The page likely loads the wrong bundle. `page.ts` needs `main.js`; `name.page.ts` needs `name.main.js`.

### Build throws for `window`, `document`, storage, canvas, or location

Browser work ran during build-time construction. Move it into `onmount`, an event, or a browser-only emitted script.

### Mount cannot find a `data-elem-id`

Build and mount invoked getters in different orders. Remove random, time-dependent, browser-dependent, or storage-dependent initial branches.

### A signal prop never updates after its first value

Its `.value` was read as a construction-time snapshot. Forward the normalized prop, or read it inside `tmpl`, `derive`, or `effect`.

### Optional prop access crashes

Omitted props may be absent. Use `optionalProp?.value ?? fallback`.

### A callback is not callable

Callbacks pass through normalization. Call the function directly; do not use `.value`.

### A number, boolean, or `null` fails as a child

Convert display data to a string/`tmpl`; use declarative conditional UI for absence.

### Cleanup never runs

The resource owner lacks `onunmount`, the cleanup reference was not retained, or the resource was created globally. Keep setup and teardown in the same component/session boundary.

### An asset works at `/` but fails on a nested route

The URL is route-relative. Use the correct relative path or a deliberately root-relative public path and verify direct route loading.

---

## 15. Common checklist

- [ ] Read this file and every applicable profile.
- [ ] Read the target project's `_karma/karma.ts`; do not assume its paths.
- [ ] Keep `appViewDir` focused on intended public view output, or use `ignoreDelimiter` deliberately for private modules inside it.
- [ ] Use `@cyftec/maya/core` and `@cyftec/maya/signals`.
- [ ] Read and follow the NoCSS specification; coding agents author no CSS outside NoCSS and pass every class through the typed `css` helper.
- [ ] Default-export a deterministic complete HTML page getter.
- [ ] Use `component()` / `fragment()` only for Maya UI composition.
- [ ] Keep domain or game logic in ordinary TypeScript modules.
- [ ] Use valid children and serialized HTML attribute names.
- [ ] Start browser-only work after mount.
- [ ] Pair every owned resource with cleanup.
- [ ] Match route entries with exact script filenames.
- [ ] Keep public assets outside ignored directories.
- [ ] Keep authored files outside `disposable`.
- [ ] Run type/tests plus `brahma publish`.
- [ ] Verify the generated app in a real browser.
- [ ] Complete the chosen profile's checklist.

An agent that receives only one domain profile is missing part of the contract. Always pair this common specification with the UI profile, the canvas-game profile, or both.
