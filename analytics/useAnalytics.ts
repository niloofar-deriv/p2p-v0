"use client";

import { useEffect } from "react";
import { Analytics } from "@deriv-com/analytics";

// Module-level flag — persists across re-renders and React StrictMode double-invokes,
// resets on full page refresh (which is intentional: providers need a fresh init).
let isInitialized = false;

/** Parameters shared by {@link backfillPersonProperties} and {@link identifyEvent}. */
interface IdentifyParams {
  /** external_id from the backend — required, all consumers must send this. */
  userId: string;
  /** User email address. Optional. */
  email?: string;
  /** BCP 47 language tag (e.g. "en-GB"). Optional. */
  language?: string;
  /** ISO country code (e.g. "de", "gb"). Optional. */
  countryOfResidence?: string;
}

/**
 * Ensures client_id, language, and country_of_residence are set in PostHog stored person properties.
 *
 * - Idempotent: only fills in properties not already set on the PostHog profile.
 * - No-op if PostHog is not initialized.
 * - Safe to call on every render or auth state change.
 *
 * Call this whenever the logged-in user's data becomes available (e.g. after
 * hydrating auth state in the root layout). Only applicable when PostHog is
 * configured via NEXT_PUBLIC_POSTHOG_KEY.
 *
 * @example
 * const { backfillPersonProperties } = useAnalytics();
 * backfillPersonProperties({ userId: externalId, email, countryOfResidence: residenceCountry });
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
 * Links the anonymous PostHog or Rudderstack session to the identified user.
 *
 * - No-op if no providers are initialized, or if the user is already identified in the current session.
 * - Call **once per login**, not on every render.
 * - For returning users identified in a previous session, use {@link backfillPersonProperties} instead —
 *   this call will be skipped if the user is already identified.
 *
 * This project has no explicit login flow from the analytics perspective — call this
 * in the root layout via `useAnalyticsIdentify`, gated on `externalId` from `useUserDataStore`.
 *
 * @example
 * const { identifyEvent } = useAnalytics();
 * identifyEvent({ userId: externalId, email, countryOfResidence: residenceCountry });
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
 * **Mount once at the app root via `AnalyticsProvider` in `app/analytics-provider.tsx`.**
 * Do not call `useAnalytics()` in any parent component that already contains `AnalyticsProvider`.
 *
 * Providers are controlled by environment variables:
 * - RudderStack: `NEXT_PUBLIC_RUDDERSTACK_KEY`
 * - PostHog: `NEXT_PUBLIC_POSTHOG_KEY` (host: `NEXT_PUBLIC_POSTHOG_HOST`, optional)
 *
 * **Returned methods are safe to call before init completes.** Both `trackEvent`
 * and `pageView` cache to localStorage when the SDK isn't ready yet, and replay
 * automatically once it is. You never need `cacheTrackEvents` directly.
 *
 * @returns `reset` — clears the identified user session from all providers on logout.
 * @returns `backfillPersonProperties` — (PostHog only) backfills person properties for the current user.
 * @returns `identifyEvent` — links the anonymous session to the identified user across all configured providers.
 *
 * @example
 * const { reset, backfillPersonProperties, identifyEvent } = useAnalytics();
 */
export function useAnalytics() {
  // Declared at hook body level (not inside useEffect) so it can gate the return value below.
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  useEffect(() => {
    if (isInitialized) return;
    isInitialized = true;

    const rudderstackKey = process.env.NEXT_PUBLIC_RUDDERSTACK_KEY;

    // Skip silently if no keys are configured — no crash, no noise.
    if (!rudderstackKey && !posthogKey) return;

    Analytics.initialise({
      ...(rudderstackKey && { rudderstackKey }),
      ...(posthogKey && {
        posthogOptions: {
          apiKey: posthogKey,
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
          config: {
            debug: false,
          },
        },
      }),
      debug: false,
    });

    // PostHog captures page views automatically on every URL change.
    // RudderStack does not — send the first page view manually after init.
    if (rudderstackKey) {
      Analytics.pageView(window.location.pathname);
    }
  }, []);

  return {
    /**
     * Clears the identified user session from all providers (RudderStack and PostHog).
     * Call on logout so the next session starts anonymous.
     * No-ops silently if no providers have been initialised yet.
     */
    reset: Analytics.reset,
    // backfillPersonProperties is PostHog-only — only exposed when PostHog is configured.
    ...(posthogKey && { backfillPersonProperties }),
    identifyEvent,
  };
}
