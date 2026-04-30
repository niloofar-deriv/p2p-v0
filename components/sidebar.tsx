"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn, getHomeUrl } from "@/lib/utils"
import { NovuNotifications } from "./novu-notifications"
import { useState, useEffect } from "react"
import { useUserDataStore, getCachedSignup } from "@/stores/user-data-store"
import { SvgIcon } from "@/components/icons/svg-icon"
import { useTranslations } from "@/lib/i18n/use-translations"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMarketFilterStore } from "@/stores/market-filter-store"
import { useOrderSidebarStore } from "@/stores/order-sidebar-store"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { KycOnboardingSheet } from "@/components/kyc-onboarding-sheet"
import { useAdvertiserSearch } from "@/hooks/use-api-queries"
import type { Advertisement } from "@/services/api/api-buy-sell"
import EmptyState from "@/components/empty-state"
import { useTrackers } from "@/analytics/useTrackers"
import { AdvertiserSearchResultCard } from "@/components/advertiser-search-result-card"
import { AdvertiserSearchSkeleton } from "@/components/advertiser-search-skeleton"
import MarketIcon from "@/public/icons/ic-buy-sell.svg"
import MarketSelectedIcon from "@/public/icons/ic-buy-sell-selected.svg"
import OrdersIcon from "@/public/icons/ic-orders.svg"
import OrdersSelectedIcon from "@/public/icons/ic-orders-selected.svg"
import AdsIcon from "@/public/icons/ic-my-ads.svg"
import AdsSelectedIcon from "@/public/icons/ic-my-ads-selected.svg"
import WalletIcon from "@/public/icons/ic-wallet.svg"
import WalletSelectedIcon from "@/public/icons/ic-wallet-selected.svg"
import ProfileIcon from "@/public/icons/profile-icon.svg"
import ProfileSelectedIcon from "@/public/icons/profile-icon-red.svg"
import GuideIcon from "@/public/icons/ic-guide.svg"
import GuideSelectedIcon from "@/public/icons/ic-guide-selected.svg"
import HomeIcon from "@/public/icons/ic-house.svg"
import LiveChatIcon from "@/public/icons/ic-livechat.svg"

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isWalletAccount, userData, userId } = useUserDataStore()
  const { t, locale } = useTranslations()
  const { nickname, setNickname, currency, selectedAccountCurrency, activeTab } = useMarketFilterStore()
  const { setPendingAd, setShouldReopenSearchOnReturn } = useOrderSidebarStore()
  const { hideAlert, showAlert } = useAlertDialog()
  const { track } = useTrackers()
  const isPoiExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poi_status !== "approved"
  const isPoaExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poa_status !== "approved"
  const [searchInput, setSearchInput] = useState(nickname)
  const [debouncedSearchInput, setDebouncedSearchInput] = useState(nickname)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchTab, setSearchTab] = useState<"buy" | "sell">("sell")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    data: searchData,
    isFetching: isSearching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useAdvertiserSearch({
    nickname: debouncedSearchInput,
    type: searchTab,
  })

  const searchResults = searchData?.pages.flat() ?? []

  const dropdownSentinelRef = useRef<HTMLDivElement>(null)
  const dropdownScrollContainerRef = useRef<HTMLDivElement>(null)
  const isFetchingNextPageRef = useRef(false)

  // Reset nickname filter when navigating away from market/advertiser pages
  useEffect(() => {
    const isMarketPage = pathname === "/" || pathname.startsWith("/advertiser")
    if (!isMarketPage) {
      setSearchInput("")
      setDebouncedSearchInput("")
      setNickname("")
    }
  }, [pathname, setNickname])

  // Cleanup timeouts on unmount to prevent memory leaks and race conditions
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    }
  }, [])

  // Keep ref in sync so the observer callback always reads the latest value
  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage
  }, [isFetchingNextPage])

  // Infinite scroll: fetch next page when sentinel comes into view
  useEffect(() => {
    const sentinel = dropdownSentinelRef.current
    const scrollContainer = dropdownScrollContainerRef.current
    if (!sentinel || !hasNextPage || !scrollContainer) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPageRef.current) {
          fetchNextPage()
        }
      },
      { threshold: 0, rootMargin: "100px", root: scrollContainer },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, fetchNextPage])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (value.length > 0) {
      setIsSearchFocused(true)
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearchInput(value)
      setNickname(value)
    }, 300)
  }

  const handleAdvertiserClick = (advertiserId: number) => {
    track("ek_advertiser_profile_markets_search")
    if (userId && verificationStatus?.phone_verified && !isPoiExpired && !isPoaExpired) {
      router.push(`/advertiser/${advertiserId}`)
    } else {
      let title = t("profile.gettingStarted")

      if (isPoiExpired && isPoaExpired) title = t("profile.verificationExpired")
      else if (isPoiExpired) title = t("profile.identityVerificationExpired")
      else if (isPoaExpired) title = t("profile.addressVerificationExpired")

      showAlert({
        title,
        description: (
          <div className="space-y-4 my-2">
            <KycOnboardingSheet route="markets" onClose={hideAlert} />
          </div>
        ),
        confirmText: undefined,
        cancelText: undefined,
      })
    }
  }

  const handleBuySellClick = (ad: Advertisement) => {
    track("ek_advert_action_markets_search", { advert_type: ad.type === "buy" ? "sell" : "buy" })
    setPendingAd(ad)
    setIsSearchFocused(false)
    if (pathname.startsWith("/advertiser")) {
      router.push("/")
    }
  }

  const handleClear = () => {
    track("ek_clear_search_markets_search")
    setSearchInput("")
    setDebouncedSearchInput("")
    setNickname("")
  }
  const [showWallet, setShowWallet] = useState<boolean>(() => {
    const cached = getCachedSignup()
    return cached !== "v1"
  })
  const [isV1Signup, setIsV1Signup] = useState(() => {
    const cached = getCachedSignup()
    if (cached !== null) return cached === "v1"
    return userData?.signup === "v1"
  })

  const firstName = userData?.first_name
  const lastName = userData?.last_name
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : null
  const email = userData?.email
  const isDisabled = userData?.status === "disabled"

  useEffect(() => {
    if (userData?.signup === "v1") {
      setShowWallet(false)
      setIsV1Signup(true)
    } else if (userData?.signup) {
      setShowWallet(true)
      setIsV1Signup(false)
    }
  }, [userData?.signup])

  const homeUrl = getHomeUrl(isV1Signup, "home")
  const homeProfileUrl = getHomeUrl(isV1Signup, "homeProfile")

  const helpCentreUrl =
    locale != "en"
      ? `https://trade.deriv.com/${locale}/help-centre/deriv-p2p`
      : `https://trade.deriv.com/help-centre/deriv-p2p`

  const liveChatUrl = "https://deriv.com/livechat"

  const navItems = [
    ...(!isDisabled
      ? [
        { name: t("navigation.home"), href: homeUrl, icon: HomeIcon, selectedIcon: HomeIcon },
        { name: t("navigation.market"), href: "/", icon: MarketIcon, selectedIcon: MarketSelectedIcon },
        { name: t("navigation.orders"), href: "/orders", icon: OrdersIcon, selectedIcon: OrdersSelectedIcon },
        { name: t("navigation.myAds"), href: "/ads", icon: AdsIcon, selectedIcon: AdsSelectedIcon },
        ...(showWallet
          ? [{ name: t("navigation.wallet"), href: "/wallet", icon: WalletIcon, selectedIcon: WalletSelectedIcon }]
          : []),
        { name: t("navigation.profile"), href: "/profile", icon: ProfileIcon, selectedIcon: ProfileSelectedIcon },
        { name: t("navigation.p2pHelpCentre"), href: helpCentreUrl, icon: GuideIcon, selectedIcon: GuideSelectedIcon },
        { name: t("navigation.liveChat"), href: liveChatUrl, icon: LiveChatIcon, selectedIcon: LiveChatIcon },
      ]
      : []),
  ]

  const hideOnMobile = [
    t("navigation.home"),
    t("navigation.market"),
    t("navigation.orders"),
    t("navigation.myAds"),
    t("navigation.wallet"),
    t("navigation.profile"),
    t("navigation.liveChat"),
  ]

  const getInitials = () => {
    const firstInitial = firstName?.[0] ?? ""
    const lastInitial = lastName?.[0] ?? ""
    return (firstName && lastName) ? (firstInitial + lastInitial).toUpperCase() : email?.[0].toUpperCase()
  }

  const handleLiveChat = () => {
    track("ek_ask_amy_markets")
    if (window.Intercom) {
      window.Intercom("show")
    }
  }

  return (
    <div className={cn("w-[295px] flex flex-col border-r border-slate-200 mr-[8px]", className)}>
      <div className="flex flex-row justify-between items-center gap-4 p-4 pt-0">
        <Image src="/icons/deriv-p2p.png" alt="Deriv logo" width={128} height={24} />
        {userId && (
          <div className="hidden md:block text-slate-600 hover:text-slate-700" onClick={() => track("ek_notifications_markets")}>
            <NovuNotifications />
          </div>
        )}
      </div>
      <nav className="flex-1 px-4">
        {(pathname === "/" || pathname.startsWith("/advertiser")) && (
          <div className="relative mt-2">
            <Image
              src="/icons/search-icon-custom.png"
              alt="Search"
              width={24}
              height={24}
              className="absolute left-2 top-1/2 transform -translate-y-1/2"
            />
            <Input
              variant="tertiary"
              placeholder="Search advertiser's nickname"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
                blurTimeoutRef.current = setTimeout(() => setIsSearchFocused(false), 150)
              }}
              className="bg-grayscale-500 rounded-lg pr-8 pl-8"
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 hover:bg-transparent p-0 h-auto"
              >
                <Image src="/icons/clear-search-icon.png" alt="Clear search" width={24} height={24} />
              </Button>
            )}
            {isSearchFocused && searchInput.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-[360px] min-h-[272px] bg-white border border-slate-200 rounded-xl shadow-md z-50 overflow-hidden" onMouseDown={(e) => e.preventDefault()}>
                <div className="px-0 pt-3 pb-0">
                  <Tabs value={searchTab} onValueChange={(v) => { if (v === "sell") track("ek_buy_tab_markets_search"); else track("ek_sell_tab_markets_search"); setSearchTab(v as "buy" | "sell") }}>
                    <TabsList className="w-full bg-transparent p-0">
                      <TabsTrigger
                        value="sell"
                        variant="underline"
                        className="flex-1 data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:rounded-none after:bg-black data-[state=active]:after:w-full"
                      >
                        {t("market.buyTab")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="buy"
                        variant="underline"
                        className="flex-1 data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:rounded-none after:bg-black data-[state=active]:after:w-full"
                      >
                        {t("market.sellTab")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                {isSearching && searchResults.length === 0 ? (
                  <AdvertiserSearchSkeleton count={3} />
                ) : searchResults.length > 0 ? (
                  <div ref={dropdownScrollContainerRef} className="max-h-[480px] overflow-y-auto">
                    {searchResults.map((ad) => (
                      <div key={ad.id} className="border-b border-slate-100">
                        {ad.user && <AdvertiserSearchResultCard ad={ad} onAdvertiserClick={handleAdvertiserClick} onBuySellClick={handleBuySellClick} />}
                      </div>
                    ))}
                    {isFetchingNextPage && (
                      <div className="sticky bottom-0 flex justify-center py-2 bg-white">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      </div>
                    )}
                    <div ref={dropdownSentinelRef} className="h-1" />
                  </div>
                ) : debouncedSearchInput.length > 0 ? (
                  <EmptyState
                    title={`No results found for "${debouncedSearchInput}"`}
                    description="Check spelling or try finding different advertisers."
                    className="py-4 px-2"
                  />
                ) : null}
              </div>
            )}
          </div>
        )}
        <ul>
          {navItems.map((item) => {
            const isExternal = item.name === t("navigation.home") || item.name === t("navigation.p2pHelpCentre") || item.name === t("navigation.liveChat")
            const isActive = !isExternal && (
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/advertiser")
                : pathname.startsWith(item.href)
            )

            const linkContent = (
              <>
                <div className="h-5 w-5 flex items-center justify-center">
                  <SvgIcon src={isActive ? item.selectedIcon : item.icon} fill={isActive ? "#FF444F" : "#181C25"} />
                </div>
                {item.name}
              </>
            )

            return (
              <li key={item.name} className={cn(hideOnMobile.includes(item.name) && "hidden md:block")}>
                {(item.name === t("navigation.p2pHelpCentre") || item.name === t("navigation.market")) && <div className="my-3 border-b border-grayscale-200"></div>}
                {item.name === t("navigation.liveChat") ? (
                  <button
                    onClick={handleLiveChat}
                    className="flex items-center gap-3 rounded-md py-4 text-sm w-full text-left"
                  >
                    {linkContent}
                  </button>
                ) : isExternal ? (
                  <a
                    href={item.href}
                    className="flex items-center gap-3 rounded-md py-4 text-sm"
                    rel="noopener noreferrer"
                  >
                    {linkContent}
                  </a>
                ) : (
                  <Link
                    prefetch
                    href={item.href}
                    className={cn("flex items-center gap-3 rounded-md py-4 text-sm", isActive ? "text-primary" : "")}
                  >
                    {linkContent}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="p-4">
        <a
          className="flex items-center justify-between gap-3 rounded-md py-2 text-sm transition-colors"
          href={homeProfileUrl}
          onClick={() => track("ek_profile_markets")}
        >
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-grayscale-300 flex items-center justify-center text-xs font-extrabold text-slate-700 shrink-0">
              {getInitials()}
            </div>
            <div className="flex flex-col min-w-0 gap-1">
              <span className="text-sm font-extrabold text-slate-1200 whitespace-pre-wrap wrap-anywhere">{fullName}</span>
              {email && <span className="text-xs text-slate-1200 whitespace-pre-wrap wrap-anywhere">{email}</span>}
            </div>
          </div>
          <Image src="/icons/chevron-right-black.png" alt="Deriv logo" width={14} height={24} />
        </a>
      </div>
    </div>
  )
}
