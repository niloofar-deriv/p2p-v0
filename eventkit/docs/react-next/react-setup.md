# Analytics Setup Guide — React / Next.js

## install

Resolve the exact latest version first, then install with the pinned version so `package.json` never contains `"latest"`:

```bash
# 1. Resolve latest version
npm view @deriv-com/analytics version
# → e.g. 1.43.2

# 2. Install with exact version (replace <version> with the resolved value)
# npm
npm install @deriv-com/analytics@<version> --save-exact --safe-chain-skip-minimum-package-age

# pnpm
pnpm add @deriv-com/analytics@<version> --save-exact --safe-chain-skip-minimum-package-age

# yarn
yarn add @deriv-com/analytics@<version> --exact --safe-chain-skip-minimum-package-age
```

---

## custom_hook

All analytics configuration lives in a single hook. Consumers never need to import `Analytics` directly.

```ts
// analytics/useAnalytics.ts
"use client"; // Next.js App Router only — remove this line in plain React

import { useEffect } from "react";
import { Analytics } from "@deriv-com/analytics";

// Module-level flag — persists across re-renders and React StrictMode double-invokes,
// resets on full page refresh (intentional: providers need a fresh init each load).
let isInitialized = false;

/** Parameters shared by {@link backfillPersonProperties} and {@link identifyEvent}. */
interface IdentifyParams {
  /** external_id from the backend — required. */
  userId: string;
  /** User email — stripped to is_internal flag before sending to providers. */
  email?: string;
  /** BCP 47 language tag (e.g. "en-GB"). */
  language?: string;
  /** ISO country code (e.g. "de", "gb"). */
  countryOfResidence?: string;
}

/**
 * Backfills PostHog person properties. Idempotent — only fills properties not
 * already set. No-op if PostHog is not initialized. Safe to call on every render.
 * Scenario A only — see backfill_person_properties section.
 */
function backfillPersonProperties({
  userId,
  email,
  language,
  countryOfResidence,
}: IdentifyParams): void {
  Analytics.backfillPersonProperties({
    user_id: userId,
    email,
    language,
    country_of_residence: countryOfResidence,
  });
}

/**
 * Links the anonymous session to the identified user across all providers.
 * Call once per login in the auth success handler (Scenario A), or on app
 * load once externalId is available (Scenario B). No-op if already identified.
 * See identify_event section for scenario details.
 */
function identifyEvent({
  userId,
  email,
  language,
  countryOfResidence,
}: IdentifyParams): void {
  Analytics.identifyEvent(userId, {
    email,
    language,
    country_of_residence: countryOfResidence,
  });
}

/**
 * Initialises the analytics SDK once per page load and returns the analytics API.
 *
 * **Mount once at the app root:**
 * - React (CRA / Vite): call `useAnalytics()` at the top of `App.tsx`.
 * - Next.js App Router: call it inside a dedicated `AnalyticsProvider` client component.
 *
 * `trackEvent` and `pageView` cache to localStorage before init completes and replay automatically.
 *
 * @returns `reset` — clears the identified user session on logout.
 * @returns `backfillPersonProperties` — PostHog only; only present when PostHog is configured.
 * @returns `identifyEvent` — links the anonymous session to the identified user.
 *
 * @example
 * const { reset, backfillPersonProperties, identifyEvent } = useAnalytics();
 */
export function useAnalytics() {
  // Declared at hook body level so it can gate the return value below.
  const posthogKey = process.env.YOUR_POSTHOG_KEY; // ← replace with your env var name. Omit entirely if not using PostHog.

  useEffect(() => {
    if (isInitialized) return;
    isInitialized = true;

    const rudderstackKey = process.env.YOUR_RUDDERSTACK_KEY; // ← replace with your env var name

    // Skip silently if no keys are configured — no crash, no noise.
    if (!rudderstackKey && !posthogKey) return;

    Analytics.initialise({
      ...(rudderstackKey && { rudderstackKey }), // Remove if not using RudderStack
      ...(posthogKey && {                        // Remove if not using PostHog
        posthogOptions: {
          apiKey: posthogKey,
          api_host: process.env.YOUR_POSTHOG_HOST, // ← replace with your env var name. Optional — defaults to https://ph.deriv.com
          config: { debug: false },
        },
      }),
      debug: false,
    });

    // PostHog captures page views automatically on every URL change — no manual call needed.
    // RudderStack does not — send the first page view manually after init.
    if (rudderstackKey) {
      Analytics.pageView(window.location.pathname);
    }
  }, []);

  return {
    reset: Analytics.reset,
    ...(posthogKey && { backfillPersonProperties }), // PostHog-only
    identifyEvent,
  };
}
```

---

## react_integration_(cra_/_vite)

Call the hook once at the top of your app. No `'use client'` needed.

```tsx
// App.tsx
import { useAnalytics } from './analytics/useAnalytics'

export default function App() {
  useAnalytics()
  return (
    // ...
  )
}
```

Replace the `YOUR_*` placeholders in `analytics/useAnalytics.ts` with your actual env var names.

---

## next.js_app_router_integration

Create a dedicated `AnalyticsProvider` — keep it separate from any existing `Providers` wrapper:

```tsx
// app/analytics-provider.tsx
"use client";

import { useAnalytics } from "@/analytics/useAnalytics";

/**
 * Initialises the analytics SDK once at the app root.
 *
 * Wrap this around your root layout's `children`. It calls `useAnalytics()`
 * internally — do not also call `useAnalytics()` in a parent component.
 *
 * **Do not extend this component.** Auth state reads, `identifyEvent`, and
 * `backfillPersonProperties` must never be added here. Wire them in a separate
 * hook or component mounted near the app root.
 *
 * @example
 * // app/layout.tsx
 * <AnalyticsProvider>{children}</AnalyticsProvider>
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useAnalytics();
  return <>{children}</>;
}
```

```tsx
// app/layout.tsx
import { AnalyticsProvider } from "./analytics-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
```

---

## full_project_structure

All analytics files live in `analytics/` at the project root (or `src/analytics/` if sources are under `src/`). Never scatter them across `hooks/`, `lib/`, or `utils/` — the ImplementAgent expects them at this fixed path.

```
analytics/
  useAnalytics.ts     ← init hook — SetupAgent creates, consumer configures env vars
  useTrackEvent.ts    ← global payload builder — SetupAgent scaffolds, ImplementAgent configures runtime value sources
  useTrackers.ts      ← tracker dispatch — ImplementAgent owns, do not edit manually
```

| File               | Created by              | Configured by                          | Modified by         |
| ------------------ | ----------------------- | -------------------------------------- | ------------------- |
| `useAnalytics.ts`  | SetupAgent              | Consumer (env var names)               | Consumer            |
| `useTrackEvent.ts` | SetupAgent (typed stub) | ImplementAgent (runtime value sources) | ImplementAgent      |
| `useTrackers.ts`   | ImplementAgent          | —                                      | ImplementAgent only |

The SetupAgent creates `useTrackEvent.ts` as a typed stub only. The ImplementAgent fills in runtime value sources (auth state, country, language, etc.) on its first run.

---

## identify_event

`useAnalytics` returns an `identifyEvent` function. Links the anonymous session to the identified user across all configured providers. Call **once per login** — the SDK skips subsequent calls if the user is already identified in the current session.

```typescript
identifyEvent({
  userId,            // required — external_id from the backend
  email,             // optional — stripped to is_internal flag before sending
  language,          // optional
  countryOfResidence // optional — can be omitted and backfilled later
});
```

### scenario_a — app_has_login_/_logout_flow

Wire `identifyEvent` into **every** auth completion point. Do **not** call `backfillPersonProperties` in any handler — wire it separately in the main layout (see `backfill_person_properties` section below).

An app can have multiple auth completion points — wire `identifyEvent` in all of them.

**Form-based (OTP, password, login submit):**
```typescript
import { useAnalytics } from "@/analytics/useAnalytics";

function OtpVerification() {
  const { identifyEvent } = useAnalytics();

  async function handleVerifySuccess() {
    // If externalId is not in the verify response, call getSession() first
    await AuthAPI.getSession(); // populates externalId in the store
    const externalId = userStore.getState().externalId;
    if (externalId) {
      identifyEvent({
        userId: externalId, // external_id from the backend
        email,              // replace with your email source
        language: navigator.language,
        // countryOfResidence omitted here — backfill handles it once profile loads
      });
    }
  }
}
```

**Token-based (`?token=` URL param — email link, signup redirect, password reset):**
```typescript
// Inside a useEffect in the routing/layout component
const { identifyEvent } = useAnalytics();

const token = searchParams.get("token");
if (token) {
  await AuthAPI.verifyToken(token);
  await AuthAPI.getSession(); // populates externalId in the store
  const externalId = userStore.getState().externalId;
  if (externalId) {
    identifyEvent({ userId: externalId, language: navigator.language });
  }
}
```

### scenario_b — app_has_no_login_flow_(always_logged_in)

No login page — app always loads authenticated. Call `identifyEvent` in the main layout once `externalId` is available. Do **not** call `backfillPersonProperties` — `identifyEvent` already sends all person properties on load.

```typescript
import { useEffect } from "react";
import { useAnalytics } from "@/analytics/useAnalytics";

/**
 * Identifies the current user once their data is available.
 *
 * Scenario B only (no login flow). Do NOT call `backfillPersonProperties`
 * here — `identifyEvent` already sends all person properties on load.
 *
 * Call once near the app root alongside `AnalyticsProvider`.
 *
 * @example
 * // RootLayout or App.tsx — call once near app root
 * useAnalyticsIdentify();
 */
function useAnalyticsIdentify() {
  const { identifyEvent } = useAnalytics();
  const { externalId, email, language, residence } = useAuthState(); // ← verify auth source

  useEffect(() => {
    if (externalId) {
      identifyEvent({
        userId: externalId,            // ← verify: must be external_id from backend
        email,                         // ← verify: email source
        language,                      // ← verify: language source
        countryOfResidence: residence, // ← verify: residence source
      });
    }
  }, [externalId]);
}
```

---

## backfill_person_properties_(posthog_only)

**Scenario A + PostHog only.** Skip for Scenario B (`identifyEvent` already sends all properties). Skip if using RudderStack only (`backfillPersonProperties` is not returned from `useAnalytics`).

Runs on every load where `externalId` is present. Idempotent — only fills PostHog person properties not already set. Needed because profile data (`email`, `countryOfResidence`) may not be fully available at the exact moment `identifyEvent` fires in the login handler.

### usage_in_the_main_layout

```typescript
import { useEffect } from "react";
import { useAnalytics } from "@/analytics/useAnalytics";

/**
 * Backfills PostHog person properties (client_id, email, language,
 * country_of_residence) once the logged-in user's data is available.
 *
 * Scenario A only (app has login/signup flow). Idempotent — only fills
 * properties not already set. Safe to call on every load.
 *
 * Call once near the app root alongside `AnalyticsProvider`.
 *
 * @example
 * // RootLayout or App.tsx — call once near app root
 * useAnalyticsIdentify();
 */
function useAnalyticsIdentify() {
  const { backfillPersonProperties } = useAnalytics();
  const { externalId, email, language, residence } = useAuthState(); // replace with your auth source

  useEffect(() => {
    if (!externalId || !backfillPersonProperties) return; // backfillPersonProperties is undefined when PostHog is not configured
    backfillPersonProperties({
      userId: externalId,
      email,
      language,
      countryOfResidence: residence,
    });
  }, [externalId]);
}
```

---

## logout_/_reset

`useAnalytics` returns a `reset` function. Call on logout to clear the identified user session from all providers so the next session starts anonymous. Safe to call at any time — no-ops if no providers initialized.

### option_a — explicit_logout_button

```typescript
import { useAnalytics } from "@/analytics/useAnalytics";

function LogoutButton() {
  const { reset } = useAnalytics();

  function handleLogout() {
    // ... your existing logout logic ...
    reset();
  }
}
```

### option_b — no_logout_button_(auth_state_change)

Use when sessions end via token expiry, SSO redirect, or external auth. Watch for `isLoggedIn: true → false`. Use `useRef` to skip the initial render so `reset` is not triggered when the app first loads logged-out.

```typescript
import { useEffect, useRef } from "react";
import { useAnalytics } from "@/analytics/useAnalytics";

/**
 * Watches for the `isLoggedIn: true → false` transition and calls `reset()`
 * to clear the identified user session from all analytics providers.
 *
 * Use when there is no explicit logout button (sessions end via token expiry,
 * SSO redirect, or external auth). Mount once near the app root. Returns `null`.
 *
 * @example
 * <AuthWatcher />
 */
function AuthWatcher() {
  const { reset } = useAnalytics();
  const isLoggedIn = useAuthState(); // replace with your auth state source
  const prevLoggedIn = useRef<boolean | null>(null);

  useEffect(() => {
    if (prevLoggedIn.current === true && !isLoggedIn) {
      reset();
    }
    prevLoggedIn.current = isLoggedIn;
  }, [isLoggedIn]);

  return null;
}
```
