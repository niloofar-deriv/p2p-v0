"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import EmptyState from "@/components/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdsAPI } from "@/services/api"
import type { Ad } from "../types"
import { cn } from "@/lib/utils"
import { formatPaymentMethodName, getPaymentMethodColourByName } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { AdActionsMenu } from "./ad-actions-menu"
import ShareAdPage from "./share-ad-page"
import { useTranslations } from "@/lib/i18n/use-translations"
import { VisibilityStatusDialog } from "./visibility-status-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserDataStore } from "@/stores/user-data-store"
import { KycOnboardingSheet } from "@/components/kyc-onboarding-sheet"
import { useDeleteAd, useToggleAdActiveStatus } from "@/hooks/use-api-queries"
import { useTrackers } from "@/analytics/useTrackers"

interface MyAdsTableProps {
  ads: Ad[]
  hiddenAdverts: boolean
  isLoading: boolean
  isFetching?: boolean
  onAdDeleted?: (status?: string) => void
}

export default function MyAdsTable({ ads, hiddenAdverts, isLoading, isFetching = false, onAdDeleted }: MyAdsTableProps) {
  const { t } = useTranslations()
  const { track } = useTrackers()
  const router = useRouter()
  const { toast } = useToast()
  const { showDeleteDialog, showAlert, hideAlert } = useAlertDialog()
  const isMobile = useIsMobile()
  const { userId, onboardingStatus, verificationStatus } = useUserDataStore()
  const isPoiExpired = userId && onboardingStatus?.kyc?.poi_status !== "approved"
  const isPoaExpired = userId && onboardingStatus?.kyc?.poa_status !== "approved"
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [showShareView, setShowShareView] = useState(false)
  const [adToShare, setAdToShare] = useState<Ad | null>(null)
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false)
  const [selectedVisibilityReasons, setSelectedVisibilityReasons] = useState<string[]>([])
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  // React Query mutations for delete and toggle status
  const deleteAdMutation = useDeleteAd()
  const toggleStatusMutation = useToggleAdActiveStatus()

  const formatLimits = (ad: Ad) => {
    if (ad.minimum_order_amount && ad.maximum_order_amount) {
      return `${ad.minimum_order_amount} - ${ad.maximum_order_amount} USD`
    }

    if (typeof ad.limits === "string") {
      return ad.limits
    }
    if (ad.limits && typeof ad.limits === "object") {
      return `${ad.limits.min} - ${ad.limits.max} ${ad.limits.currency}`
    }
    return "N/A"
  }

  const getAvailableAmount = (ad: Ad) => {
    if (
      ad.available_amount !== undefined &&
      ad.open_order_amount !== undefined &&
      ad.completed_order_amount !== undefined
    ) {
      const available = Number.parseFloat(ad.available_amount) || 0
      const openOrder = Number.parseFloat(ad.open_order_amount) || 0
      const completed = Number.parseFloat(ad.completed_order_amount) || 0
      const total = available + openOrder + completed

      return {
        current: available,
        total: total,
        percentage: total > 0 ? (available / total) * 100 : 0,
      }
    }

    if (ad.available) {
      const current = Number.parseFloat(ad.available.current) || 0
      const total = Number.parseFloat(ad.available.total) || 0
      return {
        current: current,
        total: total,
        percentage: total > 0 ? (current / total) * 100 : 0,
      }
    }

    return { current: 0, total: 0, percentage: 0 }
  }

  const formatPaymentMethods = (methods: string[]) => {
    if (!methods || methods.length === 0) return "None"
    return (
      <div className="flex flex-row lg:flex-col flex-wrap gap-2 h-full">
        {methods.map((method, index) => (
          <div key={index} className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${getPaymentMethodColourByName(method)}`}></span>
            <span className="text-xs font-normal leading-5 text-gray-900">{formatPaymentMethodName(method)}</span>
          </div>
        ))}
      </div>
    )
  }

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="success-light">{t("myAds.active")}</Badge>
    }
    return <Badge variant="error-light">{t("myAds.inactive")}</Badge>
  }

  const handleShare = (ad: Ad) => {
    track("ek_share_ad_manage_ad_sheet")
    setDrawerOpen(false)
    setOpenDropdownId(null)
    setAdToShare(ad)
    setShowShareView(true)
  }

  const handleCloseShareView = () => {
    setShowShareView(false)
    setAdToShare(null)
  }

  const handleEdit = (ad: Ad) => {
    track("ek_edit_ad_manage_ad_sheet")
    setDrawerOpen(false)
    setOpenDropdownId(null)
    router.push(`/ads/edit/${ad.id}`)
  }

  const handleToggleStatus = async (ad: Ad) => {
    const isActive = ad.is_active !== undefined ? ad.is_active : ad.status === "Active"
    const isListed = !isActive
    track("ek_toggle_ad_status_manage_ad_sheet", { ad_status_action: isListed ? "activate" : "deactivate" })
    setDrawerOpen(false)
    setOpenDropdownId(null)

    toggleStatusMutation.mutate(
      { id: ad.id, isActive: isListed },
      {
        onSuccess: () => {
          const message = isListed ? t("myAds.adActivated") : t("myAds.adDeactivated")
          toast({
            description: (
              <div className="flex items-center gap-2">
                <Image src="/icons/tick.svg" alt="Success" width={24} height={24} className="text-white" />
                <span>{message}</span>
              </div>
            ),
            className: "bg-black text-white border-black h-[48px] rounded-lg px-[16px] py-[8px]",
            duration: 2500,
          })
        },
        onError: (error: any) => {
          if (error?.errors?.length > 0) {
            const firstError = error.errors[0]
            const errorCodeMap: Record<string, string> = {
              AdvertActiveCountExceeded: t("adForm.adLimitReachedMessage"),
              AdvertExchangeRateDuplicate: t("adForm.duplicateRateMessage"),
              InvalidExchangeRate: t("adForm.invalidExchangeRateMessage"),
            }

            const errorMessage = errorCodeMap[firstError.code] || t("myAds.updateAdError")

            showAlert({
              title: t("myAds.unableToUpdateAd"),
              description: errorMessage,
              confirmText: t("common.ok"),
              type: "warning",
            })
          } else {
            showAlert({
              title: t("myAds.unableToUpdateAd"),
              description: t("myAds.updateAdError"),
              confirmText: t("common.ok"),
              type: "warning",
            })
          }
        },
      }
    )
  }

  const handleDelete = (adId: string) => {
    track("ek_delete_ad_manage_ad_sheet")
    setDrawerOpen(false)
    setOpenDropdownId(null)
    showDeleteDialog({
      title: t("myAds.deleteAdTitle"),
      description: t("myAds.deleteAdDescription"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      onCancel: () => {
        track("ek_cancel_delete_delete_ad_sheet")
      },
      onConfirm: () => {
        track("ek_confirm_delete_delete_ad_sheet")
        deleteAdMutation.mutate(adId, {
          onSuccess: () => {
            toast({
              description: (
                <div className="flex items-center gap-2">
                  <Image src="/icons/tick.svg" alt="Success" width={24} height={24} className="text-white" />
                  <span>{t("myAds.adDeleted")}</span>
                </div>
              ),
              className: "bg-black text-white border-black h-[48px] rounded-lg px-[16px] py-[8px]",
              duration: 2500,
            })
          },
          onError: (error: any) => {
            let description = t("myAds.deleteAdError")

            if (error?.errors?.length > 0) {
              const hasOpenOrdersError = error.errors.some(
                (err: any) => err.code === "AdvertDeleteOpenOrders"
              )
              if (hasOpenOrdersError) {
                description = t("myAds.deleteAdOpenOrders")
              }
            }

            setTimeout(() => {
              showAlert({
                title: t("myAds.unableToDeleteAd"),
                description,
                confirmText: t("common.ok"),
                type: "warning",
              })
            }, 500)
          },
        })
      },
    })
  }

  const handleOpenDrawer = (ad: Ad) => {
    track("ek_manage_ad_my_ads")
    if (!userId || !verificationStatus?.phone_verified || isPoiExpired || isPoaExpired) {
      let title = t("profile.gettingStarted")

      if (isPoiExpired && isPoaExpired) title = t("profile.verificationExpired")
      else if (isPoiExpired) title = t("profile.identityVerificationExpired")
      else if (isPoaExpired) title = t("profile.addressVerificationExpired")

      showAlert({
        title,
        description: (
          <div className="space-y-4 my-2">
            <KycOnboardingSheet route="ads" onClose={hideAlert} />
          </div>
        ),
        confirmText: undefined,
        cancelText: undefined,
      })
    } else {
      setSelectedAd(ad)
      setDrawerOpen(true)
    }
  }

  const handleVisibilityStatusClick = (ad: Ad) => {
    track("ek_ad_visibility_warning_my_ads")
    if (ad.visibility_status && ad.visibility_status.length > 0) {
      setSelectedVisibilityReasons(ad.visibility_status)
      setSelectedAd(ad)
      setVisibilityDialogOpen(true)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <Table>
          <TableHeader className="hidden lg:table-header-group border-b sticky top-0 bg-white z-[1]">
            <TableRow className="text-xs">
              <TableHead className="text-left py-4 lg:pl-0 pr-4 text-slate-600 font-normal">
                {t("myAds.adType")}
              </TableHead>
              <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">
                {t("myAds.availableAmount")}
              </TableHead>
              <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">
                {t("myAds.paymentMethods")}
              </TableHead>
              <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">{t("myAds.status")}</TableHead>
              <TableHead className="text-left py-4 pl-4 lg:pr-0 text-slate-600 font-normal"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white lg:divide-y lg:divide-slate-200 font-normal text-sm">
            {Array.from({ length: 3 }).map((_, index) => (
              <TableRow
                key={index}
                className="grid grid-cols-[2fr_1fr] lg:flex flex-col border-b lg:table-row lg:border-x-[0] lg:border-t-[0] lg:mb-[0] py-3 lg:p-0"
              >
                <TableCell className="p-2 lg:pl-0 lg:pr-4 lg:py-4 align-top row-start-2 col-start-1 col-end-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-24 bg-grayscale-500" />
                    <Skeleton className="h-4 w-32 bg-grayscale-500" />
                    <Skeleton className="h-4 w-28 bg-grayscale-500" />
                  </div>
                </TableCell>
                <TableCell className="p-2 lg:p-4 align-top row-start-3 col-start-1 col-end-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-grayscale-500" />
                    <Skeleton className="h-2 w-full lg:w-[200px] rounded-full bg-grayscale-500" />
                    <Skeleton className="h-4 w-28 bg-grayscale-500" />
                  </div>
                </TableCell>
                <TableCell className="p-2 lg:p-4 align-top row-start-4 col-span-full">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-grayscale-500" />
                    <Skeleton className="h-4 w-28 bg-grayscale-500" />
                  </div>
                </TableCell>

                <TableCell className="p-2 lg:p-4 align-top row-start-1 col-span-full">
                  <Skeleton className="h-6 w-16 rounded-full bg-grayscale-500" />
                </TableCell>

                <TableCell className="p-2 lg:pl-4 lg:pr-0 lg:py-4 align-top row-start-1">
                  <div className="flex items-end justify-end">
                    <Skeleton className="h-8 w-8 rounded-full bg-grayscale-500" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (ads.length === 0) {
    return (
      <EmptyState
        icon="/icons/no-ads.svg"
        title={t("myAds.noAdsTitle")}
        description={t("myAds.noAdsDescription")}
        redirectToAds={true}
        route="ads"
      />
    )
  }

  if (showShareView && adToShare) {
    return <ShareAdPage ad={adToShare} onClose={handleCloseShareView} />
  }

  return (
    <>
      <div className="w-full">
        <Table>
          <TableHeader className="hidden lg:table-header-group border-b sticky top-0 bg-white z-[1]">
            <TableRow className="text-xs">
              <TableHead className="text-left py-4 lg:pl-0 pr-4 text-slate-600 font-normal">
                {t("myAds.adType")}
              </TableHead>
              <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">
                {t("myAds.availableAmount")}
              </TableHead>
              <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">
                {t("myAds.paymentMethods")}
              </TableHead>
              <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">{t("myAds.status")}</TableHead>
              <TableHead className="text-left py-4 pl-4 lg:pr-0 text-slate-600 font-normal"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white lg:divide-y lg:divide-slate-200 font-normal text-sm">
            {ads.map((ad, index) => {
              const availableData = getAvailableAmount(ad)
              const isActive = ad.is_active !== undefined ? ad.is_active : ad.status === "Active"
              const adType = ad.type || "Buy"
              const rate = ad.effective_rate_display
              const exchangeRate = `${ad.exchange_rate}%`
              const exchangeRateType = ad.exchange_rate_type
              const paymentMethods = ad.payment_methods || ad.paymentMethods || []
              const hasVisibilityStatus = ad.visibility_status && ad.visibility_status.length > 0

              return (
                <TableRow
                  key={index}
                  className={cn(
                    "grid grid-cols-[2fr_1fr] lg:flex flex-col border-b lg:table-row lg:border-x-[0] lg:border-t-[0] lg:mb-[0] py-3 lg:p-0 text-slate-1200 gap-2",
                  )}
                >
                  <TableCell
                    className={cn(
                      "px-2 py-0 lg:pl-0 lg:pr-4 lg:py-4 align-top row-start-2 col-start-1 col-end-4 whitespace-nowrap",
                      !isActive || hiddenAdverts ? "opacity-60" : "",
                    )}
                  >
                    <div className="flex justify-between md:block">
                      <div className="mb-1 flex justify-normal ">
                        <span
                          className={cn(
                            "font-bold text-base leading-6",
                            adType.toLowerCase() === "buy" ? "text-buy" : "text-sell",
                          )}
                        >
                          {adType.toLowerCase() === "buy" ? t("common.buy") : t("common.sell")}
                        </span>
                        <span className="text-base font-bold leading-6 ml-1">
                          {" "}
                          {ad.account_currency}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between md:justify-normal gap-1">
                          <span className="text-xs leading-5 text-slate-500">
                            {t("myAds.adId")}:
                          </span>
                          <span className="text-xs leading-5 text-slate-500">{ad.id}</span>
                        </div>
                        {!isMobile && (
                          <div className="flex items-center justify-between md:justify-normal gap-1">
                            <span className="text-xs leading-5">
                              {t("myAds.rate")}:
                            </span>
                            <span className="text-xs font-bold leading-5">{rate} {ad.payment_currency}</span>
                            {exchangeRateType == "float" && ad.exchange_rate != 0 && (
                              <span className="text-xs text-grayscale-600 rounded-sm bg-grayscale-500 p-1 ml-1">
                                {exchangeRate}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-2 py-0 lg:p-4 align-top row-start-3 col-start-1 col-end-4 text-xs whitespace-nowrap",
                      !isActive || hiddenAdverts ? "opacity-60" : "",
                    )}
                  >
                    <div className="mb-2">
                      {availableData.current.toFixed(2)} / {availableData.total.toFixed(2)} USD
                    </div>
                    <div className="h-2 bg-[#E9ECEF] rounded-full w-full lg:w-[200px] overflow-hidden mb-2">
                      <div
                        className="h-full bg-neutral-10 rounded-full"
                        style={{ width: `${Math.min(availableData.percentage, 100)}%` }}
                      ></div>
                    </div>
                    {isMobile && (
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs leading-5">{t("myAds.rate")}:</span>
                        <div>
                          <span className="text-xs leading-5 text-gray-900 font-bold">{rate} {ad.payment_currency}</span>
                          {exchangeRateType == "float" && ad.exchange_rate != 0 && (
                            <span className="text-xs text-grayscale-600 rounded-sm bg-grayscale-500 p-1 ml-2">
                              {exchangeRate}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between md:justify-normal gap-1">
                      <span className="text-xs leading-5">{t("myAds.limit")}:</span>
                      <span className="text-xs leading-5 overflow-hidden text-ellipsis">{formatLimits(ad)}</span>
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-2 py-0 lg:p-4 align-top row-start-4 col-span-full whitespace-nowrap",
                      !isActive || hiddenAdverts ? "opacity-60" : "",
                    )}
                  >
                    {formatPaymentMethods(paymentMethods)}
                  </TableCell>
                  <TableCell className="p-2 lg:p-4 align-top row-start-1 col-span-full whitespace-nowrap flex gap-1">
                    {getStatusBadge(isActive)}
                    {ad.is_private && <Image src="/icons/closed-group.svg" alt="Closed Group" width={24} height={24} />}
                  </TableCell>
                  <TableCell className="p-0 lg:pl-4 lg:pr-0 lg:py-4 align-top row-start-1 whitespace-nowrap">
                    <div className="flex items-end justify-end">
                      {hasVisibilityStatus && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 hover:bg-transparent rounded-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          onClick={() => handleVisibilityStatusClick(ad)}
                        >
                          <Image src="/icons/ad-warning.svg" alt="Visibility Status" width={24} height={24} />
                        </Button>
                      )}
                      {isMobile ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 hover:bg-gray-100 rounded-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          onClick={() => handleOpenDrawer(ad)}
                        >
                          <Image src="/icons/vertical.svg" alt="Options" width={20} height={20} />
                        </Button>
                      ) : (
                        <>
                          {!userId || !verificationStatus?.phone_verified ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 hover:bg-gray-100 rounded-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                              onClick={() => handleOpenDrawer(ad)}
                            >
                              <Image src="/icons/vertical.svg" alt="Options" width={20} height={20} />
                            </Button>
                          ) : (
                            <DropdownMenu open={openDropdownId === ad.id} onOpenChange={(open) => setOpenDropdownId(open ? ad.id : null)}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 hover:bg-gray-100 rounded-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                >
                                  <Image src="/icons/vertical.svg" alt="Options" width={20} height={20} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-auto flex flex-col p-1">
                                <AdActionsMenu
                                  ad={ad}
                                  onEdit={handleEdit}
                                  onToggleStatus={handleToggleStatus}
                                  onDelete={handleDelete}
                                  onShare={handleShare}
                                />
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-bold text-xl">{t("myAds.manageAds")}</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col">
            {selectedAd && (
              <AdActionsMenu
                ad={selectedAd}
                variant="drawer"
                onEdit={handleEdit}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
                onShare={handleShare}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <VisibilityStatusDialog
        id={selectedAd?.id}
        open={visibilityDialogOpen}
        onOpenChange={setVisibilityDialogOpen}
        reasons={selectedVisibilityReasons}
      />
    </>
  )
}
