# React / Next.js — Call Sites

## reading_the_spec

→ See `implementation_guide.md — reading_the_spec_files` for field definitions and spec structure.

## finding_the_active_component

→ See **active_code_path_(critical)** in `../implementation_guide.md`. Trace top-down (Router → Active Page → Active Component) and output the TRACE block before editing any file.

---

## open_event

→ Placement rule: **React Rule 6** in `rules.md`

**Only implement if the spec includes a tracker with `action: "open"` for this page. If no open tracker exists in the spec, do not add one.**

Fires once when the page/screen mounts. Place in `useEffect` with `[track]` as deps.

```typescript
const { track } = useTrackers();

useEffect(() => {
  track("ek_open_signup_get_started");
}, [track]);
```

With section/container context (only when present in the spec):

```typescript
useEffect(() => {
  track("ek_open_account_details", {
    section_name: "trading_accounts",
    container_name: "real_account",
  });
}, [track]);
```

`section_name` and `container_name` on open events are passed at the **top level of params** — `useTrackEvent` places them at the **top level of properties** (siblings of `action` and `event_metadata`), not inside `cta_information` or `event_metadata`.

If the page is a Next.js Server Component, wrap in a minimal `'use client'` child that renders nothing:

```typescript
// app/signup/page.tsx — Server Component
import { SignupOpenTracker } from './SignupOpenTracker';
import { SignupForm } from './SignupForm';

export default function SignupPage() {
  return (
    <>
      <SignupOpenTracker />
      <SignupForm />
    </>
  );
}

// app/signup/SignupOpenTracker.tsx
'use client';
import { useEffect } from 'react';
import { useTrackers } from '@/analytics/useTrackers';

export function SignupOpenTracker() {
  const { track } = useTrackers();
  useEffect(() => { track('ek_open_signup_get_started'); }, [track]);
  return null;
}
```

---

## click_event

→ Placement rules: **Global Rules 6, 7, 10** in `../implementation_guide.md`

The tracker goes inside the function that owns the outcome — not at the onClick handler or any intermediate function that delegates. Follow the call chain until you reach the try/catch or conditional branches.

```typescript
// GOOD — handleSubmit owns the outcome (has the try/catch itself)
async function handleSubmit() {
  try {
    await submitEmail(email);
    track("ek_submit_email_get_started"); // success
  } catch (err) {
    track("ek_submit_email_get_started", {
      error_code: String((err as ApiError).status),
      error_message: (err as ApiError).message,
    });
  }
}
```

Validation error before API call — both FE and BE errors must be covered:

```typescript
async function handleSubmit() {
  // FE validation error — error_message only, no error_code
  const error = validate(email);
  if (error) {
    track("ek_submit_email_get_started", { error_message: error });
    return;
  }

  try {
    await submitEmail(email);
    track("ek_submit_email_get_started"); // success
  } catch (err) {
    // BE/API error — both error_code (HTTP status) and error_message
    track("ek_submit_email_get_started", {
      error_code: String((err as ApiError).status),
      error_message: (err as ApiError).message,
    });
  }
}
```

Multiple error flows — every early-return branch must call `track()` before returning:

```typescript
async function handleSubmit() {
  // FE error 1
  const emailError = validateEmail(email);
  if (emailError) {
    track("ek_login_login", { error_message: emailError });
    return;
  }
  // FE error 2
  const passwordError = validatePassword(password);
  if (passwordError) {
    track("ek_login_login", { error_message: passwordError });
    return;
  }

  try {
    await login({ email, password });
    track("ek_login_login"); // success
  } catch (err) {
    track("ek_login_login", {
      error_code: String((err as ApiError).status),
      error_message: (err as ApiError).message,
    });
  }
}
// Rule: every branch that returns early is an error path — track() before every return.
```

**When the outcome owner is a prop callback**, grep every parent that passes the prop and add the tracker to all of them:

```bash
# Find every parent passing a prop callback
grep -rn "onConfirm={" . --include="*.tsx" --include="*.ts" --exclude-dir=node_modules --exclude-dir=.next
```

Output a coverage table before editing any file:
```
PROP COVERAGE: <ComponentName> onPropName
  Parent 1: <file>:<line> → handler: <function_name> → needs TRACKED
  Parent 2: <file>:<line> → handler: <function_name> → needs TRACKED
```

---

## trigger_event

A `trigger` event fires programmatically at a specific outcome — not from a user tap or screen load. Each outcome is a separate tracker with its own `trigger_id`.

```typescript
async function handleSignup() {
  try {
    await completeSignup();
    track("ek_signup_success_account_completion", {
      triggerId: "ek_signup_success",
    });
  } catch (err) {
    track("ek_signup_failed_account_completion", {
      triggerId: "ek_signup_failed",
      errorCode: String((err as ApiError).status),
      errorMessage: (err as ApiError).message,
    });
  }
}
```

→ Rules: see `implementation_guide.md — event_types (trigger events)`. Failure triggers always pass `errorCode` + `errorMessage`. Success triggers never include error fields.

---

## server_action — fire_on_the_client_after_resolution

→ Rule: **React Rule 10** in `rules.md`

The analytics SDK requires `window`. Fire from the client component after the server action resolves:

```typescript
"use client"; // Next.js App Router only — omit in plain React
import { useTrackers } from "@/analytics/useTrackers";

export function SignupForm() {
  const { track } = useTrackers();

  async function handleSubmit() {
    const result = await myServerAction(data);
    if (result.success) {
      track("ek_signup_success_account_completion", {
        triggerId: "ek_signup_success",
      });
    } else {
      track("ek_signup_failed_account_completion", {
        triggerId: "ek_signup_failed",
        errorMessage: result.error,
      });
    }
  }
}
```

---

## pure_ts_utility — accept_callbacks

→ Rule: **React Rule 10** in `rules.md`

Analytics hooks cannot be called from plain TypeScript modules. Pass `track` as a callback from the calling component:

```typescript
// utils/signup.ts — no analytics import
export async function completeSignup(
  data: SignupData,
  callbacks: { onSuccess: () => void; onError: (err: string) => void },
) {
  try {
    await api.signup(data);
    callbacks.onSuccess();
  } catch (err) {
    callbacks.onError((err as Error).message);
  }
}

// SignupForm.tsx — client component
const { track } = useTrackers();
completeSignup(data, {
  onSuccess: () =>
    track("ek_signup_success_account_completion", {
      triggerId: "ek_signup_success",
    }),
  onError: (msg) =>
    track("ek_signup_failed_account_completion", {
      triggerId: "ek_signup_failed",
      errorMessage: msg,
    }),
});
```

---

## payload_field_mapping

| Spec field       | `send()` param  | Notes                                                           |
| ---------------- | --------------- | --------------------------------------------------------------- |
| `event_name`     | `eventName`     | Required                                                        |
| `action`         | `action`        | Required                                                        |
| `page_name`      | `pageName`      | Required                                                        |
| `trigger_id`     | `triggerId`     | Trigger only — always pass; absent on open and click            |
| `cta_name`       | `ctaName`       | Click only — never on open or trigger                           |
| `section_name`   | `sectionName`   | Click: inside `cta_information`. Open: top-level in properties. |
| `container_name` | `containerName` | Click: inside `cta_information`. Open: top-level in properties. |
| `error_message`  | `errorMessage`  | Click and failure trigger events in error branches (→ React Rule 7) |
| `error_code`     | `errorCode`     | Click and failure trigger events in error branches (→ React Rule 7) |

---

## verifying_call_sites

→ See **verification_checklist** in `../implementation_guide.md` for the full list. React-specific addition: confirm `track` is imported from `@/analytics/useTrackers` — not from any other path.

---

## call_chain_trace_examples

→ See `call_chain_trace_examples.md` for worked examples (prop callback chain, inline handler).
