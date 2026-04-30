# React / Next.js — Architecture & Patterns

## overview

EventKit React/Next.js trackers use a **three-layer pattern**. Each flow gets its own file under `analytics/flows/`; a thin aggregator in `analytics/useTrackers.ts` composes them all and exposes the same `{ track }` API to call sites.

- `useTrackEvent.ts` — global payload builder. Reads runtime values, builds the full event payload, calls the SDK. The consumer owns this file and configures it once.
- `analytics/flows/use{FlowName}Trackers.ts` — one file per flow. Contains the switch statement keyed on `eventkit_id` for that flow only. The ImplementAgent owns these files; each run touches only the file for the current flow.
- `useTrackers.ts` — thin aggregator. Composes all flow hooks and exposes `{ track }`. Updated by the ImplementAgent each time a new flow file is added.

```
analytics/useTrackEvent.ts              ← 'use client' (Next.js only), payload builder, reads runtime state
  ↑ imported by
analytics/flows/useSignupTrackers.ts    ← 'use client' (Next.js only), signup flow switch, ImplementAgent fills this
analytics/flows/useDepositTrackers.ts   ← 'use client' (Next.js only), deposit flow switch, ImplementAgent fills this
  ↑ imported by
analytics/useTrackers.ts                ← 'use client' (Next.js only), thin aggregator, composes flow hooks
  ↑ used in
app/signup/SignupForm.tsx               ← 'use client' component, calls track()
app/deposit/DepositForm.tsx             ← 'use client' component, calls track()
```

> **`'use client'` is a Next.js App Router directive.** Omit it entirely in plain React projects — the directive does not exist outside Next.js.

All analytics calls are **client-side only** — the SDK requires browser APIs (`window`, `navigator`). Never call `track()` in a Server Component or server action directly.

---

## use_track_event — global_payload_builder

The ImplementAgent creates this file if it does not exist, or configures it if it is a stub. It reads runtime value sources (auth state, country, language, etc.) from `project_guide.md` on its first run, and patches it on subsequent runs if stale. SetupAgent may scaffold a typed stub first, but that is not required.

```typescript
// analytics/useTrackEvent.ts
"use client"; // Next.js App Router only — omit in plain React

import { useCallback } from "react";
import { Analytics } from "@deriv-com/analytics";

type SendParams = {
  eventName: string;
  action: string;
  pageName: string;
  ctaName?: string;
  sectionName?: string;
  containerName?: string;
  errorCode?: string;
  errorMessage?: string;
  triggerId?: string;
};

function buildAndSend(params: SendParams) {
  // ImplementAgent: build eventMetadata using only the fields present in
  // event_metadata.json for this project. Do not add fields that are not in the spec.
  // Resolve each value from the source described in project_guide.md
  // (cookie, URL param, context ref, browser API, etc.).
  const eventMetadata: Record<string, unknown> = {
    // Add fields here based on event_metadata.json — examples:
    //   page_name: params.pageName,
    //   project_name: PROJECT_NAME,
    //   user_language: document.documentElement.lang || 'en',
  };

  const ctaInformation =
    params.action === "click" && params.ctaName
      ? {
          cta_name: params.ctaName,
          ...(params.sectionName && { section_name: params.sectionName }),
          ...(params.containerName && { container_name: params.containerName }),
        }
      : undefined;

  const error =
    params.action !== "trigger" && (params.errorCode || params.errorMessage)
      ? {
          ...(params.errorCode && { error_code: params.errorCode }),
          ...(params.errorMessage && { error_message: params.errorMessage }),
        }
      : undefined;

  try {
    Analytics.trackEvent(params.eventName, {
      action: params.action,
      ...(params.action === "open" && params.sectionName && { section_name: params.sectionName }),
      ...(params.action === "open" && params.containerName && { container_name: params.containerName }),
      event_metadata: eventMetadata,
      ...(ctaInformation && { cta_information: ctaInformation }),
      ...(error && { error }),
      ...(params.triggerId && { trigger_id: params.triggerId }),
    });
  } catch {
    // Analytics failure must never affect the user flow
  }
}

export function useTrackEvent() {
  // All runtime values are read inside buildAndSend at call time — not captured here.
  // This keeps the deps array empty and send() referentially stable.
  // If your project stores auth/language in React Context instead of cookies,
  // use useRef and assign ref.current in the render body — NOT in useEffect.
  // useEffect runs after the render, leaving the ref stale on the first render.
  // See project_guide.md for the full pattern.
  const send = useCallback(buildAndSend, []);
  return { send };
}
```

**Key decisions:**

- `Analytics.trackEvent` is wrapped in try/catch — analytics failure must never propagate to the caller or affect the user flow
- `buildAndSend` reads cookies and `window` at call time — not from a closure — so `useCallback(fn, [])` with empty deps is correct
- If runtime values live in React Context, use `useRef` and update the ref **in the render body** (not in `useEffect`) — `useEffect` runs after the render, so the first render leaves the ref stale; updating in the body is synchronous and always current. Read from it inside `buildAndSend` — this preserves the empty deps array and prevents open events from refiring on auth state changes
- `buildAndSend` is a module-level function so it never triggers re-renders

---

## per-flow_hook — tracker_dispatcher

The ImplementAgent creates one file per flow under `analytics/flows/`. The file name is the isolation boundary — no markers needed between flows. Each run touches only the file for the current flow.

**File naming:** `analytics/flows/use{FlowName}Trackers.ts` where `{FlowName}` is the PascalCase flow slug (e.g. `useSignupTrackers.ts` for flow `signup`).

```typescript
// analytics/flows/useSignupTrackers.ts
"use client"; // Next.js App Router only — omit in plain React

import { useCallback } from "react";
import { useTrackEvent } from "../useTrackEvent";

export function useSignupTrackers() {
  const { send } = useTrackEvent();

  const track = useCallback(
    (trackId: string, params?: Record<string, unknown>) => {
      switch (trackId) {
        // @eventkit-cases-start
        case "ek_open_signup_get_started":
          send({
            eventName: "ce_signup_page",
            action: "open",
            pageName: "get_started",
          });
          break;

        case "ek_submit_email_get_started":
          send({
            eventName: "ce_signup_page",
            action: "click",
            pageName: "get_started",
            ctaName: "create_free_account",
            ...(params?.error_message !== undefined && {
              errorMessage: String(params.error_message),
            }),
            ...(params?.error_code !== undefined && {
              errorCode: String(params.error_code),
            }),
          });
          break;
        // @eventkit-cases-end
        default:
          break; // unknown IDs are handled by other flow hooks — no warning here
      }
    },
    [send], // send is stable (empty deps in useTrackEvent) — track is also stable
  );

  return { track };
}
```

**Subsequent runs:** The agent classifies each case as NEW, UNCHANGED, UPDATED, or EXTRA — and only touches the cases that changed. Cases for previous flows are never deleted unless their `eventkit_id` is absent from the spec (EXTRA tracker).

---

## use_trackers — thin_aggregator

The ImplementAgent keeps this file up to date. It imports every flow hook and composes them into a single `track()` function. Call sites import only from here — they never import individual flow hooks directly.

Each `track()` call is forwarded to all flow hooks; each hook handles the IDs it owns and silently no-ops on unknown IDs.

```typescript
// analytics/useTrackers.ts
"use client"; // Next.js App Router only — omit in plain React

import { useCallback } from "react";
import { useSignupTrackers } from "./flows/useSignupTrackers";
import { useDepositTrackers } from "./flows/useDepositTrackers";

export function useTrackers() {
  const { track: trackSignup } = useSignupTrackers();
  const { track: trackDeposit } = useDepositTrackers();

  const track = useCallback(
    (trackId: string, params?: Record<string, unknown>) => {
      trackSignup(trackId, params);
      trackDeposit(trackId, params);
    },
    [trackSignup, trackDeposit],
  );

  return { track };
}
```

**Adding a new flow:** import the new flow hook and add it to the `track` callback body and `useCallback` deps. `useTrackEvent.ts` and all call sites are untouched.

---

## call_sites

→ See `call_sites.md` for all call site patterns (open, click, trigger, server action, pure TS utility, Server Component wrapping).

---

## typescript_rules

- No `as any` — type all event params properly
- `params` argument type is `Record<string, unknown>` — access via `params?.foo`
- Spread error fields conditionally: `...(params?.error_message !== undefined && { errorMessage: String(params.error_message) })`
- Do not use `!` non-null assertions on analytics payloads — use conditional spreading

---

## file_placement

| File                                    | Owner                                                    | Location                                         |
| --------------------------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| `useAnalytics.ts`                       | SetupAgent                                               | `analytics/useAnalytics.ts`                      |
| `useTrackEvent.ts`                      | ImplementAgent (creates if missing, configures, patches) | `analytics/useTrackEvent.ts`                     |
| `flows/use{FlowName}Trackers.ts`        | ImplementAgent (one file per flow)                       | `analytics/flows/use{FlowName}Trackers.ts`       |
| `useTrackers.ts`                        | ImplementAgent (aggregator, updated per flow)            | `analytics/useTrackers.ts`                       |
| Providers                               | SetupAgent                                               | `app/analytics-provider.tsx` or equivalent       |

All analytics files live in `analytics/`. Per-flow hooks live in `analytics/flows/`. Never scatter them across `hooks/`, `lib/`, or `utils/`. See `react-setup.md` for the full project structure.
