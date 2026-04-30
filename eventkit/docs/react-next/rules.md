# React / Next.js — Rules

React/Next.js-specific implementation rules. Global Rules 1–11 are defined in `../implementation_guide.md` — all apply here.

Each rule is defined once here. `call_sites.md` and `architecture.md` reference React rules by number.

---

## rule_1 — per-flow_hooks_+_thin_aggregator

Each flow's tracker switch lives in its own file under `analytics/flows/`. The `analytics/useTrackers.ts` file is a thin aggregator that composes all flow hooks — it contains no switch cases. Call sites always import from `analytics/useTrackers.ts`, never from individual flow hooks.

**File naming:** `analytics/flows/use{FlowName}Trackers.ts` (PascalCase flow slug, e.g. `useSignupTrackers.ts`).

**Don't — cases directly in `useTrackers.ts`:**
```typescript
// analytics/useTrackers.ts — WRONG: switch cases belong in flow files
export function useTrackers() {
  const { send } = useTrackEvent();
  const track = useCallback((trackId, params) => {
    switch (trackId) {
      case "ek_open_signup": send({ ... }); break;
    }
  }, [send]);
  return { track };
}
```

**Don't — call site importing a flow hook directly:**
```typescript
import { useSignupTrackers } from "@/analytics/flows/useSignupTrackers"; // ← never in call sites
```

**Do — flow hook owns its switch:**
```typescript
// analytics/flows/useSignupTrackers.ts
export function useSignupTrackers() {
  const { send } = useTrackEvent();
  const track = useCallback((trackId, params) => {
    switch (trackId) {
      // @eventkit-cases-start
      case "ek_open_signup": send({ ... }); break;
      // @eventkit-cases-end
      default: break;
    }
  }, [send]);
  return { track };
}
```

**Do — aggregator composes flow hooks:**
```typescript
// analytics/useTrackers.ts
import { useSignupTrackers } from "./flows/useSignupTrackers";
export function useTrackers() {
  const { track: trackSignup } = useSignupTrackers();
  const track = useCallback((trackId, params) => {
    trackSignup(trackId, params);
  }, [trackSignup]);
  return { track };
}
```

**Do — call site always uses the aggregator:**
```typescript
import { useTrackers } from "@/analytics/useTrackers";
const { track } = useTrackers();
```

→ Detection: see `rules_scan.md` check #3.

If `useTrackers.ts` contains switch cases directly (old single-hook pattern): extract each case block into a new `analytics/flows/use{FlowName}Trackers.ts` file, import and compose it in the aggregator, then remove the cases from `useTrackers.ts`.

---

## rule_2 — no_PREFIX_constant_in_flow_hooks — switch_on_bare_`trackId`

Each per-flow hook must switch directly on `trackId` — never on a prefixed string. Do not declare a `PREFIX` constant or any string interpolation in the switch expression. This is a React/Next.js override of Global Rule 2 (which uses the `${PREFIX}_${trackId}` pattern in Flutter only).

**Don't — Flutter-only PREFIX pattern, never in React/Next:**
```typescript
const PREFIX = "my_app"; // ← never in React/Next flow files
const track = useCallback((trackId, params) => {
  switch (`${PREFIX}_${trackId}`) {    // ← anti-pattern
    case "my_app_ek_open_signup": ...  // ← project-prefixed case
  }
}, [send]);
```

**Do — bare trackId, bare case labels:**
```typescript
const track = useCallback((trackId, params) => {
  switch (trackId) {                  // ← switch directly on trackId
    case "ek_open_signup_get_started": ...  // ← bare eventkit_id from spec
  }
}, [send]);
```

The `eventkit_id` values in the spec are globally unique across pages by construction (format: `{data_eventkit_id}_{page_name}`), so no project prefix is needed for disambiguation.

→ Detection: see `rules_scan.md` check #16.

---

## rule_3 — hook_returns `{ track }`

`useTrackers` must return a single object: `{ track }`. The `track` function accepts a tracker ID string and optional params. Do not return individual per-event functions.

```typescript
const { track } = useTrackers();
```

---

## rule_4 — `'use client'` on_both_analytics_hooks_(next.js_only)

**Next.js only.** Add `'use client'` at the top of `useTrackers.ts` and `useTrackEvent.ts`. Both use `useCallback` — they cannot run in Server Components.

**Plain React:** omit `'use client'` entirely — the directive does not exist outside Next.js.

**Symptom when missing:** Next.js build error: `You're importing a component that needs "useCallback"... Add the "use client" directive.`

---

## rule_5 — `Analytics` import_only_in `analytics/useTrackEvent.ts`

Never import `@deriv-com/analytics` directly in components or hooks outside the `analytics/` folder. Also applies to the CDN pattern — `window.DerivAnalytics` must be completely removed.

**Don't:**
```typescript
// Direct SDK import in a component or hook
import { Analytics } from '@deriv-com/analytics';
Analytics.trackEvent('ce_signup_page', { ... });

// CDN pattern — must be removed entirely
const { Analytics } = window?.DerivAnalytics ?? {};
cacheTrackEvents.loadEvent([{ event: { name: '...', properties: { ... } } }]);
```

**Do:**
```typescript
const { track } = useTrackers();
track("ek_open_signup_get_started");
```

→ Detection: see `rules_scan.md` checks #1 and #2.

---

## rule_6 — `useCallback` deps_and_dispatch

**Deps:**
- `useTrackEvent`: `useCallback(buildAndSend, [])` — empty deps. `buildAndSend` is a module-level function; all runtime values are read at call time, not from closure.
- Per-flow hook (`use<FlowName>Trackers`): `useCallback(fn, [send])` — `send` is the only dep. Since `send` is stable, `track` is also stable.
- `useTrackers` aggregator: deps are the `track` functions from each flow hook it composes.

**Dispatch:** inside any per-flow hook, always call `send(...)` from `useTrackEvent` — never `Analytics.trackEvent(...)` directly. (This follows from Rule 5 — `Analytics` imports are confined to `useTrackEvent.ts`.)

**Don't:**
```typescript
const track = useCallback(fn, []); // in a flow hook — send is missing from deps
```

---

## rule_7 — open_events_fire_in `useEffect`

Place open trackers inside `useEffect(() => { track('ek_open_...'); }, [track])`. Never fire them outside a `useEffect` or on a button click. Place in the top-level component for that page — the one that mounts exactly once per navigation.

**Don't:**
```typescript
function SignupForm() {
  const { track } = useTrackers();
  track("ek_open_signup"); // fires on EVERY render
}
```

**Do:**
```typescript
function SignupForm() {
  const { track } = useTrackers();
  useEffect(() => {
    track("ek_open_signup");
  }, [track]);
}
```

If the page is a Next.js Server Component, wrap the open tracker in a minimal `'use client'` child component that renders `null`.

→ Detection: see `rules_scan.md` check #6.

---

## rule_8 — error_fields_only_on_error

Only include `errorMessage` and `errorCode` when an actual error occurred. Never pass `null` or `undefined` on a success branch. Success and error are separate `track()` calls.

**Don't:**
```typescript
track("ek_submit_email", { error_message: null }); // success path
track("ek_submit_email", { error_message: success ? null : "failed" });
```

**Do:**
```typescript
track("ek_submit_email"); // success — no params
track("ek_submit_email", { error_message: err.message }); // error path only
```

→ Detection: see `rules_scan.md` check #5.

---

## rule_9 — static_analysis_before_commit

Run `tsc --noEmit` and `npx eslint <files>` on every modified file. Fix all errors. A file with type errors is worse than no implementation.

---

## rule_10 — `@eventkit-cases-start` / `@eventkit-cases-end` markers_are_sacred

These markers in each `analytics/flows/use<FlowName>Trackers.ts` file are intentional scaffold delimiters. Never remove them. On every run, rewrite the entire block between the markers. Cases from previous runs for the same flow must be preserved; EXTRA cases (not in spec) must be removed.

**Don't:**
```typescript
switch (trackId) {
  case 'ek_open_signup_get_started':
    send({ ... });
    break;
  // markers removed ← WRONG
}
```

**Do:**
```typescript
switch (trackId) {
  // @eventkit-cases-start
  case 'ek_open_signup_get_started':
    send({ ... });
    break;
  // @eventkit-cases-end
  default: break;
}
```

**Note:** The `analytics/useTrackers.ts` aggregator contains no switch cases and no markers — it only composes flow hooks.

→ Detection: see `rules_scan.md` check #7.

---

## rule_11 — all_analytics_calls_are_client-side_only

The SDK requires browser APIs. Never call `track()` in a Server Component, a server action, or a plain TS module.

- **Server actions:** fire from the client component after the action resolves
- **Pure TS utilities:** accept a callback parameter instead of calling `track()` directly

**Don't:**
```typescript
// app/signup/page.tsx — Server Component
Analytics.trackEvent('ce_signup_page', { ... }); // window is undefined
```

**Do:**
```typescript
"use client";
const { track } = useTrackers();
const result = await myServerAction(data);
if (result.success) track("ek_signup_success");
```

---

## rule_12 — when_an_api_has_multiple_outcomes,_track_each_outcome_separately

Do not place the tracker at the start of the try block when the API can return distinct in-band outcomes (success / business rejection / unexpected status). Tracking before the outcome is known means rejections are silently counted as successes.

**Don't:**
```typescript
try {
  track('ek_submit') // fires before outcome — business rejections recorded as successes
  const response = await api.submit()
  if (response.status === 'rejected') { /* rejection never tracked */ }
} catch (err) {
  track('ek_submit', { error_message: err.message, error_code: 'api_error' })
}
```

**Do:**
```typescript
try {
  const response = await api.submit()
  if (response.status === 'approved') {
    track('ek_submit')
  } else if (response.status === 'rejected') {
    track('ek_submit', { error_message: `Rejected: ${response.reason}`, error_code: 'rejected' })
  }
} catch (err) {
  track('ek_submit', { error_message: err.message, error_code: 'api_error' })
}
```

When the API only succeeds or throws (no in-band rejection responses), tracking at the top of try is fine.

---

## scan_procedure

See `rules_scan.md` for the full 15-check anti-pattern scan procedure and fail-fast rules. Run all checks on subsequent runs before proceeding to STEP 4C.
