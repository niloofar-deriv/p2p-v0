"use client";

import { useCallback } from "react";
import { useP2pMarketsTrackers } from "./flows/useP2pMarketsTrackers";
import { useP2pMyAdsTrackers } from "./flows/useP2pMyAdsTrackers";
import { useP2pOrdersTrackers } from "./flows/useP2pOrdersTrackers";
import { useP2pProfileTrackers } from "./flows/useP2pProfileTrackers";
import { useP2pWalletsTrackers } from "./flows/useP2pWalletsTrackers";

export function useTrackers() {
  const { track: trackP2pMarkets } = useP2pMarketsTrackers();
  const { track: trackP2pMyAds } = useP2pMyAdsTrackers();
  const { track: trackP2pOrders } = useP2pOrdersTrackers();
  const { track: trackP2pProfile } = useP2pProfileTrackers();
  const { track: trackP2pWallets } = useP2pWalletsTrackers();

  const track = useCallback(
    (trackId: string, params?: Record<string, unknown>) => {
      trackP2pMarkets(trackId, params);
      trackP2pMyAds(trackId, params);
      trackP2pOrders(trackId, params);
      trackP2pProfile(trackId, params);
      trackP2pWallets(trackId, params);
    },
    [trackP2pMarkets, trackP2pMyAds, trackP2pOrders, trackP2pProfile, trackP2pWallets],
  );

  return { track };
}
