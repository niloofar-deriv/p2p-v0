"use client";

import { useCallback } from "react";
import { useTrackEvent } from "../useTrackEvent";

export function useP2pProfileTrackers() {
  const { send } = useTrackEvent();

  const track = useCallback(
    (trackId: string, params?: Record<string, unknown>) => {
      switch (trackId) {
        // @eventkit-cases-start

        // ── profile page ────────────────────────────────────────────────────

        case "ek_open_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "open",
            pageName: "profile",
          });
          break;

        case "ek_my_stats_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "profile",
            ctaName: "my_stats",
          });
          break;

        case "ek_closed_group_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "profile",
            ctaName: "closed_group",
          });
          break;

        case "ek_payment_methods_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "profile",
            ctaName: "payment_methods",
          });
          break;

        case "ek_following_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "profile",
            ctaName: "following",
          });
          break;

        case "ek_blocked_users_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "profile",
            ctaName: "blocked_users",
          });
          break;

        case "ek_trade_partners_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "profile",
            ctaName: "trade_partners",
          });
          break;

        case "ek_help_centre_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "profile",
            ctaName: "help_centre",
          });
          break;

        case "ek_retry_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "profile",
            ctaName: "retry",
            sectionName: "error_state",
          });
          break;

        case "ek_send_feedback_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "profile",
            ctaName: "send_feedback",
          });
          break;

        // ── profile_completed page ──────────────────────────────────────────

        case "ek_open_profile_completed":
          send({
            eventName: "ce_p2p_profile_page",
            action: "open",
            pageName: "profile_completed",
          });
          break;

        case "ek_go_to_market_profile_completed":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "profile_completed",
            ctaName: "go_to_market",
          });
          break;

        // ── finish_verification page ────────────────────────────────────────

        case "ek_review_verification_finish_verification":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "finish_verification",
            ctaName: "review_verification",
          });
          break;

        // ── blocked_users page ──────────────────────────────────────────────

        case "ek_back_blocked_users":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "blocked_users",
            ctaName: "back",
          });
          break;

        case "ek_clear_search_blocked_users":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "blocked_users",
            ctaName: "clear_search",
          });
          break;

        case "ek_advertiser_profile_blocked_users":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "blocked_users",
            ctaName: "advertiser_profile",
            sectionName: "blocked_user_list",
          });
          break;

        case "ek_unblock_user_blocked_users":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "blocked_users",
            ctaName: "unblock_user",
            sectionName: "blocked_user_list",
          });
          break;

        // ── counterparties page ─────────────────────────────────────────────

        case "ek_back_counterparties":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "counterparties",
            ctaName: "back",
          });
          break;

        case "ek_clear_search_counterparties":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "counterparties",
            ctaName: "clear_search",
          });
          break;

        case "ek_advertiser_profile_counterparties":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "counterparties",
            ctaName: "advertiser_profile",
            sectionName: "counterparty_list",
          });
          break;

        case "ek_block_user_counterparties":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "counterparties",
            ctaName: "block_user",
            sectionName: "counterparty_list",
          });
          break;

        case "ek_unblock_user_counterparties":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "counterparties",
            ctaName: "unblock_user",
            sectionName: "counterparty_list",
          });
          break;

        // ── following page ──────────────────────────────────────────────────

        case "ek_back_following":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "following",
            ctaName: "back",
          });
          break;

        case "ek_following_tab_following":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "following",
            ctaName: String(params?.tab_name ?? ""),
          });
          break;

        case "ek_clear_search_following":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "following",
            ctaName: "clear_search",
          });
          break;

        case "ek_advertiser_profile_following":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "following",
            ctaName: "advertiser_profile",
            sectionName: String(params?.section_name ?? ""),
          });
          break;

        case "ek_unfollow_user_following":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "following",
            ctaName: "unfollow_user",
            sectionName: "following_tab",
          });
          break;

        case "ek_confirm_unfollow_following":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "following",
            ctaName: "confirm_unfollow",
            sectionName: "unfollow_confirmation_sheet",
          });
          break;

        case "ek_cancel_unfollow_following":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "following",
            ctaName: "cancel_unfollow",
            sectionName: "unfollow_confirmation_sheet",
          });
          break;

        case "ek_follow_back_following":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "following",
            ctaName: "follow_back",
            sectionName: "followers_tab",
          });
          break;

        // ── advertiser_profile page ─────────────────────────────────────────

        case "ek_back_advertiser_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "advertiser_profile",
            ctaName: "back",
          });
          break;

        case "ek_follow_advertiser_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "advertiser_profile",
            ctaName: "follow",
            sectionName: "profile_header",
          });
          break;

        case "ek_unfollow_advertiser_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "advertiser_profile",
            ctaName: "unfollow",
            sectionName: "profile_header",
          });
          break;

        case "ek_confirm_unfollow_advertiser_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "advertiser_profile",
            ctaName: "confirm_unfollow",
            sectionName: "unfollow_sheet",
          });
          break;

        case "ek_cancel_unfollow_advertiser_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "advertiser_profile",
            ctaName: "cancel_unfollow",
            sectionName: "unfollow_sheet",
          });
          break;

        case "ek_block_user_advertiser_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "advertiser_profile",
            ctaName: "block_user",
            sectionName: "profile_header",
          });
          break;

        case "ek_confirm_block_advertiser_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "advertiser_profile",
            ctaName: "confirm_block",
            sectionName: "block_confirmation_sheet",
          });
          break;

        case "ek_cancel_block_advertiser_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "advertiser_profile",
            ctaName: "cancel_block",
            sectionName: "block_confirmation_sheet",
          });
          break;

        case "ek_unblock_user_advertiser_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "advertiser_profile",
            ctaName: "unblock_user",
            sectionName: "profile_header",
          });
          break;

        case "ek_view_extended_stats_advertiser_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "advertiser_profile",
            ctaName: "view_extended_stats",
            sectionName: "stats_section",
          });
          break;

        case "ek_advert_action_advertiser_profile":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "advertiser_profile",
            ctaName: String(params?.advert_type ?? ""),
            sectionName: "online_ads",
          });
          break;

        // ── closed_group page ───────────────────────────────────────────────

        case "ek_back_closed_group":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "closed_group",
            ctaName: "back",
          });
          break;

        case "ek_clear_all_members_closed_group":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "closed_group",
            ctaName: "clear_all_members",
          });
          break;

        case "ek_confirm_clear_all_closed_group":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "closed_group",
            ctaName: "confirm_clear_all",
            sectionName: "clear_all_confirmation_sheet",
          });
          break;

        case "ek_cancel_clear_all_closed_group":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "closed_group",
            ctaName: "cancel_clear_all",
            sectionName: "clear_all_confirmation_sheet",
          });
          break;

        case "ek_remove_member_closed_group":
          send({
            eventName: "ce_p2p_profile_page",
            action: "click",
            pageName: "closed_group",
            ctaName: "remove_member",
            sectionName: "members_list",
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
