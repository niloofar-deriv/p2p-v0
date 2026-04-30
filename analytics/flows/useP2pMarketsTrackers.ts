"use client";

import { useCallback } from "react";
import { useTrackEvent } from "../useTrackEvent";

export function useP2pMarketsTrackers() {
  const { send } = useTrackEvent();

  const track = useCallback(
    (trackId: string, params?: Record<string, unknown>) => {
      switch (trackId) {
        // @eventkit-cases-start

        // ── markets page ────────────────────────────────────────────────────

        case "ek_open_markets":
          send({
            eventName: "ce_p2p_markets_page",
            action: "open",
            pageName: "markets",
          });
          break;

        case "ek_profile_markets":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets",
            ctaName: "profile",
          });
          break;

        case "ek_notifications_markets":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets",
            ctaName: "notifications",
          });
          break;

        case "ek_ask_amy_markets":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets",
            ctaName: "ask_amy",
          });
          break;

        case "ek_search_markets":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets",
            ctaName: "search",
          });
          break;

        case "ek_payment_currency_markets":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets",
            ctaName: "payment_currency",
          });
          break;

        case "ek_buy_markets":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets",
            ctaName: "buy",
            sectionName: "hero",
          });
          break;

        case "ek_sell_markets":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets",
            ctaName: "sell",
            sectionName: "hero",
          });
          break;

        case "ek_payment_method_filter_markets":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets",
            ctaName: "payment_method_filter",
          });
          break;

        case "ek_filter_markets":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets",
            ctaName: "filter",
          });
          break;

        case "ek_advert_action_markets":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets",
            ctaName: String(params?.advert_type ?? ""),
            sectionName: "advert_list",
          });
          break;

        case "ek_advertiser_profile_markets":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets",
            ctaName: "advertiser_profile",
            sectionName: "advert_list",
          });
          break;

        case "ek_create_ad_markets":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets",
            ctaName: "create_ad",
            sectionName: "empty_state",
          });
          break;

        // ── markets_search page ─────────────────────────────────────────────

        case "ek_back_markets_search":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_search",
            ctaName: "back",
          });
          break;

        case "ek_clear_search_markets_search":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_search",
            ctaName: "clear_search",
          });
          break;

        case "ek_buy_tab_markets_search":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_search",
            ctaName: "buy_tab",
          });
          break;

        case "ek_sell_tab_markets_search":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_search",
            ctaName: "sell_tab",
          });
          break;

        case "ek_advert_action_markets_search":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_search",
            ctaName: String(params?.advert_type ?? ""),
            sectionName: "search_results",
          });
          break;

        case "ek_advertiser_profile_markets_search":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_search",
            ctaName: "advertiser_profile",
            sectionName: "search_results",
          });
          break;

        // ── markets_advert_sheet page ───────────────────────────────────────

        case "ek_close_markets_advert_sheet":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_advert_sheet",
            ctaName: "close",
            sectionName: "markets_advert_sheet",
          });
          break;

        case "ek_select_payment_method_markets_advert_sheet":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_advert_sheet",
            ctaName: "select_payment_method",
            sectionName: "markets_advert_sheet",
          });
          break;

        case "ek_place_order_markets_advert_sheet":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_advert_sheet",
            ctaName: "place_order",
            sectionName: "markets_advert_sheet",
            ...(params?.error_message !== undefined && {
              errorMessage: String(params.error_message),
            }),
            ...(params?.error_code !== undefined && {
              errorCode: String(params.error_code),
            }),
          });
          break;

        case "ek_order_created_markets_advert_sheet":
          send({
            eventName: "ce_p2p_markets_page",
            action: "trigger",
            pageName: "markets_advert_sheet",
            triggerId: "ek_order_created",
          });
          break;

        case "ek_order_creation_failed_markets_advert_sheet":
          send({
            eventName: "ce_p2p_markets_page",
            action: "trigger",
            pageName: "markets_advert_sheet",
            triggerId: "ek_order_creation_failed",
            ...(params?.error_code !== undefined && { errorCode: String(params.error_code) }),
            ...(params?.error_message !== undefined && { errorMessage: String(params.error_message) }),
          });
          break;

        case "ek_order_rate_slippage_detected_markets_advert_sheet":
          send({
            eventName: "ce_p2p_markets_page",
            action: "trigger",
            pageName: "markets_advert_sheet",
            triggerId: "ek_order_rate_slippage_detected",
          });
          break;

        case "ek_confirm_rate_change_markets_advert_sheet":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_advert_sheet",
            ctaName: "confirm_rate_change",
            sectionName: "rate_slippage_sheet",
          });
          break;

        case "ek_cancel_rate_change_markets_advert_sheet":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_advert_sheet",
            ctaName: "cancel_rate_change",
            sectionName: "rate_slippage_sheet",
          });
          break;

        case "ek_retry_order_markets_advert_sheet":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_advert_sheet",
            ctaName: "retry_order",
            sectionName: "order_error_sheet",
          });
          break;

        case "ek_view_other_ads_markets_advert_sheet":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_advert_sheet",
            ctaName: "view_other_ads",
            sectionName: "order_error_sheet",
          });
          break;

        case "ek_manage_blocked_markets_advert_sheet":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_advert_sheet",
            ctaName: "manage_blocked",
            sectionName: "order_error_sheet",
          });
          break;

        case "ek_view_active_order_markets_advert_sheet":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_advert_sheet",
            ctaName: "view_active_order",
            sectionName: "order_error_sheet",
          });
          break;

        case "ek_open_live_chat_markets_advert_sheet":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_advert_sheet",
            ctaName: "open_live_chat",
            sectionName: "order_error_sheet",
          });
          break;

        case "ek_view_profile_markets_advert_sheet":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_advert_sheet",
            ctaName: "view_profile",
            sectionName: "order_error_sheet",
          });
          break;

        // ── markets_filter page ─────────────────────────────────────────────

        case "ek_toggle_followed_users_markets_filter":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_filter",
            ctaName: "toggle_followed_users",
            sectionName: "markets_filter_sheet",
          });
          break;

        case "ek_sort_by_tier_level_markets_filter":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_filter",
            ctaName: "sort_by_tier_level",
            sectionName: "markets_filter_sheet",
          });
          break;

        case "ek_sort_by_exchange_rate_markets_filter":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_filter",
            ctaName: "sort_by_exchange_rate",
            sectionName: "markets_filter_sheet",
          });
          break;

        case "ek_sort_by_user_rating_markets_filter":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_filter",
            ctaName: "sort_by_user_rating",
            sectionName: "markets_filter_sheet",
          });
          break;

        case "ek_apply_filters_markets_filter":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_filter",
            ctaName: "apply_filters",
            sectionName: "markets_filter_sheet",
          });
          break;

        case "ek_reset_filters_markets_filter":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_filter",
            ctaName: "reset_filters",
            sectionName: "markets_filter_sheet",
          });
          break;

        // ── markets_payment_method_filter page ──────────────────────────────

        case "ek_select_all_payment_methods_markets_payment_method_filter":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_payment_method_filter",
            ctaName: "select_all_payment_methods",
            sectionName: "payment_method_filter_sheet",
          });
          break;

        case "ek_select_payment_method_markets_payment_method_filter":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_payment_method_filter",
            ctaName: String(params?.payment_method_name ?? ""),
            sectionName: "payment_method_filter_sheet",
          });
          break;

        case "ek_apply_filter_markets_payment_method_filter":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_payment_method_filter",
            ctaName: "apply_filter",
            sectionName: "payment_method_filter_sheet",
          });
          break;

        case "ek_reset_filter_markets_payment_method_filter":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_payment_method_filter",
            ctaName: "reset_filter",
            sectionName: "payment_method_filter_sheet",
          });
          break;

        // ── markets_payment_currency page ────────────────────────────────────

        case "ek_select_payment_currency_markets_payment_currency":
          send({
            eventName: "ce_p2p_markets_page",
            action: "click",
            pageName: "markets_payment_currency",
            ctaName: String(params?.currency_code ?? ""),
            sectionName: "payment_currency_selector",
          });
          break;

        // @eventkit-cases-end

        default:
          break; // unknown IDs are handled by other flow hooks
      }
    },
    [send],
  );

  return { track };
}
