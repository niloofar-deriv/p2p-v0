"use client";

import { useCallback } from "react";
import { useTrackEvent } from "../useTrackEvent";

export function useP2pWalletsTrackers() {
  const { send } = useTrackEvent();

  const track = useCallback(
    (trackId: string, params?: Record<string, unknown>) => {
      switch (trackId) {
        // @eventkit-cases-start

        // ── wallets page ────────────────────────────────────────────────────

        case "ek_open_wallets":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "open",
            pageName: "wallets",
          });
          break;

        case "ek_profile_wallets":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallets",
            ctaName: "profile",
          });
          break;

        case "ek_notifications_wallets":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallets",
            ctaName: "notifications",
          });
          break;

        case "ek_ask_amy_wallets":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallets",
            ctaName: "ask_amy",
          });
          break;

        case "ek_transfer_wallets":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallets",
            ctaName: "transfer",
          });
          break;

        case "ek_wallet_item_wallets":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallets",
            ctaName: String(params?.currency_code ?? ""),
            sectionName: "wallet_list",
          });
          break;

        case "ek_buy_currency_wallets":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallets",
            ctaName: "buy_currency",
            sectionName: "empty_state",
          });
          break;

        case "ek_retry_wallets":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallets",
            ctaName: "retry",
            sectionName: "error_state",
          });
          break;

        // ── wallet_transactions page ────────────────────────────────────────

        case "ek_back_wallet_transactions":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallet_transactions",
            ctaName: "back",
          });
          break;

        case "ek_buy_wallet_transactions":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallet_transactions",
            ctaName: "buy",
            sectionName: "wallet_actions",
          });
          break;

        case "ek_transfer_wallet_transactions":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallet_transactions",
            ctaName: "transfer",
            sectionName: "wallet_actions",
          });
          break;

        case "ek_sell_wallet_transactions":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallet_transactions",
            ctaName: "sell",
            sectionName: "wallet_actions",
          });
          break;

        case "ek_transaction_item_wallet_transactions":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallet_transactions",
            ctaName: "transaction_item",
            sectionName: "transaction_list",
          });
          break;

        case "ek_load_more_wallet_transactions":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallet_transactions",
            ctaName: "load_more",
            sectionName: "transaction_list",
          });
          break;

        case "ek_retry_wallet_transactions":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallet_transactions",
            ctaName: "retry",
            sectionName: "error_state",
          });
          break;

        // ── transfer page ───────────────────────────────────────────────────

        case "ek_close_transfer":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "transfer",
            ctaName: "close",
          });
          break;

        case "ek_from_wallet_transfer":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "transfer",
            ctaName: "from_wallet",
          });
          break;

        case "ek_to_wallet_transfer":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "transfer",
            ctaName: "to_wallet",
          });
          break;

        case "ek_swap_wallets_transfer":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "transfer",
            ctaName: "swap_wallets",
          });
          break;

        case "ek_percentage_fill_transfer":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "transfer",
            ctaName: String(params?.percentage_value ?? ""),
            sectionName: "quick_fill_chips",
          });
          break;

        case "ek_source_currency_segment_transfer":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "transfer",
            ctaName: String(params?.currency_name ?? ""),
            sectionName: "from_currency_selector",
          });
          break;

        case "ek_destination_currency_segment_transfer":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "transfer",
            ctaName: String(params?.currency_name ?? ""),
            sectionName: "to_currency_selector",
          });
          break;

        case "ek_retry_exchange_rate_transfer":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "transfer",
            ctaName: "retry_exchange_rate",
            sectionName: "exchange_rate",
          });
          break;

        case "ek_transfer_transfer":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "transfer",
            ctaName: "transfer",
          });
          break;

        // ── wallet_selector_sheet page ──────────────────────────────────────

        case "ek_select_wallet_wallet_selector_sheet":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "wallet_selector_sheet",
            ctaName: String(params?.wallet_currency ?? ""),
            sectionName: "wallet_selector_sheet",
          });
          break;

        // ── confirm_transfer_sheet page ─────────────────────────────────────

        case "ek_confirm_transfer_confirm_transfer_sheet":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "confirm_transfer_sheet",
            ctaName: "confirm_transfer",
            sectionName: "confirm_transfer_sheet",
          });
          break;

        case "ek_transfer_successful_confirm_transfer_sheet":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "trigger",
            pageName: "confirm_transfer_sheet",
            triggerId: "ek_transfer_successful",
          });
          break;

        case "ek_transfer_failed_confirm_transfer_sheet":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "trigger",
            pageName: "confirm_transfer_sheet",
            triggerId: "ek_transfer_failed",
            ...(params?.error_code !== undefined && { errorCode: String(params.error_code) }),
            ...(params?.error_message !== undefined && { errorMessage: String(params.error_message) }),
          });
          break;

        // ── transfer_successful page ────────────────────────────────────────

        case "ek_got_it_transfer_successful":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "transfer_successful",
            ctaName: "got_it",
          });
          break;

        case "ek_view_details_transfer_successful":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "transfer_successful",
            ctaName: "view_details",
          });
          break;

        // ── transfer_unsuccessful page ──────────────────────────────────────

        case "ek_try_again_transfer_unsuccessful":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "transfer_unsuccessful",
            ctaName: "try_again",
          });
          break;

        case "ek_not_now_transfer_unsuccessful":
          send({
            eventName: "ce_p2p_wallets_page",
            action: "click",
            pageName: "transfer_unsuccessful",
            ctaName: "not_now",
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
