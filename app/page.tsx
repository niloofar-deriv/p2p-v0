"use client"

import { TooltipTrigger } from "@/components/ui/tooltip"
import { TradeBandBadge } from "@/components/trade-band-badge"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import type { Advertisement, PaymentMethod } from "@/services/api/api-buy-sell"
import MarketFilterDropdown from "@/components/market-filter/market-filter-dropdown"
import type { MarketFilterOptions } from "@/components/market-filter/types"
import OrderSidebar from "@/components/buy-sell/order-sidebar"
import MobileFooterNav from "@/components/mobile-footer-nav"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CurrencyFilter } from "@/components/currency-filter/currency-filter"
import { useCurrencyData } from "@/hooks/use-currency-data"
import { useAccountCurrencies } from "@/hooks/use-account-currencies"
import Image from "next/image"
import { currencyFlagMapper, formatPaymentMethodName } from "@/lib/utils"
import EmptyState from "@/components/empty-state"
import PaymentMethodsFilter from "@/components/payment-methods-filter/payment-methods-filter"
import { useMarketFilterStore } from "@/stores/market-filter-store"
import { useUserDataStore } from "@/stores/user-data-store"
import { BalanceSection } from "@/components/balance-section"
import { cn } from "@/lib/utils"
import { TemporaryBanAlert } from "@/components/temporary-ban-alert"
import { getTotalBalance } from "@/services/api/api-auth"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { usePaymentMethods, useAdvertisements } from "@/hooks/use-api-queries"
import { KycOnboardingSheet } from "@/components/kyc-onboarding-sheet"
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { VerifiedBadge } from "@/components/verified-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTrackers } from "@/analytics/useTrackers"

type Ad = Advertisement
type AdType = "buy" | "sell"

export default function BuySellPage() {
  const { t, locale } = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    activeTab,
    currency,
    sortBy,
    filterOptions,
    selectedPaymentMethods,
    selectedAccountCurrency,
    setActiveTab,
    setCurrency,
    setSortBy,
    setFilterOptions,
    setSelectedPaymentMethods,
    setSelectedAccountCurrency,
  } = useMarketFilterStore()

  const [adverts, setAdverts] = useState<Advertisement[]>([])
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false)
  const [isOrderSidebarOpen, setIsOrderSidebarOpen] = useState(false)
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null)
  const [balance, setBalance] = useState<string>("0.00")
  const [balanceCurrency, setBalanceCurrency] = useState<string>("USD")
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true)
  const [showKycPopup, setShowKycPopup] = useState(false)

  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } = usePaymentMethods()

  const fetchedForRef = useRef<string | null>(null)
  const { currencies } = useCurrencyData()
  const { accountCurrencies } = useAccountCurrencies()
  const userId = useUserDataStore((state) => state.userId)
  const userData = useUserDataStore((state) => state.userData)
  const localCurrency = useUserDataStore((state) => state.localCurrency)
  const verificationStatus = useUserDataStore((state) => state.verificationStatus)
  const onboardingStatus = useUserDataStore((state) => state.onboardingStatus)
  const isPoiExpired = userId && onboardingStatus?.kyc?.poi_status !== "approved"
  const isPoaExpired = userId && onboardingStatus?.kyc?.poa_status !== "approved"
  const { hideAlert, showAlert } = useAlertDialog()
  const isMobile = useIsMobile()
  const { track } = useTrackers()

  const { isConnected, joinAdvertsChannel, leaveAdvertsChannel, subscribe } = useWebSocketContext()


  const { data: fetchedAdverts = [], isLoading, error } = useAdvertisements(
    {
      type: activeTab,
      account_currency: selectedAccountCurrency,
      currency: currency,
      paymentMethod: selectedPaymentMethods.length === paymentMethods.length ? [] : selectedPaymentMethods,
      sortBy: sortBy,
      favourites_only: filterOptions.fromFollowing ? 1 : 0,
    }
  )

  const redirectToHelpCentre = () => {
    const helpCentreUrl =
      locale != "en"
        ? `https://trade.deriv.com/${locale}/help-centre-question/what-are-the-p2p-tier-levels-and-limits`
        : `https://trade.deriv.com/help-centre-question/what-are-the-p2p-tier-levels-and-limits`

    window.open(helpCentreUrl, "_blank")
  }

  const hasActiveFilters = filterOptions.fromFollowing !== false || sortBy !== "exchange_rate"
  const isV1Signup = userData?.signup === "v1"
  const tempBanUntil = userData?.temp_ban_until
  const hasFilteredPaymentMethods =
    paymentMethods.length > 0 &&
    selectedPaymentMethods.length < paymentMethods.length &&
    selectedPaymentMethods.length > 0

  const balancesKey = useMemo(() => {
    if (!userData?.signup) return null

    if (isV1Signup) {
      const balances = userData?.balances || []
      if (balances.length === 0) return "v1-empty"
      return `v1-${balances[0]?.amount || "0"}-${balances[0]?.currency || "USD"}`
    }
    return "v2"
  }, [isV1Signup, userData?.balances, userData?.signup])

  const fetchBalance = useCallback(async () => {
    if (!userData?.signup) {
      return
    }

    if (isV1Signup && !userData?.balances) {
      return
    }

    if (fetchedForRef.current === balancesKey) {
      return
    }

    fetchedForRef.current = balancesKey
    setIsLoadingBalance(true)

    try {
      const balances = userData?.balances || []
      const firstBalance = balances[0] || {}
      setBalance(firstBalance.amount || "0.00")
      setBalanceCurrency(firstBalance.currency || "USD")
    } catch (error) {
      console.error("Failed to fetch balance:", error)
      setBalance("0.00")
      setBalanceCurrency("USD")
    } finally {
      setIsLoadingBalance(false)
    }
  }, [balancesKey, isV1Signup, userData])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  useEffect(() => {
    const operation = searchParams.get("operation")
    const currencyParam = searchParams.get("currency")

    if (operation && (operation === "buy" || operation === "sell")) {
      if (operation === "buy") setActiveTab("sell")
      else {
        setActiveTab("buy")
      }
    }


    if (currencyParam) {
      setSelectedAccountCurrency(currencyParam.toUpperCase())
    }
  }, [searchParams, setActiveTab, setSelectedAccountCurrency])

  useEffect(() => {
    // Currency init: if store has no currency yet, default to user's local currency (or first available).
    // If user already picked a currency, do not override it.
    if (currencies.length > 0 && (currency === "" || currency === null)) {
      const validCurrencyCodes = currencies.map((c) => c.code)
      if (localCurrency && validCurrencyCodes.includes(localCurrency)) {
        setCurrency(localCurrency)
      } else {
        setCurrency(currencies[0]?.code)
      }
    }
  }, [currencies, localCurrency, currency, setCurrency])

  const paymentMethodsString = useMemo(
    () => JSON.stringify(selectedPaymentMethods),
    [selectedPaymentMethods]
  )

  // Sync hook data to local state for websocket updates
  useEffect(() => {
    if (Array.isArray(fetchedAdverts)) {
      setAdverts((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(fetchedAdverts)) {
          return prev
        }
        return fetchedAdverts
      })
    }
  }, [fetchedAdverts])

  useEffect(() => {
    if (paymentMethods.length > 0 && selectedPaymentMethods.length === 0) {
      setSelectedPaymentMethods(paymentMethods.map((method) => method.method))
    }
  }, [paymentMethods, selectedPaymentMethods.length, setSelectedPaymentMethods])

  const handleAdvertiserClick = (advertiserId: number) => {
    track("ek_advertiser_profile_markets")
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

  const handleOrderClick = (ad: Advertisement) => {
    track("ek_advert_action_markets", { advert_type: ad.type === "buy" ? "sell" : "buy" })
    if (userId && verificationStatus?.phone_verified && !isPoiExpired && !isPoaExpired) {
      setSelectedAd(ad)
      setIsOrderSidebarOpen(true)
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

  const handleCurrencySelect = (currencyCode: string) => {
    setCurrency(currencyCode)
  }

  const handleFilterApply = (newFilters: MarketFilterOptions, sortByValue?: string) => {
    setFilterOptions(newFilters)
    if (sortByValue) setSortBy(sortByValue)
  }

  const getPaymentMethodsDisplayText = () => {
    if (
      paymentMethods.length === 0 ||
      selectedPaymentMethods.length === 0 ||
      selectedPaymentMethods.length === paymentMethods.length
    ) {
      return t("market.paymentMethodAll")
    }

    return t("market.paymentMethodSelected", { count: selectedPaymentMethods.length })
  }

  useEffect(() => {
    if (isFilterPopupOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (!(event.target as Element).closest(".filter-dropdown-container")) {
          setIsFilterPopupOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isFilterPopupOpen])

  useEffect(() => {
    if (isConnected && selectedAccountCurrency && currency && activeTab) {
      joinAdvertsChannel(selectedAccountCurrency, currency, activeTab)

      return () => {
        leaveAdvertsChannel(selectedAccountCurrency, currency, activeTab)
      }
    }
  }, [isConnected, selectedAccountCurrency, currency, activeTab, joinAdvertsChannel, leaveAdvertsChannel])

  useEffect(() => {
    const unsubscribe = subscribe((data: any) => {
      if (data?.options?.channel?.startsWith("adverts/currency/")) {
        if (data?.payload?.data?.event === "update" && data?.payload?.data?.advert) {
          const updatedAdvert = data.payload.data.advert

          setAdverts((currentAdverts) =>
            currentAdverts.map((ad) =>
              ad.id == updatedAdvert.id ? { ...ad, effective_rate_display: updatedAdvert.effective_rate_display } : ad,
            ),
          )
        }
      }
    })

    return unsubscribe
  }, [subscribe])

  useEffect(() => {
    track("ek_open_markets")
  }, []) // fires once on mount

  useEffect(() => {
    const shouldShowKyc = searchParams.get("show_kyc_popup") === "true"
    if (shouldShowKyc && !showKycPopup) {
      setShowKycPopup(true)
      showAlert({
        title: t("profile.gettingStarted"),
        description: (
          <div className="space-y-4 mb-6 mt-2">
            <KycOnboardingSheet route="markets" onClose={hideAlert} />
          </div>
        ),
        confirmText: undefined,
        cancelText: undefined,
      })
    }
  }, [searchParams, showKycPopup, showAlert, t])

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 flex-grow-0 sticky top-0 z-4 bg-background px-3">
          <div className="mb-4 md:mb-6 md:flex md:flex-col justify-between gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="w-[calc(100%+24px)] md:w-full flex flex-row items-end gap-[16px] md:gap-[24px] bg-slate-1200 p-6 rounded-b-3xl md:rounded-3xl justify-between -m-3 mb-4 md:m-0">
                <div>
                  <BalanceSection balance={balance} currency={balanceCurrency} isLoading={isLoadingBalance} />
                  <Tabs value={activeTab} onValueChange={(value) => { if (value === "sell") track("ek_buy_markets"); else track("ek_sell_markets"); setActiveTab(value as "buy" | "sell") }}>
                    <TabsList className="w-auto bg-transparent p-0 gap-4">
                      <TabsTrigger
                        className="w-auto data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:rounded-none px-0"
                        value="sell"
                        variant="underline"
                      >
                        {t("market.buyTab")}
                      </TabsTrigger>
                      <TabsTrigger
                        className="w-auto data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:rounded-none px-0"
                        value="buy"
                        variant="underline"
                      >
                        {t("market.sellTab")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                {currencies.length > 0 && (
                  <div>
                    <CurrencyFilter
                      currencies={currencies}
                      selectedCurrency={currency}
                      onCurrencySelect={handleCurrencySelect}
                      title={activeTab === "sell" ? t("market.yourePayingWith") : t("market.youreReceiving")}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="border border-[#ffffff3d] bg-background font-normal px-3 bg-transparent hover:bg-transparent rounded-3xl text-white"
                          onClick={() => track("ek_payment_currency_markets")}
                        >
                          {currencyFlagMapper[currency as keyof typeof currencyFlagMapper] && (
                            <Image
                              src={
                                currencyFlagMapper[currency as keyof typeof currencyFlagMapper] || "/placeholder.svg"
                              }
                              alt={`${currency} logo`}
                              width={24}
                              height={16}
                              className="mr-1 object-cover"
                            />
                          )}
                          <span>{currency}</span>
                          <Image
                            src="/icons/chevron-down-white.png"
                            alt="Arrow"
                            width={24}
                            height={24}
                            className="ml-2 transition-transform duration-200"
                          />
                        </Button>
                      }
                    />
                  </div>
                )}
              </div>
            </div>
            {tempBanUntil && <TemporaryBanAlert tempBanUntil={tempBanUntil} />}
            <div className="flex flex-wrap gap-2 md:gap-3 md:px-0 mt-4 md:mt-0 justify-end">
              {!isV1Signup && (
                <div className="flex gap-2 mb-3 flex-1 hidden">
                  {accountCurrencies.map((curr) => (
                    <Button
                      key={curr.code}
                      variant={selectedAccountCurrency === curr.code ? "black" : "outline"}
                      onClick={() => setSelectedAccountCurrency(curr.code)}
                      className={cn(
                        "px-4 py-2 rounded-full font-normal border-slate-800",
                        selectedAccountCurrency === curr.code
                          ? ""
                          : "text-grayscale-600 hover:bg-transparent border-gray-300",
                      )}
                      size="sm"
                    >
                      {curr.code}
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex-1 md:block md:flex-none">
                <PaymentMethodsFilter
                  paymentMethods={paymentMethods}
                  selectedMethods={selectedPaymentMethods}
                  onSelectionChange={setSelectedPaymentMethods}
                  isLoading={isLoadingPaymentMethods}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "rounded-md border border-input font-normal w-full justify-between px-3 rounded-3xl",
                        hasFilteredPaymentMethods
                          ? "bg-black hover:bg-black text-white"
                          : "bg-transparent hover:bg-transparent",
                      )}
                      onClick={() => track("ek_payment_method_filter_markets")}
                    >
                      <span className="truncate overflow-hidden text-ellipsis whitespace-nowrap">
                        {getPaymentMethodsDisplayText()}
                      </span>
                      {hasFilteredPaymentMethods ? (
                        <Image
                          src="/icons/chevron-down-white.png"
                          alt="Arrow"
                          width={24}
                          height={24}
                          className="transition-transform duration-200"
                        />
                      ) : (
                        <Image
                          src="/icons/chevron-down.png"
                          alt="Arrow"
                          width={24}
                          height={24}
                          className="transition-transform duration-200"
                        />
                      )}
                    </Button>
                  }
                />
              </div>

              <div className="filter-dropdown-container flex-shrink-0">
                <MarketFilterDropdown
                  activeTab={activeTab}
                  onApply={handleFilterApply}
                  initialFilters={filterOptions}
                  initialSortBy={sortBy}
                  hasActiveFilters={hasActiveFilters}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "rounded-md border border-input font-normal px-3  focus:border-black min-w-fit rounded-3xl",
                        hasActiveFilters ? "bg-black hover:bg-black" : "bg-transparent hover:bg-transparent",
                      )}
                      onClick={() => track("ek_filter_markets")}
                    >
                      {hasActiveFilters ? (
                        <Image src="/icons/filter-icon-white.png" alt="Filter" width={16} height={16} />
                      ) : (
                        <Image src="/icons/filter-icon.png" alt="Filter" width={20} height={20} />
                      )}
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto pb-20 md:pb-4 scrollbar-hide px-3">
          <div className="h-full">
            {isLoading || (adverts.length === 0 && !currency) ? (
              <div className="md:block">
                <Table>
                  <TableHeader className="hidden lg:table-header-group border-b sticky top-0 bg-white z-[1]">
                    <TableRow className="text-xs">
                      <TableHead className="text-left py-4 px-4 lg:pl-0 text-slate-600 font-normal">
                        <Skeleton className="bg-grayscale-500 h-5 w-32" />
                      </TableHead>
                      <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">
                        <Skeleton className="bg-grayscale-500 h-5 w-32" />
                      </TableHead>
                      <TableHead className="text-left py-4 px-4 text-slate-600 hidden sm:table-cell font-normal">
                        <Skeleton className="bg-grayscale-500 h-5 w-32" />
                      </TableHead>
                      <TableHead className="text-right py-4 px-4 lg:pr-0"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white lg:divide-y lg:divide-slate-200 font-normal text-sm">
                    {[...Array(2)].map((_, index) => (
                      <TableRow
                        key={index}
                        className="grid grid-cols-[1fr_auto] lg:flex flex-col border-b lg:table-row lg:border-x-[0] lg:border-t-[0] lg:mb-[0] py-3 lg:p-0"
                      >
                        <TableCell className="p-2 lg:p-4 lg:pl-0 align-top row-start-1 col-span-full whitespace-nowrap">
                          <div className="flex items-center">
                            <Skeleton className="bg-grayscale-500 h-[24px] w-[24px] flex-shrink-0 rounded-full mr-[8px]" />
                            <div className="flex-1">
                              <Skeleton className="bg-grayscale-500 h-4 w-32 mb-2" />
                              <Skeleton className="bg-grayscale-500 h-3 w-48" />
                              <Skeleton className="bg-grayscale-500 h-3 w-24 mt-2" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-2 lg:p-4 align-top row-start-2 col-span-full">
                          <Skeleton className="bg-grayscale-500 h-5 w-32 mb-2" />
                          <Skeleton className="bg-grayscale-500 h-3 w-48" />
                        </TableCell>
                        <TableCell className="p-2 lg:p-4 sm:table-cell align-top row-start-3">
                          <div className="flex flex-col gap-2">
                            <Skeleton className="bg-grayscale-500 h-3 w-24" />
                            <Skeleton className="bg-grayscale-500 h-3 w-28" />
                          </div>
                        </TableCell>
                        <TableCell className="p-2 lg:p-4 lg:pr-0 text-right align-middle row-start-3 whitespace-nowrap">
                          <Skeleton className="bg-grayscale-500 h-8 w-20 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                {error.message || "Failed to load advertisements"}
              </div>
            ) : adverts.length === 0 ? (
              <EmptyState
                title={t("market.noAdsTitle", { currency: currency })}
                description={t("market.noAdsDescription", { currency: currency })}
                redirectToAds={true}
                adType={activeTab}
                route="markets"
              />
            ) : (
              <div className="md:block overflow-auto scrollbar-custom max-h-[calc(100vh-260px)] pb-20 md:pb-0">
                <Table>
                  <TableHeader className="hidden lg:table-header-group border-b sticky top-0 bg-white z-[1]">
                    <TableRow className="text-xs">
                      <TableHead className="text-left py-4 px-4 lg:pl-0 text-slate-600 font-normal">
                        {t("market.advertisers")}
                      </TableHead>
                      <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">
                        {t("market.rates")}
                      </TableHead>
                      <TableHead className="text-left py-4 px-4 text-slate-600 hidden sm:table-cell font-normal">
                        {t("market.paymentMethods")}
                      </TableHead>
                      <TableHead className="text-right py-4 px-4 lg:pr-0"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white lg:divide-y lg:divide-slate-200 font-normal text-sm">
                    {adverts.map((ad) => (
                      <TableRow
                        className="grid grid-cols-[1fr_auto] lg:flex flex-col border-b lg:table-row lg:border-x-[0] lg:border-t-[0] lg:mb-[0] py-3 lg:p-0"
                        key={ad.id}
                      >
                        <TableCell className="p-2 lg:p-4 lg:pl-0 align-top row-start-1 col-span-full whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="relative h-[24px] w-[24px] flex-shrink-0 rounded-full bg-black flex items-center justify-center text-white font-bold text-sm mr-[8px]">
                              {(ad.user?.nickname || "").charAt(0).toUpperCase()}
                              <div
                                className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white ${ad.user?.is_online ? "bg-buy" : "bg-gray-400"
                                  }`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAdvertiserClick(ad.user?.id || 0)}
                                className="hover:underline cursor-pointer"
                              >
                                {ad.user?.nickname}
                              </button>
                              <VerifiedBadge />
                              {ad.user.trade_band && (
                                <TradeBandBadge
                                  tradeBand={ad.user.trade_band}
                                  showLearnMore={true}
                                  size={18}
                                />
                              )}
                              {userId != ad.user.id && ad.is_private && (
                                <Image
                                  src="/icons/closed-group.svg"
                                  alt="Closed Group"
                                  width={32}
                                  height={32}
                                  className="cursor-pointer mr-1"
                                />
                              )}
                              {ad.user?.is_favourite && (
                                <span className="ml-1 px-[8px] py-[4px] bg-blue-50 text-blue-100 text-xs rounded-[4px]">
                                  {t("market.following")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-slate-500 mt-[4px]">
                            {ad.user.rating_average_lifetime && (
                              <span className="flex items-center">
                                <Image
                                  src="/icons/star-active.svg"
                                  alt="Rating"
                                  width={16}
                                  height={16}
                                  className="mr-1"
                                />
                                <span className="text-pending-text-secondary">
                                  {ad.user.rating_average_lifetime.toFixed(2)}
                                </span>
                              </span>
                            )}
                            {ad.user.order_count_lifetime > 0 && (
                              <div className="flex flex-row items-center justify-center gap-[8px] mx-[8px]">
                                {ad.user.rating_average_lifetime && <div className="h-1 w-1 rounded-full bg-slate-500"></div>}
                                <span>
                                  {ad.user.order_count_lifetime} {t("market.orders")}
                                </span>
                              </div>
                            )}
                            {ad.user.completion_rate_all_30day > 0 && (
                              <div className="flex flex-row items-center justify-center gap-[8px]">
                                <div className="h-1 w-1 rounded-full bg-slate-500"></div>
                                <span>
                                  {ad.user.completion_rate_all_30day}% {t("market.completion")}
                                </span>
                              </div>
                            )}
                          </div>
                          {!isMobile && <div className="flex items-center text-xs text-slate-500 mt-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center bg-gray-100 text-slate-500 rounded-sm px-2 py-1 cursor-pointer">
                                    <Image src="/icons/clock.png" alt="Time" width={12} height={12} className="mr-2" />
                                    <span>
                                      {ad.order_expiry_period} {t("market.min")}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent align="start" className="max-w-[328px] text-wrap">
                                  <p>{t("order.paymentTimeTooltip", { minutes: ad.order_expiry_period })}</p>
                                  <TooltipArrow className="fill-black" />
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          }
                        </TableCell>
                        <TableCell className="p-2 pt-0 lg:p-4 align-top row-start-2 col-span-full">
                          <div className="font-bold text-base flex items-center">
                            {ad.effective_rate_display
                              ? ad.effective_rate_display.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                              : ""}{" "}
                            {ad.payment_currency}
                            <div className="text-xs text-slate-500 font-normal ml-1">{`/${ad.account_currency}`}</div>
                          </div>
                          <div className="mt-1 text-xs">{`${t("market.orderLimits")}: ${ad.minimum_order_amount || "N/A"} - ${ad.actual_maximum_order_amount || "N/A"
                            }  ${ad.account_currency}`}</div>
                          {isMobile && <div className="flex items-center text-xs text-slate-500 mt-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center bg-gray-100 text-slate-500 rounded-sm px-2 py-1 cursor-pointer">
                                    <Image src="/icons/clock.png" alt="Time" width={12} height={12} className="mr-2" />
                                    <span>
                                      {ad.order_expiry_period} {t("market.min")}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent align="start" className="max-w-[328px] text-wrap">
                                  <p>{t("order.paymentTimeTooltip", { minutes: ad.order_expiry_period })}</p>
                                  <TooltipArrow className="fill-black" />
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>}
                        </TableCell>
                        <TableCell className="p-2 lg:p-4 sm:table-cell align-top row-start-3">
                          <div className="flex flex-row lg:flex-col flex-wrap gap-2 h-full">
                            {ad.payment_methods?.map((method, index) => (
                              <div key={index} className="flex items-center">
                                {method && (
                                  <div
                                    className={`h-2 w-2 rounded-full mr-2 ${method.toLowerCase().includes("bank")
                                      ? "bg-paymentMethod-bank"
                                      : "bg-paymentMethod-ewallet"
                                      }`}
                                  ></div>
                                )}
                                <span className="text-xs">{formatPaymentMethodName(method)}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="p-2 lg:p-4 lg:pr-0 text-right align-middle row-start-3 whitespace-nowrap">
                          {userId != ad.user.id && (
                            <Button
                              variant={ad.type === "buy" ? "destructive" : "secondary"}
                              size="sm"
                              onClick={() => handleOrderClick(ad)}
                              disabled={!!tempBanUntil}
                            >
                              {ad.type === "buy" ? t("common.sell") : t("common.buy")} {ad.account_currency}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <MobileFooterNav />
        </div>

        <OrderSidebar
          isOpen={isOrderSidebarOpen}
          onClose={() => setIsOrderSidebarOpen(false)}
          ad={selectedAd}
          orderType={activeTab}
          p2pBalance={Number.parseFloat(balance)}
        />
      </div>
    </>
  )
}
