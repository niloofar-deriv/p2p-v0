# EventKit Implementation Guide

---

## global_rules

These rules apply to every EventKit implementation regardless of platform (Flutter, React/Next.js). Violating any one produces an invalid implementation.

Platform-specific rules and code examples are in `flutter/rules.md` or `react-next/rules.md`.

---

### rule_1 — spec_is_the_only_source_of_truth

The flow JSON files define exactly which trackers must exist. Add trackers missing from code, update trackers that don't match spec, and **remove trackers in code that are not in spec**. Never invent trackers. Never skip trackers. Deviations from spec are always your responsibility to fix immediately — do not ask permission.

**Before writing any code:** read the spec, then read the existing code. Classify every tracker (NEW / UNCHANGED / UPDATED / MISPLACED / EXTRA) before touching anything.

---

### rule_2 — ids_are_project-scoped — switch pattern is platform-specific

**Flutter only:** The switch key is always `${PREFIX}_${trackId}`. `PREFIX` equals the `project_name` field in `event_metadata.json`. Read it; never guess it. Call sites always pass the bare `eventkit_id`.

```dart
// Flutter — correct
const PREFIX = 'my_app';              // from event_metadata.json
switch ('${PREFIX}_${trackId}') {
  case 'my_app_ek_login': ...
}
```

**React/Next only:** The switch key is the bare `trackId` — **no PREFIX constant, no string interpolation**. The `eventkit_id` values (`ek_...`) are unique across pages by construction (see `eventkit_id` format in `reading_the_spec_files`). Call sites pass the bare `eventkit_id` as-is.

```typescript
// React/Next — correct
switch (trackId) {
  case 'ek_login_get_started': ...
}
```

```typescript
// React/Next — WRONG: never add a PREFIX constant
const PREFIX = 'my_app';
switch (`${PREFIX}_${trackId}`) {   // ← anti-pattern in React/Next
  case 'my_app_ek_login_get_started': ...
}
```

Also: switch keys must use a single underscore separator. Double underscores (`__`) are a legacy format and must be replaced.

→ Detection: see `flutter/rules_scan.md` check #4 / `react-next/rules_scan.md` check #16.

---

### rule_3 — always_use `eventkit_id` — never `data_eventkit_id`

Every tracker in the flow JSON has two ID fields: `data_eventkit_id` (the original HTML attribute value, may be empty or non-unique) and `eventkit_id` (always unique). Always use `eventkit_id`. Never read or reference `data_eventkit_id`.

→ Detection: see `flutter/rules_scan.md` check #3 / `react-next/rules_scan.md` check #15.

---

### rule_4 — no_pii_in_payloads

Never include in any payload: names, emails, phone numbers, addresses, account IDs, financial data, passwords, tokens, or any PII. Sanitize error messages before including them.

---

### rule_5 — coverage_must_be_100%

Never report completion while any tracker is missing. See the Verification Checklist below.

→ Detection: see `flutter/rules_scan.md` check #14 / `react-next/rules_scan.md` check #10.

---

### rule_6 — tracker_belongs_inside_the_outcome_function,_not_the_call_site

When a handler calls a function, trace into the called function and place the tracker where the success/error branches actually are. Never fire a tracker at a call site that delegates the work elsewhere — the outcome is unknown at that point.

**Don't:**
```
// call site — delegates to handleSubmit, outcome unknown here
onTap() {
  track("ek_submit")  // fires before outcome is known
  handleSubmit()
}
```

**Do:**
```
// tracker lives where the try/catch lives
handleSubmit() {
  try {
    await api.submit()
    track("ek_submit")                               // success
  } catch (e) {
    track("ek_submit", { error_message: e.message }) // error
  }
}
```

Follow the call chain as deep as needed until you find the `try/catch` or conditional success/error branches. That is where the tracker belongs — not at any caller above it.

Also: when `submit` is a callback passed into another widget or function, the calling handler never sees the error — it resolves inside the nested function. Trace the call chain to find the `try/catch`; place the tracker there.

→ Detection: see `flutter/rules_scan.md` checks #8, #9 / `react-next/rules_scan.md` check #8.

---

### rule_7 — each_user_action_fires_at_most_one_tracker — mutually_exclusive_branches

A tracker for a given user action must fire in **mutually exclusive branches** — exactly once per code path, never on multiple paths that can both execute. This applies to every branching pattern: `try/catch`, `if/else`, callbacks, `.then/.catch`, or any other conditional structure.

**Always cover the failure path — even when the spec does not define error params.** Always pass `error_message` in the error branch.

#### try/catch

**Don't — fires before `try` block, causing double-fire on error:**
```
track("ek_submit")   // fires unconditionally → 2 events on error
try {
  await api.submit()
} catch (e) {
  track("ek_submit", { error_message: e.message }) // fires again
}
```

**Do — success/error split inside try/catch:**
```
try {
  await api.submit()
  track("ek_submit")                               // success only
} catch (e) {
  track("ek_submit", { error_message: e.message }) // error only
}
```

#### if/else

**Don't — unconditional call fires on every branch:**
```
track("ek_submit")          // fires unconditionally → 2 events when condition is true
if (result.ok) {
  track("ek_submit")        // fires again
}
```

**Don't — missing else means error path fires unconditionally:**
```
if (result.ok) {
  track("ek_submit")
}
track("ek_submit", { error_message: result.error }) // fires even when result.ok — double-fire
```

**Do — tracker in every branch, never outside:**
```
if (result.ok) {
  track("ek_submit")                               // success only
} else {
  track("ek_submit", { error_message: result.error }) // error only
}
```

#### .then/.catch (promise chains)

**Don't:**
```
track("ek_submit")                                 // fires before promise settles → double-fire
api.submit()
  .then(() => { ... })
  .catch(e => { track("ek_submit", { error_message: e.message }) })
```

**Do:**
```
api.submit()
  .then(() => { track("ek_submit") })              // success only
  .catch(e => { track("ek_submit", { error_message: e.message }) }) // error only
```

Exception: trackers where the spec defines **only** `action: "trigger"` and there is genuinely no async follow-up may fire once before the action with no catch tracking.

→ Detection: see `flutter/rules_scan.md` checks #8, #11 / `react-next/rules_scan.md` checks #4, #13.

---

### rule_8 — replace_existing_analytics_calls — no_dual_tracking

When placing a new tracker interface call, search for any pre-existing direct analytics call covering the same user action and **delete it**. Adding the new call without removing the old one causes dual tracking — two events per action.

**Don't:**
```
track("ek_submit_signup")          // new interface call added
analytics.trackEvent("ce_signup")  // old direct call NOT removed → dual tracking
```

**Do:**
```
track("ek_submit_signup")
// old analytics.trackEvent call deleted — no dual tracking
```

→ Detection: see `flutter/rules_scan.md` check #1 / `react-next/rules_scan.md` checks #1, #2.

---

### rule_9 — never_leave_todos_or_hardcoded_defaults

Throw an error (`UnimplementedError` in Dart, `new Error(...)` in TypeScript) — never write a TODO comment, a commented-out line, or a hardcoded fallback.

→ For plain-string vs `{{placeholder}}` handling, see `dynamic_values` below.

---

### rule_10 — all_parents_of_a_reusable_component_must_be_covered

When the outcome owner is a prop callback on a reusable component, every parent that passes that prop must implement the tracker. Grep for all usages of the component; cover every one.

**Don't:**
```
ParentA: <SharedWidget onSubmit={handleSubmit} />  // tracker added ✓
ParentB: <SharedWidget onSubmit={handleSubmit} />  // tracker MISSING ✗
```

**Do:**
```
// Both ParentA and ParentB implement the tracker in their respective handlers
ParentA._handleSubmit → tracker added ✓
ParentB._handleSubmit → tracker added ✓
```

A component used by N parents = N separate tracker placements needed. Output a coverage table before editing any file:

```
PROP COVERAGE: SharedWidget onSubmit
  Parent 1: path/to/parent_a.dart:42 → handler: _handleSubmit → needs TRACKED
  Parent 2: path/to/parent_b.dart:87 → handler: _handleSubmit → needs TRACKED
```

→ Detection: see `flutter/rules_scan.md` check #12 / `react-next/rules_scan.md` check #12.

---

## event_types

**Open events** (`action: "open"`): fire on screen/page init. Do not include `cta_information` or `cta_name`. May include `section_name` and/or `container_name` at the top level of `properties` when the screen opens in a specific context (e.g. inside a modal, from a named section) — only if present in the spec. Only implement an open event if it appears in the `trackers` array for that page in the spec — not every page has one. If there is no open event tracker for a page, do not add one.

**Click events** (`action: "click"`): fire on user interaction. Only implement a click event if its CTA appears in the `trackers` array for that page in the spec — do not add tracking to every clickable element. If a CTA is not in the spec, ignore it.

**Trigger events** (`action: "trigger"`): fire programmatically at a specific point in code — not from a user tap or screen load. Use for flow-completion outcomes (e.g. account created, payment failed). The spec will define separate trigger events per outcome — implement each one in its corresponding branch. Each trigger tracker in the spec has a `trigger_id` field — always read it and pass it in the payload. Do not include `cta_information`, `section_name`, or `container_name`. For **failure** trigger events placed in error/catch branches (e.g. `ek_*_failed`), pass `error_code` and `error_message` exactly as you would for a click event in an error branch. For **success** trigger events, omit the error block.

---

## final_payload_structure

```
{
  event: {
    name: "{{event_name}}",
    properties: {
      action: {{action}},

      // trigger event only — read trigger_id from the tracker's "trigger_id" field in the spec
      ...(action === "trigger" ? { trigger_id: {{trigger_id}} } : {}),

      // open event only — include at top level when present in spec; omit entirely if not in spec
      ...(action === "open" && section_name ? { section_name: {{section_name}} } : {}),
      ...(action === "open" && container_name ? { container_name: {{container_name}} } : {}),

      // click event only — omit entirely on open and trigger
      ...(action === "click" ? {
        cta_information: {
          cta_name: {{cta_name}},
          ...(section_name ? { section_name: {{section_name}} } : {}),
          ...(container_name ? { container_name: {{container_name}} } : {})
        }
      } : {}),
      event_metadata: {
        ...(is_logged_in ? { account_type: {{account_type}} } : {}),
        page_name: {{page_name}},
        user_language: {{user_language}},
        device_type: {{device_type}},
        is_profile_completed: {{is_profile_completed}},
        country_of_residence: {{country_of_residence}},
        project_name: {{project_name}}
      },
      // omit error block on success; include on click errors and failure trigger events
      ...((error_code || error_message) ? {
        error: {
          error_code: {{error_code}},
          error_message: {{error_message}}
        }
      } : {})
    }
  }
}
```

**Rules:**

- `cta_information` only on `action === "click"` — omit entirely on open and trigger
- `section_name` / `container_name` on open: at the **top level of `properties`**, only if present in the spec
- `section_name` / `container_name` on click: inside `cta_information`, only if present in the spec
- `section_name` / `container_name`: must NOT appear on trigger events
- `account_type` only when the user is logged in
- `error` block omitted entirely on success — do NOT send `error: null`
- `error` block must NOT appear on **success** trigger events — the outcome is encoded in the `trigger_id` itself. **Failure** trigger events (e.g. `ek_*_failed`) in error/catch branches must include the error block.
- `error_code` and `error_message` are both included whenever either is present

---

## dynamic_values (`{{}}`)

Any value wrapped in `{{}}` in the spec is dynamic — read it from the app at runtime. Never hardcode a dynamic value.

- Plain string (e.g. `"deriv_home_app"`) → hardcode exactly as written. If shared across all trackers (e.g. `project_name`), set it once in the global tracker function. If tracker-specific, hardcode at the call site.
- `{{placeholder}}` → find the corresponding variable in the app and pass it at runtime. **Always convert to lowercase snake_case before including in the payload** — if the app value is `camelCase` or `PascalCase`, convert it (e.g. `languageCode` → `language_code`, `UserType` → `user_type`).

Example: `"cta_name": "{{language_code}}"` → pass `item.languageCode` converted to lowercase snake_case (`language_code`) from the in-scope variable.

---

## reading_the_spec_files

There is one shared `event_metadata.json` for the entire app, and one flow JSON per flow:

**`event_metadata.json`** — shared across all flows. Defines all `event_metadata` fields: their values and descriptions. Read this once — it applies to every tracker in every flow.

- `value` — if a plain string, hardcode it exactly. If `{{placeholder}}`, read it from the app at runtime.
- `description` — context only. Use it to locate the right variable in the app. Never invent a value from the description.

Common fields and their sources:

- `account_type` — real or demo. Read from app state. Only include when logged in.
- `page_name` — read from `pages.page_name` in the flow JSON. Not a runtime URL.
- `user_language` — read from app state at runtime.
- `device_type` — screen size. Hardcode `"mobile"` for mobile projects.
- `is_profile_completed` — read from app state.
- `country_of_residence` — read from app state.
- `project_name` — hardcoded. Value defined in `event_metadata.json`.

> **Note:** Do not use `data_eventkit_id` (or `data-eventkit-id`) on the consumer side. This is an internal identifier used by EventKit tooling only.

**`<flow_name>.json`** — one per flow. Structure:

```json
{
  "version": "0.0.1",
  "flow": "<flow_name>",
  "last_updated": "<date>",
  "pages": [
    {
      "page_name": "<snake_case>",
      "event_name": "<ce_...>",
      "screen_title": "<visible screen title — informational only>",
      "trackers": [...]
    }
  ]
}
```

Each tracker has:

- `action` — `"open"`, `"click"`, or `"trigger"`
- `cta_name` — value to pass as `cta_name` in `cta_information`. Describes the action, not the visual label. **Click only** — never present on open or trigger events.
- `section_name` — on **click**: pass inside `cta_information`. On **open**: pass at the top level of `properties`. Omit if not present in the spec.
- `container_name` — on **click**: pass inside `cta_information`. On **open**: pass at the top level of `properties`. Omit if not present in the spec.
- `description` — context only. Helps locate the right place in the code. Do not include in the payload.

### `eventkit_id` format

Each tracker's `eventkit_id` in the exported JSON is automatically generated by SpecInjector as `{data_eventkit_id}_{page_name}` for click events and `{trigger_id}_{page_name}` for trigger events — e.g. a tracker with `data_eventkit_id: "ek_back"` on page `select_residence` becomes `ek_back_select_residence`. IDs are globally unique across all pages by construction. Use the `eventkit_id` value as-is in your switch statement — do not derive or modify it.

**The JSON spec files are read-only.** Do not edit, reformat, or add fields to any file under `eventkit/trackers/`. Your job is to read and implement them, not change them.

---

## global_tracker_function

For each project, create **one global tracker function** that encodes the full payload structure and all static/runtime values. Individual call sites only pass the dynamic values specific to that tracker.

**The global function should:**

- Accept only tracker-specific inputs as parameters: `eventName`, `action`, `pageName`, `ctaName`, `sectionName`, `containerName`, `errorCode`, `errorMessage`, `triggerId`
- Hardcode static values (e.g. `project_name`, `device_type`) once, from `event_metadata.json`
- Read all runtime/global values (e.g. `account_type`, `user_language`, `is_profile_completed`, `country_of_residence`) directly from the app's global state inside the function — look for existing global variables or providers in the project and use them. Do NOT require call sites to pass these in.
- Build and send the full payload

**Call sites only pass what is unique to that specific tracker:**

```
// open event
trackEvent({ eventName: "ce_welcome_page", action: "open", pageName: "get_started" })

// click event
trackEvent({ eventName: "ce_welcome_page", action: "click", pageName: "get_started", ctaName: "login" })

// click event with error
trackEvent({ eventName: "ce_signup_page", action: "click", pageName: "verify_email", ctaName: "verify_otp", errorMessage: "Invalid OTP" })

// trigger event — triggerId is read from the tracker's "trigger_id" field in the spec
trackEvent({ eventName: "ce_account_completion_page", action: "trigger", pageName: "account_completion", triggerId: "ek_account_completed" })
```

See `project_guide.md` for where to place the global function in this project.

---

## error_tracking

Every click tracker must fire in the correct branch — do NOT call it unconditionally at the top of a handler.

- **Success path**: call the tracker after the action completes without error. Omit the `error` block entirely.
- **Frontend validation error**: call the tracker where validation fails, before any API call. Pass `error_message` only — no `error_code`.
- **API/backend error**: call the tracker in the catch block. Pass **both** `error_code` (HTTP status as string) and `error_message`. Never pass only `error_message` for an API error.
- **One tracker call per attempt** — validation error takes priority (early return), then API error (catch), then success. Never fire multiple trackers for the same user action.
- **Every CTA needs all three branches covered**: FE validation error path, API error path, and success path. A handler with only a catch block is missing the FE validation error. A handler with only an `if (error)` guard is missing the API error.
- **Failure** `trigger` events (e.g. `ek_*_failed`) placed in error/catch branches **must** receive `error_code` and `error_message`. **Success** trigger events never receive error fields.
- If a CTA has multiple conditional branches (e.g. if/else, switch), ensure the tracker is called in **every branch** — do not leave any condition uncovered.
- Never include PII in error messages.

---

## implementation_rules

- Place `open` tracking calls at screen/page init (`initState`, `useEffect`, `onInit`) — this must be the **first thing called** when the page loads, before any other logic
- Place `click` tracking calls in the element's interaction handler (`onTap`, `onClick`), in the correct success/error branch
- Place `trigger` tracking calls directly in the target code branch (success branch for `ek_*_success`, failure branch for `ek_*_failed`). Never call unconditionally.

### active_code_path_(critical)

Before placing any call site, verify the target widget or component is actually rendered in the live app. Searching for a file by name finds dead code as easily as live code — do not stop there.

Trace top-down every time:
1. Start from the router / navigation — find the active route for the target screen
2. From the active page, identify what is instantiated in its build/render method — not just what is imported
3. If multiple versions of a component exist (e.g. `SignupForm` and `SignupFormLegacy`, or a feature-flagged variant and its fallback), grep for usages and confirm which one the active page renders
4. For feature-flagged components: identify the live branch of the flag and place the tracker there only

Output the mandatory TRACE block (from `<stack>/call_sites.md — finding_the_active_component`) before editing any file.

**Dead code signals — treat as red flags; verify before placing any tracker:**
- File or class named with suffixes like `_old`, `_v1`, `_v2`, `_legacy`, `_deprecated` when a non-suffixed counterpart also exists
- Class annotated with `@Deprecated`
- File is not referenced in any route, parent widget, or DI setup
- File has had no recent modifications while a sibling file covers the same screen

If you cannot determine which version is active after tracing the render tree, throw a platform-appropriate error (`throw UnimplementedError('Active component ambiguous — cannot place tracker')` in Dart, `throw new Error('Active component ambiguous — cannot place tracker')` in TypeScript) at any intended call site so CI fails visibly, then stop and report the ambiguity. Do not guess and do not place trackers in both versions.

**Dead functions within active files**

A file can be active (reachable from the router) yet contain functions that are never called from anywhere. These must not receive trackers.

Dead function signals:
- Function is defined in an active file but has zero callers (grep its name — no hits outside its own definition and any tests)
- Function was previously a callback prop but the widget/component it was passed to was removed or replaced
- Function name suggests a replaced feature (e.g. `_handleOldBiometrics` when `_handleBiometrics` also exists in the same file)

Detection before placing a tracker in any non-trivial function:
```bash
# Flutter — verify the function is called somewhere in the active codebase
grep -rn "_handleSubmit\b" lib/ --include="*.dart" | grep -v "void _handleSubmit\|Future<void> _handleSubmit"
# Zero results outside the definition = dead function — do not place tracker

# React/Next.js
grep -rn "handleSubmit\b" . --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  | grep -v "function handleSubmit\|const handleSubmit\|async function handleSubmit"
```

If zero callers are found: do not place a tracker. Report the dead function and the ambiguity. Do not place trackers in both the dead and the live version.

---

### non-blocking_requirement

Tracker calls must **never block or interrupt the user flow**. If a tracker fails, the user action must still complete normally.

- **Flutter**: Always wrap every `trackEvent(...)` call with `unawaited(trackEvent(...))`. Never `await` a tracker directly. Import `dart:async` if not already imported.
- **JavaScript/TypeScript**: Never `await` a tracker call unless the result is needed for the next step (it never should be for analytics).

**Do:**

- Use the project's existing analytics service (see `project_guide.md`)
- Read ALL values from the spec files — never invent or modify them
- Search the codebase to find the real provider/variable for every runtime value before writing code

**Do NOT:**

- Add tracking to any element, screen, or event not listed in the spec
- Create a new analytics service if one already exists
- Move or restructure existing code — tracking is additive only
- Track the same element twice or modify existing element behavior
- Leave TODO comments in generated code — if you cannot find a provider after a thorough search, throw a platform-appropriate error (`throw UnimplementedError(...)` in Dart, `throw new Error(...)` in TypeScript) at the call site so CI fails visibly, then report what is missing
- Hardcode a dynamic value as a temporary default (e.g. `account_type = 'real'`) and leave a TODO to fix it later
- Comment out a tracker field with a note like `// TODO: add when available` — either implement it correctly or throw a CI-failing error and report the blocker

---

## change_detection

For each tracker, classify before writing any code:

- **NEW** — no switch case and no call site → implement + place call site
- **UNCHANGED** — implementation matches spec AND call site is in the correct active file → skip
- **UPDATED** — switch case found but payload doesn't match spec → update the case
- **MISPLACED** — call site found but incorrectly placed. Sub-types (check all four before moving on):
  1. **Dead code** — in a dead-code file, deprecated class, or function that is never called from the active flow
  2. **Wrong function** — in the correct file but in the wrong function; e.g., placed in the outer handler when the action executes inside a nested callback (`_onConfirm`, `onSuccess`, etc.), or vice-versa
  3. **Wrong branch** — inside the correct function but fires unconditionally, or in the wrong outcome branch (success tracker in the catch block, error tracker before the try, etc.)
  4. **Incomplete coverage** — one branch (success or error) is tracked but the other is missing; treat each untracked outcome as a separate misplacement to fix
  → For every sub-type found: remove the misplaced call, trace active path top-down, identify every outcome branch, place the correct tracker in each
- **UPDATED + MISPLACED** — both payload wrong and wrong file → fix both
- **EXTRA** — switch case in code but ID not in spec → delete the case and call site without asking

**Forward pass (spec → code):** for every tracker in the spec, classify and act.

**Reverse pass (code → spec):** search existing switch cases in the current flow's implementation file; any ID not in the spec is EXTRA — delete without asking. Report: `"Removed EXTRA tracker: <id> (not in spec)"`.

---

## verification_checklist

**Coverage must be 100%.** If any tracker in the spec is unimplemented, the task is not done — do not report completion, do not summarise as "X/Y trackers", do not mark the flow as production-ready. Go back and implement the missing trackers. There is no acceptable percentage below 100%.

Before finishing, verify every item against the flow JSON files:

**Spec correctness:**
- [ ] All `eventkit_id` values are globally unique across all pages in the flow — uniqueness is guaranteed by the `{data_eventkit_id}_{page_name}` format generated by SpecInjector
- [ ] No bare IDs like `ek_back`, `ek_support` used as switch keys — always use the full generated `eventkit_id` (e.g. `ek_back_select_residence`)

**Interface + implementation:**
- [ ] *(Flutter)* Every tracker in the spec has a corresponding interface method in the shared package
- [ ] *(Flutter)* Every interface method has a consumer app implementation (`AppXxxTrackers` switch case)
- [ ] *(Flutter)* Each switch case's `trackEvent` call matches the spec (event_name, action, cta_name, section_name, container_name, page_name)
- [ ] *(Flutter)* Every implementation registered via DI (Riverpod `overrideWith`)
- [ ] *(React/Next.js)* Every tracker in the spec has a case in `analytics/flows/use{FlowName}Trackers.ts` between the `@eventkit-cases-start` / `@eventkit-cases-end` markers
- [ ] *(React/Next.js)* Each case's `send()` call matches the spec (eventName, action, pageName, ctaName, sectionName, containerName)
- [ ] *(React/Next.js)* `analytics/useTrackers.ts` imports and composes the flow hook for this flow
- [ ] `trigger_id` present on all trigger events (read from the tracker's `trigger_id` field in the spec), absent on open and click
- [ ] `cta_information` present on click, absent on open and trigger
- [ ] `section_name`/`container_name` on open: at top level of `properties`, not inside `cta_information`
- [ ] `section_name`/`container_name` on click: inside `cta_information`
- [ ] `section_name`/`container_name` absent on trigger events
- [ ] `error` block omitted on success; present with correct fields on error paths
- [ ] `error` block absent on success trigger events; present (with `error_code` + `error_message`) on failure trigger events in error/catch branches
- [ ] Trigger events fire in the correct branch (success triggers in success branch, failure triggers in catch/error branch), never unconditionally

**Call sites (required — implementation is incomplete without this):**
- [ ] Every call site was placed by tracing Router → Active Page → Active Component — not by file name search alone
- [ ] No call site was placed in a dead-code file (verify: the file is reachable from the router and instantiated by its parent)
- [ ] Every tracker in the spec has a call site placed in the correct widget/page
- [ ] Open events fire in `initState` / `useEffect` as the FIRST thing called
- [ ] Click events fire in the element's interaction handler in the correct branch only
- [ ] No tracker called unconditionally — validation error, API error, and success each fire exactly one tracker call
- [ ] *(Flutter)* No widget calls `trackEvent` directly — all go through the feature tracker interface (`ref.read(xTrackersProvider).track(...)`)
- [ ] *(React/Next.js)* No component calls `Analytics.trackEvent` directly — all calls go through `useTrackers`

**Quality:**
- [ ] No extra trackers beyond the spec
- [ ] Dynamic values (`{{placeholder}}`) are method parameters; plain strings hardcoded in the implementation
- [ ] No shared package contains project-specific strings, event names, or conditional logic
- [ ] All modified files pass the linter/analyzer with no errors or warnings
