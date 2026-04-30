"use client";

import { useEffect, useRef } from "react";
import { useAnalytics } from "@/analytics/useAnalytics";
import { useUserDataStore } from "@/stores/user-data-store";

/**
 * Initialises the analytics SDK once at the app root and wires identify/backfill.
 *
 * Wrap this around your root layout's `children`. It calls `useAnalytics()` internally —
 * do not also call `useAnalytics()` in a parent component.
 *
 * Identify behaviour (Scenario B — always authenticated):
 * - `identifyEvent` is fired once when `externalId` becomes available.
 * - `backfillPersonProperties` (PostHog only) is fired on every render where `externalId`
 *   is present — it is idempotent and only fills properties not already set.
 *
 * @example
 * // app/layout.tsx
 * <AnalyticsProvider>{children}</AnalyticsProvider>
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { identifyEvent, backfillPersonProperties } = useAnalytics();

  const externalId = useUserDataStore((state) => state.externalId); // ← verify: external_id source
  const email = useUserDataStore((state) => state.userData?.email); // ← verify: email source
  const countryOfResidence = useUserDataStore((state) => state.residenceCountry); // ← verify: residence source

  const hasIdentified = useRef(false);

  useEffect(() => {
    if (!externalId || hasIdentified.current) return;
    hasIdentified.current = true;

    identifyEvent({
      userId: externalId, // ← verify: must be external_id from the backend
      email: email ?? undefined,
      language: navigator.language, // ← verify: language source for this project
      countryOfResidence: countryOfResidence ?? undefined,
    });
  }, [externalId]);

  useEffect(() => {
    if (!externalId || !backfillPersonProperties) return;

    backfillPersonProperties({
      userId: externalId,
      email: email ?? undefined,
      language: navigator.language, // ← verify: language source for this project
      countryOfResidence: countryOfResidence ?? undefined,
    });
  }, [externalId]);

  return <>{children}</>;
}
