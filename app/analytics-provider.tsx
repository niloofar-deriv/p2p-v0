"use client";

import { useEffect, useRef } from "react";
import { useAnalytics } from "@/analytics/useAnalytics";
import { useUserDataStore } from "@/stores/user-data-store";
import { useLanguageStore } from "@/stores/language-store";

/**
 * Backfills PostHog person properties on every load where the user is authenticated.
 *
 * Scenario A (explicit login flow). `identifyEvent` is called once in the
 * `handleVerification` success handler in `app/login/_page.tsx`. This hook
 * runs on every load to ensure PostHog has `email`, `language`, and
 * `country_of_residence` set — properties that may not have been fully
 * populated at the moment `identifyEvent` fired during login.
 *
 * Only active when PostHog is configured — `backfillPersonProperties` is
 * undefined when PostHog is not present, and the effect is a no-op in that case.
 *
 * Auth sources:
 * - `externalId`  — external_id from `useUserDataStore`
 * - `email`       — userData.email from `useUserDataStore`
 * - `language`    — locale from `useLanguageStore`
 * - `countryOfResidence` — residenceCountry from `useUserDataStore`
 *
 * @example
 * // Mounted via AnalyticsWatcher in app/layout.tsx — do not call directly.
 * useAnalyticsIdentify();
 */
function useAnalyticsIdentify() {
  const { backfillPersonProperties } = useAnalytics();
  const externalId = useUserDataStore((state) => state.externalId);
  const email = useUserDataStore((state) => state.userData?.email);
  const residenceCountry = useUserDataStore((state) => state.residenceCountry);
  const locale = useLanguageStore((state) => state.locale);

  useEffect(() => {
    if (!externalId || !backfillPersonProperties) return;
    backfillPersonProperties({
      userId: externalId,
      email: email ?? undefined,
      language: locale,
      countryOfResidence: residenceCountry ?? undefined,
    });
  }, [externalId]);
}

/**
 * Watches for the `externalId: non-null → null` transition and calls `reset()`
 * to clear the identified user session from all analytics providers.
 *
 * Used because this project has no explicit logout button — sessions end via
 * token expiry or external auth redirect. Uses a ref to skip the initial render
 * so `reset` is not triggered when the app first loads in a logged-out state.
 *
 * Returns `null` — renders nothing.
 *
 * @example
 * // Mounted via AnalyticsWatcher in app/layout.tsx — do not call directly.
 */
function AuthWatcher() {
  const { reset } = useAnalytics();
  const externalId = useUserDataStore((state) => state.externalId);
  const prevExternalId = useRef<string | null>(null);

  useEffect(() => {
    if (prevExternalId.current !== null && externalId === null) {
      reset();
    }
    prevExternalId.current = externalId;
  }, [externalId]);

  return null;
}

/**
 * Initialises the analytics SDK once at the app root.
 *
 * Wrap this around your root layout's `children`. It calls `useAnalytics()`
 * internally — do not also call `useAnalytics()` in a parent component.
 *
 * **Do not extend this component.** Auth state reads, `identifyEvent`, and
 * `backfillPersonProperties` must never be added here. Wire them in a separate
 * `useAnalyticsIdentify` hook or `AuthWatcher` component mounted near the app root.
 *
 * @example
 * // app/layout.tsx
 * <AnalyticsProvider>{children}</AnalyticsProvider>
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useAnalytics();
  return <>{children}</>;
}

/**
 * Wires backfill and reset analytics for the authenticated user session.
 *
 * - `useAnalyticsIdentify`: calls `backfillPersonProperties` on every load
 *   where `externalId` is available (Scenario A — app has an explicit login
 *   flow; `identifyEvent` is fired in the login success handler instead).
 * - `AuthWatcher`: calls `reset()` when `externalId` transitions from
 *   non-null to null, clearing the identified session on logout/token expiry.
 *
 * Mount once near the app root as a sibling of `AnalyticsProvider` — not
 * inside it. Returns `null`.
 *
 * @example
 * // app/layout.tsx — alongside AnalyticsProvider, not inside it
 * <AnalyticsProvider>{children}</AnalyticsProvider>
 * <AnalyticsWatcher />
 */
export function AnalyticsWatcher() {
  useAnalyticsIdentify();
  return <AuthWatcher />;
}
