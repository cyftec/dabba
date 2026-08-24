# Maya DOM UI Coding Profile

**Status:** normative domain profile

**Read with:** [`MAYA_APP_CODING_SPEC.md`](./MAYA_APP_CODING_SPEC.md)

**Styling contract:** [`NOCSS_CODING_SPEC.md`](./NOCSS_CODING_SPEC.md)

**Use for:** sites, forms, dashboards, content, menus, dialogs, and the DOM interface surrounding a canvas game

This profile governs interface rendered as HTML, SVG, or MathML through Maya's `m` factories. It does not govern the per-frame contents of an HTML canvas; read the canvas-game profile for that.

---

## 1. UI operating contract

A production Maya UI MUST:

1. use semantic DOM before generic containers;
2. declare reusable UI with `component()` or `fragment()`;
3. expose simple domain props and intent callbacks;
4. keep reactive reads in signal-aware paths;
5. use Maya control-flow helpers for reactive child replacement;
6. use real labels, buttons, links, forms, headings, lists, and landmarks;
7. give each DOM and SVG style rule a clear owner; use the app's typed NoCSS helper for its first-party elemental styles;
8. remain usable at narrow and wide viewports, zoom, keyboard-only input, and reduced motion;
9. implement loading, empty, error, disabled, and overflow states that apply;
10. verify behavior and visual fidelity in a real browser.

Do not translate React syntax mechanically. Maya uses `class`, `for`, lowercase `on*` event props, serialized attribute names, node getters, and fine-grained signals.

Examples below assume `css` is imported from the project's configured NoCSS `styles.ts` module. NoCSS is the recommended atomic baseline for first-party element styling, while a human author may deliberately retain or add a scoped third-party stylesheet for a library-owned concern. Coding agents must pass every class value they author through this helper and must not author CSS through another path.

---

## 2. Elements and children

### 2.1 Factory names

HTML tag names become PascalCase factories:

```ts
m.Html(...)
m.Main(...)
m.H1(...)
m.Button(...)
m.Textarea(...)
m.Canvas(...)
```

SVG and MathML are namespace-aware. Common SVG examples:

```ts
m.Svg({
  viewBox: "0 0 24 24",
  "aria-hidden": "true",
  children: m.Path({ d: "M4 12h16", "stroke-width": "2" }),
});
```

SVG collisions use aliases: `m.SvgA`, `m.SvgScript`, `m.SvgStyle`, `m.SvgSwitch`, and `m.SvgTitle`.

Use the type system to discover tag-specific attributes. Do not cast away an attribute error until the actual platform requirement has been confirmed.

### 2.2 Child rules

Numbers and booleans are data, not Maya text children:

```ts
const count = signal(0);

m.P({ children: tmpl`Items: ${count}` });
m.P({ children: String(42) });
```

Use `undefined` for an intentionally empty position. Do not use `null`.

Text children are escaped DOM text. `innerHTML` is not a supported composition strategy. If trusted rich content is a product requirement, parse it into an allowlisted Maya tree outside the rendering sink; never inject arbitrary HTML.

### 2.3 Void elements

Elements such as `meta`, `link`, `img`, `input`, `source`, `br`, and `hr` do not take children. Give images useful `alt` text, or `alt: ""` when they are truly decorative.

### 2.4 Mounted references

Do not call a node getter later to “get the element.” Capture it:

```ts
let inputNode: HTMLInputElement | undefined;

const input = m.Input({
  type: "text",
  onmount: (node) => {
    inputNode = node as unknown as HTMLInputElement;
  },
  onunmount: () => {
    inputNode = undefined;
  },
});
```

Prefer `event.currentTarget` inside events when no retained reference is needed.

---

## 3. Component API design

### 3.1 One child versus many

Use `component()` for one Maya `Child`:

```ts
type BadgeProps = {
  text: string;
  tone?: "neutral" | "success" | "danger";
};

export const Badge = component<BadgeProps>(({ text, tone }) =>
  m.Span({
    class: css(
      "dib br2 ph2 pv1",
      css.cases(
        tone,
        {
          "bg-light-gray near-black": "neutral",
          "bg-light-green dark-green": "success",
          "bg-light-red dark-red": "danger",
        },
        "bg-light-gray near-black",
      ),
    ),
    children: text,
  }),
);
```

Use `fragment()` for siblings:

```ts
export const Definition = fragment<{ term: string; detail: string }, Child[]>(
  ({ term, detail }) => [m.Dt({ children: term }), m.Dd({ children: detail })],
);
```

### 3.2 State ownership

The owner keeps the mutable source signal. A child receives the value and an intent callback:

```ts
type QuantityProps = {
  value: number;
  min?: number;
  onChange: (next: number) => void;
};

export const Quantity = component<QuantityProps>(
  ({ value: currentValue, min, onChange }) =>
    m.Div({
      class: css("flex items-center"),
      children: [
        m.Output({
          class: css("dib tc"),
          children: tmpl`${currentValue}`,
        }),
        m.Button({
          type: "button",
          onclick: () =>
            onChange(Math.max(min?.value ?? 0, currentValue.value - 1)),
          children: "Decrease",
        }),
        m.Button({
          type: "button",
          onclick: () => onChange(currentValue.value + 1),
          children: "Increase",
        }),
      ],
    }),
);
```

Avoid APIs that accept a caller-owned `SourceSignal` merely so the child can mutate it. Explicit intent callbacks preserve ownership and are easier to test.

### 3.3 Children props

Declare the narrowest correct child type:

```ts
type PanelProps = {
  title: string;
  children?: Children;
};
```

Child props are special shapes and should be forwarded as children rather than blindly reading `.value`. If a component must transform a child collection, handle the declared child type deliberately.

### 3.4 Snapshot versus reactive read

This captures only the construction-time value:

```ts
m.P({ children: label.value });
```

These preserve updates:

```ts
m.P({ children: label });
m.P({ children: tmpl`Label: ${label}` });
m.P({
  class: css.cases(
    tone,
    { "dark-green": "success", "dark-red": "danger" },
    "near-black",
  ),
  children: label,
});
```

Snapshot reads are valid for a one-time setup, but should be visibly intentional.

---

## 4. Attributes, classes, and events

### 4.1 Static and reactive attributes

Attributes accept plain values or compatible signals:

```ts
const disabled = signal(false);
const title = signal("Ready");

m.Button({
  type: "button",
  class: css("pointer"),
  disabled,
  title,
  children: "Run",
});
```

Use NoCSS helpers for visual state. They validate the names and ensure every declared outcome is present in generated CSS:

```ts
const selected = signal(false);

m.Button({
  class: css("bb", css.when(selected, "bw2", "")),
  "aria-pressed": derive(() => String(selected.value)),
  children: "Preview",
});
```

ARIA state attributes generally need serialized string values such as `"true"` and `"false"` where required by their platform contract.

### 4.2 Events

```ts
m.Button({
  type: "button",
  onclick: (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    button.focus();
  },
  children: "Focus me",
});
```

Use the event that matches the semantic control:

- `onclick` for button activation;
- `oninput` for immediate editable value changes;
- `onchange` for committed selection/change behavior;
- `onsubmit` on forms;
- pointer events only for genuinely pointer-specific interactions;
- keyboard handlers for custom controls only when no native element fits.

Do not make a clickable `div`. If an action is a button, use `m.Button`; if it navigates, use `m.A`.

---

## 5. Declarative control flow

### 5.1 `m.If`

```ts
const signedIn = signal(false);

m.If({
  subject: signedIn,
  isTruthy: () => m.P({ children: "Welcome back" }),
  isFalsy: () => m.A({ href: "/login", children: "Sign in" }),
});
```

A signal subject creates reactive output. A missing selected branch currently uses a hidden span as a structural placeholder.

### 5.2 `m.Switch`

```ts
const state = signal<"idle" | "loading" | "ready" | "error">("idle");

m.Switch({
  subject: state,
  cases: {
    idle: () => m.P("Choose an action"),
    loading: () => m.P({ "aria-live": "polite", children: "Loading…" }),
    ready: () => m.P("Complete"),
    error: () => m.P({ role: "alert", children: "Something went wrong" }),
  },
  defaultCase: () => m.P("Unknown state"),
});
```

Normal matching stringifies the subject and compares it with case keys. `caseMatcher(subjectValue, caseKey)` can override matching.

### 5.3 `m.For`

Use an unkeyed list when identity and retained element state do not matter:

```ts
m.Ul({
  children: m.For({
    subject: tags,
    map: (tag) => m.Li({ children: tag }),
  }),
});
```

For a mutable object list, use a stable unique `itemKey`:

```ts
const tasks = signal([
  { id: "t-1", title: "Draft", done: false },
  { id: "t-2", title: "Review", done: true },
]);

m.Ul({
  children: m.For({
    subject: tasks,
    itemKey: "id",
    map: (task, index) => {
      const { title, done } = task.props();

      return m.Li({
        class: css("task", css.when(done, "is-done", "")),
        "data-index": tmpl`${index}`,
        children: title,
      });
    },
  }),
});
```

Keyed mapper arguments are derived signals. Read fields with `item.get("key")` or `item.props()`. Maya preserves existing nodes across updates and reorders. Keys MUST be present and unique.

`n` and `nthChild` are an advanced positional-insertion pair. Supply both or neither; prefer clear DOM composition first.

---

## 6. Forms

Passing `value: state` updates the input from the signal. It does not update the signal when the user types. Write the DOM value back:

```ts
type SignupProps = {
  onSubmit: (email: string) => Promise<void>;
};

export const Signup = component<SignupProps>(({ onSubmit }) => {
  const email = signal("");
  const error = signal("");
  const sending = signal(false);

  return m.Form({
    class: css("measure"),
    onsubmit: async (event) => {
      event.preventDefault();

      if (!email.value.includes("@")) {
        error.value = "Enter a valid email address.";
        return;
      }

      sending.value = true;
      error.value = "";

      try {
        await onSubmit(email.value);
        email.value = "";
      } catch {
        error.value = "Could not submit. Try again.";
      } finally {
        sending.value = false;
      }
    },
    children: [
      m.Label({ for: "signup-email", children: "Email address" }),
      m.Input({
        id: "signup-email",
        name: "email",
        type: "email",
        autocomplete: "email",
        required: true,
        value: email,
        "aria-describedby": "signup-error",
        oninput: (event) => {
          email.value = (event.currentTarget as HTMLInputElement).value;
        },
      }),
      m.Button({
        type: "submit",
        disabled: sending,
        children: tmpl`${() => (sending.value ? "Submitting…" : "Sign up")}`,
      }),
      m.P({
        id: "signup-error",
        role: "alert",
        children: error,
      }),
    ],
  });
});
```

Form requirements:

- every field has an associated visible label;
- use native field types, constraints, and autocomplete;
- use a real form and submit event;
- expose validation and request errors in text;
- preserve user input after recoverable server failures;
- manage focus for complex validation and dialogs;
- never use placeholder text as the only label.

---

## 7. Data and asynchronous states

Start browser requests from an event or lifecycle, not initial tree construction. The toolkit `query()` helper is a small GET/request-state primitive, not a complete server-state library:

```ts
const { isLoading, data, error, runQuery, abortQuery } = query<User[]>(
  "/api/users",
  undefined,
);
```

It does not promise comprehensive caching, retry, deduplication, pagination, mutation, or background refresh. Use `fetch` plus explicit signals for domain-specific behavior. Abort owned requests on unmount.

Every async view needs appropriate:

- initial or idle state;
- loading state that does not create avoidable layout shift;
- empty state;
- recoverable error state;
- stale/refreshing distinction when old data remains visible;
- success state;
- cancellation/race handling.

Do not let an older request overwrite a newer result.

---

## 8. Styling and responsive layout

### 8.1 Baseline

For first-party elemental styles, author the baseline in the configured NoCSS `styles.ts`, then apply it through the typed helper:

```ts
import {
  defineCompoundClasses,
  getCss,
  type AppAtomicClassNames,
  type AppClassNames,
  type AtomicClassName,
  type AtomicClassOverrides,
} from "@cyftec/maya/nocss";

export const atomicClassOverrides = {
  default: {
    app: "{ color-scheme: light dark; font-family: system-ui, sans-serif; text-size-adjust: 100%; }",
    "app-body": "{ margin: 0; min-block-size: 100vh; }",
    control: "{ font: inherit; }",
    media: "{ display: block; max-inline-size: 100%; }",
    "focus-ring:focus-visible":
      "{ outline: .1875rem solid currentColor; outline-offset: .1875rem; }",
  },
} as const satisfies AtomicClassOverrides;

type AppAtomicClassName = AppAtomicClassNames<
  AtomicClassName,
  typeof atomicClassOverrides
>;

export const compoundClasses = defineCompoundClasses<AppAtomicClassName>()({
  action: "control focus-ring pointer ph3 pv2 br2",
});

export type ClassName = AppClassNames<
  AtomicClassName,
  typeof atomicClassOverrides,
  typeof compoundClasses
>;

export const css = getCss<ClassName, typeof compoundClasses>(compoundClasses);
```

```ts
m.Html({
  class: css("app"),
  children: m.Body({
    class: css("app-body"),
    children: m.Button({
      class: css("action"),
      type: "button",
      children: "Continue",
    }),
  }),
});
```

Use the atomic-first decision tree: use an existing atom when it matches; override it when its declaration does not match; create a narrowly scoped atom when one is absent; then use or create a compound for a repeated combination. NoCSS is the preferred owner for this first-party elemental work. A human author may deliberately combine it with an icon, syntax-highlighting, editor, chart, or other third-party stylesheet when that source owns the concern; avoid unintentional cascade overlap. Coding agents must not introduce or extend that second styling system unless the user explicitly authorizes it.

### 8.2 Responsive behavior

Layouts MUST survive:

- narrow phone widths without horizontal document overflow;
- large text and browser zoom;
- long words, translated labels, and real data;
- zero, one, and many collection items;
- short and tall viewports;
- wide screens without unreadably long text lines.

Prefer NoCSS classes that use intrinsic sizing, wrapping flex/grid, `minmax()`, `clamp()`, and logical properties. Use the `-ns`, `-m`, and `-l` variants or custom rules in the matching NoCSS groups. Avoid JavaScript layout branching unless browser observation is actually required.

### 8.3 Visual fidelity

When a visual reference exists:

1. use the exact assets and fonts;
2. match page/container geometry;
3. match font metrics and wrapping;
4. match spacing and alignment;
5. match borders, radii, shadows, gradients, and color;
6. implement responsive and interaction states;
7. capture identical-size screenshots and compare with an overlay/diff.

Do not claim pixel accuracy from memory or a single viewport.

---

## 9. Accessibility baseline

Every UI MUST provide:

- a useful document title and language;
- one logical heading hierarchy;
- semantic landmarks and source order;
- text alternatives for meaningful images/icons;
- programmatic labels and descriptions;
- keyboard access to every action;
- visible focus;
- no keyboard trap;
- sufficient text and non-text contrast;
- status/error announcement where needed;
- controls whose target size is practical for touch;
- motion that respects `prefers-reduced-motion`;
- information that does not rely only on color.

For dialogs, menus, tabs, comboboxes, and other composite widgets, follow the platform/ARIA interaction pattern completely. A partial custom widget is worse than an appropriate native element.

Canvas fallback UI, game menus, score, pause, settings, and instructions are also governed by this profile even when the playfield follows the canvas profile.

---

## 10. Conventional UI page example

```ts
import { component, m } from "@cyftec/maya/core";
import { signal, tmpl } from "@cyftec/maya/signals";
import { css } from "./assets/styles.js";

type CounterProps = {
  label: string;
};

const Counter = component<CounterProps>(({ label }) => {
  const count = signal(0);

  return m.Section({
    class: css("center measure pa3"),
    "aria-labelledby": "counter-title",
    children: [
      m.H1({ id: "counter-title", children: label }),
      m.Output({
        class: css("db f2 tc"),
        "aria-live": "polite",
        children: tmpl`${count}`,
      }),
      m.Button({
        type: "button",
        onclick: () => {
          count.value += 1;
        },
        children: "Add one",
      }),
    ],
  });
});

export default m.Html({
  lang: "en",
  children: [
    m.Head([
      m.Meta({ charset: "UTF-8" }),
      m.Meta({
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      }),
      m.Title("Counter"),
      m.Link({ rel: "stylesheet", href: "/assets/styles.css" }),
    ]),
    m.Body([
      m.Main({ children: Counter({ label: "Counter" }) }),
      m.Script({ src: "main.js", defer: true }),
    ]),
  ],
});
```

---

## 11. UI failure catalogue

### A list loses focus or local state on reorder

Use keyed `m.For` with a stable unique `itemKey`.

### A keyed mapper cannot access fields

The item is a derived object signal. Use `item.get("field")` or `item.props()`, not direct property access.

### Input text snaps back

The input has a signal `value` but no `oninput` write-back, or an older async result overwrites current state.

### A control only works with a mouse

A generic element was used, or keyboard semantics were omitted. Replace it with a native button/link/input or implement the complete interaction pattern.

### Content changes but assistive technology is silent

Use a suitable `output`, `role="status"`, `aria-live`, or `role="alert"` region. Do not indiscriminately make the whole page live.

### Mobile layout overflows

Look for fixed widths, non-wrapping flex children, missing minimum-size rules, unbounded media, long content, and route-level canvas sizing. Correct the relevant NoCSS rules or class composition.

---

## 12. UI checklist

- [ ] Shared Maya application specification also followed.
- [ ] Semantic elements used before generic containers.
- [ ] Every reusable UI unit uses `component()` or `fragment()`.
- [ ] Props are domain values plus intent callbacks.
- [ ] Reactive values are forwarded or read in reactive contexts.
- [ ] Valid string/node children only.
- [ ] Lists are keyed where identity matters.
- [ ] Form values write back on user input.
- [ ] Native controls, labels, focus, and keyboard behavior are complete.
- [ ] Async idle/loading/empty/error/success states are implemented.
- [ ] Every first-party elemental class owned by NoCSS passes through the app's typed helper, and each hybrid style source has explicit ownership.
- [ ] No agent-authored stylesheet, inline style, or injected CSS was added.
- [ ] NoCSS output is responsive and reduced-motion behavior was considered.
- [ ] Long content, zoom, narrow, and wide layouts were tested.
- [ ] Visual references were compared at matching viewport sizes.
- [ ] Browser console and accessibility behavior were checked.
