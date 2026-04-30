"use client";

import { useCallback } from "react";
import { useTrackEvent } from "../useTrackEvent";

export function useP2pMyAdsTrackers() {
  const { send } = useTrackEvent();

  const track = useCallback(
    (trackId: string, params?: Record<string, unknown>) => {
      switch (trackId) {
        // @eventkit-cases-start

        // ── my_ads page ─────────────────────────────────────────────────────

        case "ek_open_my_ads":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "open",
            pageName: "my_ads",
          });
          break;

        case "ek_profile_my_ads":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "my_ads",
            ctaName: "profile",
          });
          break;

        case "ek_notifications_my_ads":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "my_ads",
            ctaName: "notifications",
          });
          break;

        case "ek_ask_amy_my_ads":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "my_ads",
            ctaName: "ask_amy",
          });
          break;

        case "ek_toggle_hide_my_ads_my_ads":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "my_ads",
            ctaName: "toggle_hide_my_ads",
          });
          break;

        case "ek_create_ad_my_ads":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "my_ads",
            ctaName: "create_ad",
          });
          break;

        case "ek_manage_ad_my_ads":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "my_ads",
            ctaName: "manage_ad",
            sectionName: "ad_card",
          });
          break;

        case "ek_ad_visibility_warning_my_ads":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "my_ads",
            ctaName: "ad_visibility_warning",
            sectionName: "ad_card",
          });
          break;

        case "ek_retry_my_ads":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "my_ads",
            ctaName: "retry",
            sectionName: "error_state",
          });
          break;

        // ── manage_ad_sheet page ────────────────────────────────────────────

        case "ek_edit_ad_manage_ad_sheet":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "manage_ad_sheet",
            ctaName: "edit_ad",
            sectionName: "manage_ad_sheet",
          });
          break;

        case "ek_share_ad_manage_ad_sheet":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "manage_ad_sheet",
            ctaName: "share_ad",
            sectionName: "manage_ad_sheet",
          });
          break;

        case "ek_toggle_ad_status_manage_ad_sheet":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "manage_ad_sheet",
            ctaName: String(params?.ad_status_action ?? ""),
            sectionName: "manage_ad_sheet",
          });
          break;

        case "ek_delete_ad_manage_ad_sheet":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "manage_ad_sheet",
            ctaName: "delete_ad",
            sectionName: "manage_ad_sheet",
          });
          break;

        // ── delete_ad_sheet page ────────────────────────────────────────────

        case "ek_confirm_delete_delete_ad_sheet":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "delete_ad_sheet",
            ctaName: "confirm_delete",
            sectionName: "delete_ad_sheet",
          });
          break;

        case "ek_cancel_delete_delete_ad_sheet":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "delete_ad_sheet",
            ctaName: "cancel_delete",
            sectionName: "delete_ad_sheet",
          });
          break;

        // ── ad_visibility_sheet page ────────────────────────────────────────

        case "ek_visibility_primary_action_ad_visibility_sheet":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "ad_visibility_sheet",
            ctaName: String(params?.visibility_primary_action ?? ""),
            sectionName: "ad_visibility_sheet",
          });
          break;

        case "ek_visibility_secondary_action_ad_visibility_sheet":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "ad_visibility_sheet",
            ctaName: String(params?.visibility_secondary_action ?? ""),
            sectionName: "ad_visibility_sheet",
          });
          break;

        // ── cancel_ad_sheet page ────────────────────────────────────────────

        case "ek_continue_editing_cancel_ad_sheet":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "cancel_ad_sheet",
            ctaName: "continue_editing",
            sectionName: "cancel_ad_sheet",
          });
          break;

        case "ek_confirm_cancel_ad_cancel_ad_sheet":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "cancel_ad_sheet",
            ctaName: "confirm_cancel_ad",
            sectionName: "cancel_ad_sheet",
          });
          break;

        // ── create_ad_step_1 page ───────────────────────────────────────────

        case "ek_close_create_ad_step_1":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_1",
            ctaName: "close",
          });
          break;

        case "ek_select_buy_type_create_ad_step_1":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_1",
            ctaName: "select_buy_type",
          });
          break;

        case "ek_select_sell_type_create_ad_step_1":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_1",
            ctaName: "select_sell_type",
          });
          break;

        case "ek_account_currency_create_ad_step_1":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_1",
            ctaName: "account_currency",
          });
          break;

        case "ek_select_account_currency_create_ad_step_1":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_1",
            ctaName: String(params?.currency_code ?? ""),
            sectionName: "account_currency_sheet",
          });
          break;

        case "ek_payment_currency_create_ad_step_1":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_1",
            ctaName: "payment_currency",
          });
          break;

        case "ek_select_payment_currency_create_ad_step_1":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_1",
            ctaName: String(params?.currency_code ?? ""),
            sectionName: "payment_currency_sheet",
          });
          break;

        case "ek_rate_type_create_ad_step_1":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_1",
            ctaName: "rate_type",
          });
          break;

        case "ek_select_fixed_rate_create_ad_step_1":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_1",
            ctaName: "select_fixed_rate",
            sectionName: "rate_type_sheet",
          });
          break;

        case "ek_select_floating_rate_create_ad_step_1":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_1",
            ctaName: "select_floating_rate",
            sectionName: "rate_type_sheet",
          });
          break;

        case "ek_next_create_ad_step_1":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_1",
            ctaName: "next",
          });
          break;

        // ── create_ad_step_2 page ───────────────────────────────────────────

        case "ek_back_create_ad_step_2":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_2",
            ctaName: "back",
          });
          break;

        case "ek_close_create_ad_step_2":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_2",
            ctaName: "close",
          });
          break;

        case "ek_select_payment_methods_create_ad_step_2":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_2",
            ctaName: "select_payment_methods",
          });
          break;

        case "ek_toggle_payment_method_create_ad_step_2":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_2",
            ctaName: String(params?.payment_method_name ?? ""),
            sectionName: "payment_methods_sheet",
          });
          break;

        case "ek_confirm_payment_methods_create_ad_step_2":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_2",
            ctaName: "confirm_payment_methods",
            sectionName: "payment_methods_sheet",
          });
          break;

        case "ek_next_create_ad_step_2":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_2",
            ctaName: "next",
          });
          break;

        // ── create_ad_step_3 page ───────────────────────────────────────────

        case "ek_back_create_ad_step_3":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_3",
            ctaName: "back",
          });
          break;

        case "ek_close_create_ad_step_3":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_3",
            ctaName: "close",
          });
          break;

        case "ek_order_time_limit_create_ad_step_3":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_3",
            ctaName: "order_time_limit",
          });
          break;

        case "ek_select_time_limit_create_ad_step_3":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_3",
            ctaName: String(params?.time_limit_minutes ?? ""),
            sectionName: "order_time_limit_sheet",
          });
          break;

        case "ek_country_selection_create_ad_step_3":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_3",
            ctaName: "country_selection",
          });
          break;

        case "ek_select_all_countries_create_ad_step_3":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_3",
            ctaName: "select_all_countries",
            sectionName: "countries_selection_sheet",
          });
          break;

        case "ek_toggle_country_create_ad_step_3":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_3",
            ctaName: String(params?.country_code ?? ""),
            sectionName: "countries_selection_sheet",
          });
          break;

        case "ek_apply_countries_create_ad_step_3":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_3",
            ctaName: "apply_countries",
            sectionName: "countries_selection_sheet",
          });
          break;

        case "ek_reset_countries_create_ad_step_3":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_3",
            ctaName: "reset_countries",
            sectionName: "countries_selection_sheet",
          });
          break;

        case "ek_submit_ad_create_ad_step_3":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "create_ad_step_3",
            ctaName: String(params?.submit_ad_action ?? ""),
          });
          break;

        case "ek_ad_created_create_ad_step_3":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "trigger",
            pageName: "create_ad_step_3",
            triggerId: "ek_ad_created",
          });
          break;

        case "ek_ad_updated_create_ad_step_3":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "trigger",
            pageName: "create_ad_step_3",
            triggerId: "ek_ad_updated",
          });
          break;

        case "ek_ad_submission_failed_create_ad_step_3":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "trigger",
            pageName: "create_ad_step_3",
            triggerId: "ek_ad_submission_failed",
            ...(params?.error_code !== undefined && { errorCode: String(params.error_code) }),
            ...(params?.error_message !== undefined && { errorMessage: String(params.error_message) }),
          });
          break;

        // ── ad_created_sucess page ──────────────────────────────────────────

        case "ek_share_ad_ad_created_sucess":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "ad_created_sucess",
            ctaName: "share_ad",
          });
          break;

        case "ek_go_to_my_ads_ad_created_sucess":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "ad_created_sucess",
            ctaName: "go_to_my_ads",
          });
          break;

        // ── share_ad page ───────────────────────────────────────────────────

        case "ek_close_share_ad":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "share_ad",
            ctaName: "close",
          });
          break;

        case "ek_share_image_share_ad":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "share_ad",
            ctaName: "share_image",
          });
          break;

        case "ek_save_image_share_ad":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "share_ad",
            ctaName: "save_image",
          });
          break;

        case "ek_share_methods_share_ad":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "click",
            pageName: "share_ad",
            ctaName: String(params?.method_name ?? ""),
          });
          break;

        case "ek_image_shared_share_ad":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "trigger",
            pageName: "share_ad",
            triggerId: "ek_image_shared",
          });
          break;

        case "ek_image_saved_share_ad":
          send({
            eventName: "ce_p2p_my_ads_page",
            action: "trigger",
            pageName: "share_ad",
            triggerId: "ek_image_saved",
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
