"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useMarketFilterStore } from "@/stores/market-filter-store"
import { useOrderSidebarStore } from "@/stores/order-sidebar-store"
import { useAdvertiserSearch } from "@/hooks/use-api-queries"
import type { Advertisement } from "@/services/api/api-buy-sell"
import EmptyState from "@/components/empty-state"
import { AdvertiserSearchResultCard } from "@/components/advertiser-search-result-card"
import { AdvertiserSearchSkeleton } from "@/components/advertiser-search-skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useUserDataStore } from "@/stores/user-data-store"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { KycOnboardingSheet } from "@/components/kyc-onboarding-sheet"
import { useTrackers } from "@/analytics/useTrackers"

interface MobileAdvertiserSearchProps {
    isOpen: boolean
    onClose: () => void
}

export default function MobileAdvertiserSearch({ isOpen, onClose }: MobileAdvertiserSearchProps) {
    const router = useRouter()
    const { setNickname } = useMarketFilterStore()

    // Restore previous search when sheet reopens (e.g. returning from advertiser page or order sidebar)
    useEffect(() => {
        let mounted = true
        if (isOpen) {
            const storedNickname = useMarketFilterStore.getState().nickname
            if (storedNickname && mounted) {
                setSearchInput(storedNickname)
                setDebouncedSearchInput(storedNickname)
            }
        }
        return () => { mounted = false }
    }, [isOpen])
    const { t } = useTranslations()
    const [searchInput, setSearchInput] = useState("")
    const [searchTab, setSearchTab] = useState<"buy" | "sell">("sell")
    const [debouncedSearchInput, setDebouncedSearchInput] = useState("")
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const isFetchingNextPageRef = useRef(false)

    const {
        data,
        isFetching: isSearching,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useAdvertiserSearch({ nickname: debouncedSearchInput, type: searchTab })

    const searchResults = data?.pages.flat() ?? []

    // Cleanup debounce timeout on unmount to prevent race conditions
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [])

    // Keep ref in sync so the observer callback always reads the latest value
    useEffect(() => {
        isFetchingNextPageRef.current = isFetchingNextPage
    }, [isFetchingNextPage])

    // Infinite scroll: fetch next page when sentinel comes into view
    useEffect(() => {
        const sentinel = sentinelRef.current
        const scrollContainer = scrollContainerRef.current
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
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setDebouncedSearchInput(value)
            setNickname(value)
        }, 300)
    }

    const userId = useUserDataStore((state) => state.userId)
    const verificationStatus = useUserDataStore((state) => state.verificationStatus)
    const onboardingStatus = useUserDataStore((state) => state.onboardingStatus)
    const isPoiExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poi_status !== "approved"
    const isPoaExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poa_status !== "approved"
    const { hideAlert, showAlert } = useAlertDialog()

    const { setPendingAd, setShouldReopenSearchOnReturn } = useOrderSidebarStore()
    const { track } = useTrackers()

    const handleAdvertiserClick = (advertiserId: number) => {
        track("ek_advertiser_profile_markets_search")
        if (userId && verificationStatus?.phone_verified && !isPoiExpired && !isPoaExpired) {
            setShouldReopenSearchOnReturn(true)
            router.push(`/advertiser/${advertiserId}`)
            onClose()
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
        setPendingAd(ad, true)
        handleClose()
    }

    const handleClear = () => {
        track("ek_clear_search_markets_search")
        setSearchInput("")
        setDebouncedSearchInput("")
        setNickname("")
    }

    const handleBack = () => {
        track("ek_back_markets_search")
        handleClose()
    }

    const handleClose = () => {
        setSearchInput("")
        setDebouncedSearchInput("")
        onClose()
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <SheetContent
                side="top"
                hideCloseButton
                className="h-full w-full p-0 flex flex-col gap-0 rounded-none"
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="bg-grayscale-500 px-1 w-fit"
                    >
                        <Image src="/icons/arrow-left-icon.png" alt="Back" width={24} height={24} />
                    </Button>
                    <div className="relative flex-1">
                        <Image
                            src="/icons/search-icon-custom.png"
                            alt="Search"
                            width={20}
                            height={20}
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                        />
                        <Input
                            variant="tertiary"
                            placeholder="Search advertiser's nickname"
                            value={searchInput}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            autoFocus
                            className="rounded-full pr-8"
                        />
                        {searchInput && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClear}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-transparent p-0"
                            >
                                <Image src="/icons/clear-search-icon.png" alt="Clear" width={20} height={20} />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-0 pt-3 pb-0 flex-shrink-0">
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

                {/* Results */}
                <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
                    {!debouncedSearchInput ? null : isSearching && searchResults.length === 0 ? (
                        <AdvertiserSearchSkeleton count={5} />
                    ) : searchResults.length > 0 ? (
                        <>
                            <ul>
                                {searchResults.map((ad) => (
                                    <li key={ad.id} className="border-b border-slate-100">
                                        {ad.user && <AdvertiserSearchResultCard ad={ad} onAdvertiserClick={handleAdvertiserClick} onBuySellClick={handleBuySellClick} />}
                                    </li>
                                ))}
                            </ul>
                            {isFetchingNextPage && (
                                <div className="sticky bottom-0 flex justify-center py-4 bg-background">
                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                </div>
                            )}
                            <div ref={sentinelRef} className="h-1" />
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <EmptyState
                                title={`No results found for "${debouncedSearchInput}"`}
                                description="Check spelling or try finding different advertisers."
                            />
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
