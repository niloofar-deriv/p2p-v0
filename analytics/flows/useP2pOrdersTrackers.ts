"use client";

import { useCallback } from "react";
import { useTrackEvent } from "../useTrackEvent";

export function useP2pOrdersTrackers() {
  const { send } = useTrackEvent();

  const track = useCallback(
    (trackId: string, params?: Record<string, unknown>) => {
      switch (trackId) {
        // @eventkit-cases-start

        // ── orders page ─────────────────────────────────────────────────────

        case "ek_open_orders":
          send({
            eventName: "ce_p2p_orders_page",
            action: "open",
            pageName: "orders",
          });
          break;

        case "ek_profile_orders":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "orders",
            ctaName: "profile",
          });
          break;

        case "ek_notifications_orders":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "orders",
            ctaName: "notifications",
          });
          break;

        case "ek_ask_amy_orders":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "orders",
            ctaName: "ask_amy",
          });
          break;

        case "ek_active_tab_orders":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "orders",
            ctaName: "active_tab",
          });
          break;

        case "ek_past_tab_orders":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "orders",
            ctaName: "past_tab",
          });
          break;

        case "ek_order_item_orders":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "orders",
            ctaName: "order_item",
            sectionName: String(params?.section_name ?? ""),
          });
          break;

        case "ek_rate_order_orders":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "orders",
            ctaName: "rate_order",
            sectionName: "past_orders",
          });
          break;

        case "ek_chat_orders":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "orders",
            ctaName: "chat",
            sectionName: "active_orders",
          });
          break;

        case "ek_date_filter_orders":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "orders",
            ctaName: "date_filter",
            sectionName: "past_orders",
          });
          break;

        case "ek_browse_market_orders":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "orders",
            ctaName: "browse_market",
            sectionName: "empty_state",
          });
          break;

        case "ek_create_ad_orders":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "orders",
            ctaName: "create_ad",
            sectionName: "empty_state",
          });
          break;

        case "ek_retry_orders":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "orders",
            ctaName: "retry",
            sectionName: "error_state",
          });
          break;

        // ── order_details page ──────────────────────────────────────────────

        case "ek_close_order_details":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_details",
            ctaName: "close",
          });
          break;

        case "ek_view_order_info_order_details":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_details",
            ctaName: "view_order_info",
            sectionName: "amount_card",
          });
          break;

        case "ek_counterparty_profile_order_details":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_details",
            ctaName: "counterparty_profile",
            sectionName: "amount_card",
          });
          break;

        case "ek_chat_order_details":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_details",
            ctaName: "chat",
            sectionName: "amount_card",
          });
          break;

        case "ek_copy_order_id_order_details":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_details",
            ctaName: "copy_order_id",
            sectionName: "amount_card",
          });
          break;

        case "ek_expand_payment_method_order_details":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_details",
            ctaName: "expand_payment_method",
            sectionName: "payment_details",
          });
          break;

        case "ek_copy_payment_field_order_details":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_details",
            ctaName: "copy_payment_field",
            sectionName: "payment_details",
          });
          break;

        case "ek_ive_paid_order_details":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_details",
            ctaName: "ive_paid",
            sectionName: "order_actions",
          });
          break;

        case "ek_cancel_order_order_details":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_details",
            ctaName: "cancel_order",
            sectionName: "order_actions",
          });
          break;

        case "ek_ive_received_payment_order_details":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_details",
            ctaName: "ive_received_payment",
            sectionName: "order_actions",
          });
          break;

        case "ek_make_complaint_order_details":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_details",
            ctaName: "make_complaint",
            sectionName: "order_actions",
          });
          break;

        case "ek_rate_transaction_order_details":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_details",
            ctaName: "rate_transaction",
            sectionName: "order_actions",
          });
          break;

        // ── order_info page ─────────────────────────────────────────────────

        case "ek_back_order_info":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_info",
            ctaName: "back",
          });
          break;

        case "ek_copy_order_id_order_info":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_info",
            ctaName: "copy_order_id",
          });
          break;

        // ── order_otp page ──────────────────────────────────────────────────

        case "ek_back_order_otp":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_otp",
            ctaName: "back",
          });
          break;

        case "ek_help_order_otp":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_otp",
            ctaName: "help",
          });
          break;

        case "ek_help_got_it_order_otp":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_otp",
            ctaName: "help_got_it",
            sectionName: "otp_help_sheet",
          });
          break;

        case "ek_resend_otp_order_otp":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_otp",
            ctaName: "resend_otp",
          });
          break;

        case "ek_otp_verified_order_otp":
          send({
            eventName: "ce_p2p_orders_page",
            action: "trigger",
            pageName: "order_otp",
            triggerId: "ek_otp_verified",
          });
          break;

        case "ek_otp_verification_failed_order_otp":
          send({
            eventName: "ce_p2p_orders_page",
            action: "trigger",
            pageName: "order_otp",
            triggerId: "ek_otp_verification_failed",
            ...(params?.error_code !== undefined && { errorCode: String(params.error_code) }),
            ...(params?.error_message !== undefined && { errorMessage: String(params.error_message) }),
          });
          break;

        case "ek_otp_resent_order_otp":
          send({
            eventName: "ce_p2p_orders_page",
            action: "trigger",
            pageName: "order_otp",
            triggerId: "ek_otp_resent",
          });
          break;

        // ── order_dispute_sheet page ────────────────────────────────────────

        case "ek_select_dispute_reason_order_dispute_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_dispute_sheet",
            ctaName: String(params?.dispute_reason ?? ""),
            sectionName: "order_dispute_sheet",
          });
          break;

        case "ek_open_live_chat_order_dispute_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_dispute_sheet",
            ctaName: "open_live_chat",
            sectionName: "order_dispute_sheet",
          });
          break;

        case "ek_submit_dispute_order_dispute_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_dispute_sheet",
            ctaName: "submit_dispute",
            sectionName: "order_dispute_sheet",
          });
          break;

        case "ek_dispute_submitted_order_dispute_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "trigger",
            pageName: "order_dispute_sheet",
            triggerId: "ek_dispute_submitted",
          });
          break;

        case "ek_dispute_submission_failed_order_dispute_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "trigger",
            pageName: "order_dispute_sheet",
            triggerId: "ek_dispute_submission_failed",
            ...(params?.error_code !== undefined && { errorCode: String(params.error_code) }),
            ...(params?.error_message !== undefined && { errorMessage: String(params.error_message) }),
          });
          break;

        // ── order_cancel_sheet page ─────────────────────────────────────────

        case "ek_keep_order_order_cancel_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_cancel_sheet",
            ctaName: "keep_order",
            sectionName: "order_cancel_sheet",
          });
          break;

        case "ek_confirm_cancel_order_cancel_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_cancel_sheet",
            ctaName: "confirm_cancel",
            sectionName: "order_cancel_sheet",
          });
          break;

        case "ek_order_cancelled_order_cancel_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "trigger",
            pageName: "order_cancel_sheet",
            triggerId: "ek_order_cancelled",
          });
          break;

        case "ek_order_cancellation_failed_order_cancel_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "trigger",
            pageName: "order_cancel_sheet",
            triggerId: "ek_order_cancellation_failed",
            ...(params?.error_code !== undefined && { errorCode: String(params.error_code) }),
            ...(params?.error_message !== undefined && { errorMessage: String(params.error_message) }),
          });
          break;

        // ── proof_of_transfer_sheet page ────────────────────────────────────

        case "ek_close_proof_of_transfer_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "proof_of_transfer_sheet",
            ctaName: "close",
            sectionName: "proof_of_transfer_sheet",
          });
          break;

        case "ek_upload_file_area_proof_of_transfer_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "proof_of_transfer_sheet",
            ctaName: "upload_file_area",
            sectionName: "proof_of_transfer_sheet",
          });
          break;

        case "ek_upload_document_proof_of_transfer_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "proof_of_transfer_sheet",
            ctaName: "upload_document",
            sectionName: "file_source_picker",
          });
          break;

        case "ek_upload_from_gallery_proof_of_transfer_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "proof_of_transfer_sheet",
            ctaName: "upload_from_gallery",
            sectionName: "file_source_picker",
          });
          break;

        case "ek_remove_file_proof_of_transfer_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "proof_of_transfer_sheet",
            ctaName: "remove_file",
            sectionName: "proof_of_transfer_sheet",
          });
          break;

        case "ek_submit_payment_proof_proof_of_transfer_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "proof_of_transfer_sheet",
            ctaName: "submit_payment_proof",
            sectionName: "proof_of_transfer_sheet",
          });
          break;

        case "ek_payment_proof_submitted_proof_of_transfer_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "trigger",
            pageName: "proof_of_transfer_sheet",
            triggerId: "ek_payment_proof_submitted",
          });
          break;

        case "ek_payment_proof_submission_failed_proof_of_transfer_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "trigger",
            pageName: "proof_of_transfer_sheet",
            triggerId: "ek_payment_proof_submission_failed",
            ...(params?.error_code !== undefined && { errorCode: String(params.error_code) }),
            ...(params?.error_message !== undefined && { errorMessage: String(params.error_message) }),
          });
          break;

        // ── order_review_sheet page ─────────────────────────────────────────

        case "ek_star_rating_order_review_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_review_sheet",
            ctaName: String(params?.rating_value ?? ""),
            sectionName: "order_review_sheet",
          });
          break;

        case "ek_recommend_yes_order_review_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_review_sheet",
            ctaName: "recommend_yes",
            sectionName: "order_review_sheet",
          });
          break;

        case "ek_recommend_no_order_review_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_review_sheet",
            ctaName: "recommend_no",
            sectionName: "order_review_sheet",
          });
          break;

        case "ek_submit_review_order_review_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "click",
            pageName: "order_review_sheet",
            ctaName: "submit_review",
            sectionName: "order_review_sheet",
          });
          break;

        case "ek_review_submitted_order_review_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "trigger",
            pageName: "order_review_sheet",
            triggerId: "ek_review_submitted",
          });
          break;

        case "ek_review_submission_failed_order_review_sheet":
          send({
            eventName: "ce_p2p_orders_page",
            action: "trigger",
            pageName: "order_review_sheet",
            triggerId: "ek_review_submission_failed",
            ...(params?.error_code !== undefined && { errorCode: String(params.error_code) }),
            ...(params?.error_message !== undefined && { errorMessage: String(params.error_message) }),
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
