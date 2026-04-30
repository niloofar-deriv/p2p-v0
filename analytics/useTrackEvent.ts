"use client";

import { useCallback } from "react";
import { Analytics } from "@deriv-com/analytics";
import { useUserDataStore } from "@/stores/user-data-store";
import { useLanguageStore } from "@/stores/language-store";

const PROJECT_NAME = "p2p_web_app";

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
  const { userId, brand, residenceCountry, onboardingStatus } = useUserDataStore.getState();
  const { locale } = useLanguageStore.getState();

  const isLoggedIn = Boolean(userId);
  const eventMetadata: Record<string, unknown> = {
    page_name: params.pageName,
    ...(isLoggedIn && brand ? { account_type: brand.toLowerCase() } : {}),
    user_language: locale,
    country_of_residence: residenceCountry?.toLowerCase() ?? "",
    is_profile_completed: onboardingStatus?.p2p?.allowed ?? false,
    project_name: PROJECT_NAME,
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
    (params.errorCode || params.errorMessage)
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

/**
 * Global payload builder. Wraps `Analytics.trackEvent` with a stable `send` callback.
 *
 * - All runtime values are read inside `buildAndSend` at call time — not captured here.
 *   This keeps the deps array empty and `send` referentially stable.
 * - `buildAndSend` is a module-level function so it never triggers re-renders.
 * - Analytics failure is swallowed in try/catch — never propagates to the caller.
 *
 * Import and call `useTrackEvent` only from per-flow tracker hooks in `analytics/flows/`.
 * Call sites should import from `analytics/useTrackers` (the aggregator), not here directly.
 *
 * @example
 * const { send } = useTrackEvent();
 * send({ eventName: "ce_p2p_page", action: "open", pageName: "ads" });
 */
export function useTrackEvent() {
  const send = useCallback(buildAndSend, []);
  return { send };
}
