"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useUserDataStore } from "@/stores/user-data-store"
import { Button } from "@/components/ui/button"
import { OrdersAPI } from "@/services/api"
import type { Order } from "@/services/api/api-orders"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatAmount, formatStatus, getStatusBadgeStyle } from "@/lib/utils"
import { RatingSidebar } from "@/components/rating-filter/rating-sidebar"
import { useTimeRemaining } from "@/hooks/use-time-remaining"
import { useIsMobile } from "@/hooks/use-mobile"
import OrderChat from "@/components/order-chat"
import { useWebSocketContext } from "@/contexts/websocket-context"
import EmptyState from "@/components/empty-state"
import { useOrdersFilterStore } from "@/stores/orders-filter-store"
import { useChatVisibilityStore } from "@/stores/chat-visibility-store"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateFilter } from "./components/date-filter"
import { format, startOfDay, endOfDay } from "date-fns"
import { PreviousOrdersSection } from "./components/previous-orders-section"
import { TemporaryBanAlert } from "@/components/temporary-ban-alert"
import { useTranslations } from "@/lib/i18n/use-translations"
import { Skeleton } from "@/components/ui/skeleton"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { KycOnboardingSheet } from "@/components/kyc-onboarding-sheet"
import { useOrders } from "@/hooks/use-api-queries"
import { useTrackers } from "@/analytics/useTrackers"

function TimeRemainingDisplay({ expiresAt }) {
  const timeRemaining = useTimeRemaining(expiresAt)
  const pad = (n: number) => String(n).padStart(2, "0")

  if (timeRemaining.hours && timeRemaining.minutes && timeRemaining.seconds) return null

  return (
    <div className="text-xs bg-[#0000000a] text-[#000000B8] rounded-sm w-fit py-[4px] px-[8px]">
      {`${pad(timeRemaining.hours)}:${pad(timeRemaining.minutes)}:${pad(timeRemaining.seconds)}`}
    </div>
  )
}

export default function OrdersPage() {
  const { t } = useTranslations()
  const { track } = useTrackers()
  const router = useRouter()
  const { hideAlert, showAlert } = useAlertDialog()
  const { activeTab, setActiveTab, dateFilter, customDateRange, setDateFilter, setCustomDateRange } =
    useOrdersFilterStore()
  const { setIsChatVisible } = useChatVisibilityStore()
  const [isRatingSidebarOpen, setIsRatingSidebarOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showPreviousOrders, setShowPreviousOrders] = useState(false)
  const [showCheckPreviousOrdersButton, setShowCheckPreviousOrdersButton] = useState(false)
  const [showKycPopup, setShowKycPopup] = useState(false)
  const isMobile = useIsMobile()
  const { joinChannel } = useWebSocketContext()
  const { userData, userId } = useUserDataStore()
  const tempBanUntil = userData?.temp_ban_until

  // Build filters for useOrders hook
  const filters = {
    is_open: activeTab === "active" ? true : false,
    ...(activeTab === "past" &&
      dateFilter !== "all" &&
      customDateRange.from && {
      date_from: format(startOfDay(customDateRange.from), "yyyy-MM-dd"),
      date_to: customDateRange.to
        ? format(endOfDay(customDateRange.to), "yyyy-MM-dd")
        : format(endOfDay(customDateRange.from), "yyyy-MM-dd"),
    }),
  }

  const { data: ordersResponse, isLoading, refetch } = useOrders(filters)
  const orders = Array.isArray(ordersResponse?.data) ? ordersResponse.data : []

  useEffect(() => {
    track("ek_open_orders")
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const shouldShowKyc = searchParams.get("show_kyc_popup") === "true"
    if (shouldShowKyc) {
      setShowKycPopup(true)
    }
  }, [])

  useEffect(() => {
    if (showKycPopup) {
      showAlert({
        title: t("profile.gettingStarted"),
        description: (
          <div className="space-y-4 mb-6 mt-2">
            <KycOnboardingSheet route="markets" onClose={hideAlert} />
          </div>
        ),
        confirmText: undefined,
        cancelText: undefined,
        onConfirm: () => setShowKycPopup(false),
        onCancel: () => setShowKycPopup(false),
      })
      setShowKycPopup(false)
    }
  }, [showKycPopup, showAlert, t])

  useEffect(() => {
    if (userData?.signup === "v1") {
      setShowCheckPreviousOrdersButton(true)
    } else if (userData?.signup) {
      setShowCheckPreviousOrdersButton(false)
    }
  }, [userData?.signup])

  const handleCheckPreviousOrders = () => {
    setShowPreviousOrders(true)
  }

  const handleBackFromPreviousOrders = () => {
    setShowPreviousOrders(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const navigateToOrderDetails = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

  const handleRateClick = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation()
    track("ek_rate_order_orders")
    setIsRatingSidebarOpen(true)
    setSelectedOrderId(order.id)
    setSelectedOrder(order)
  }

  const handleRatingSidebarClose = () => {
    setIsRatingSidebarOpen(false)
    setSelectedOrderId(null)
  }

  const handleRatingSubmit = () => {
    setIsRatingSidebarOpen(false)
    setSelectedOrderId(null)
    refetch()
  }

  const getOrderType = (order) => {
    if (order.type === "buy") {
      if (order.user.id == userId) return <span className="text-secondary text-base">{t("common.buy")}</span>
      else return <span className="text-destructive text-base">{t("common.sell")}</span>
    } else {
      if (order.user.id == userId) return <span className="text-destructive text-base">{t("common.sell")}</span>
      else return <span className="text-secondary text-base">{t("common.buy")}</span>
    }
  }

  const getRecommendLabel = () => {
    if (selectedOrder?.type === "sell") {
      if (selectedOrder?.advert.user.id == userId) return t("orders.seller")
      return t("orders.buyer")
    } else {
      if (selectedOrder?.advert.user.id == userId) return t("orders.buyer")
      return t("orders.seller")
    }
  }

  const getPayReceiveLabel = (order) => {
    let label = ""
    if (order.type === "buy") {
      if (order.user.id == userId) label = t("orders.youPay")
      else label = t("orders.youReceive")
    } else {
      if (order.user.id == userId) label = t("orders.youReceive")
      else label = t("orders.youPay")
    }

    return label
  }

  const handleChatClick = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation()
    track("ek_chat_orders")
    if (isMobile) {
      setSelectedOrder(order)
      setShowChat(true)
      setIsChatVisible(true)

      joinChannel("orders", order.id)
    } else {
      navigateToOrderDetails(order.id)
    }
  }

  const handleTabChange = (tabValue: string) => {
    if (tabValue === "active") track("ek_active_tab_orders")
    else track("ek_past_tab_orders")
    setActiveTab(tabValue)
  }

  const OrdersLoadingSkeleton = () => (
    <div className="grid grid-cols-[1fr] md:grid-cols-[1fr_1fr] gap-4 bg-white">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border rounded-lg p-4">
          <Skeleton className="h-[160px] w-full rounded-lg bg-grayscale-500" />
        </div>
      ))}
    </div>
  )

  const DesktopOrderTable = () => (
    <div className="relative">
      <div className="overflow-auto max-h-[calc(100vh-200px)] pb-20 md:pb-0">
        <Table>
          <TableHeader className="hidden border-b sticky top-0 bg-white shadow-sm">
            <TableRow>
              {activeTab === "past" && (
                <TableHead className="py-4 px-4 text-slate-600 font-normal">{t("orders.date")}</TableHead>
              )}
              <TableHead className="py-4 px-4 text-slate-600 font-normal">{t("orders.orderId")}</TableHead>
              <TableHead className="py-4 px-4 text-slate-600 font-normal">{t("orders.amount")}</TableHead>
              <TableHead className="py-4 px-4 text-slate-600 font-normal">{t("orders.status")}</TableHead>
              {activeTab === "active" && (
                <TableHead className="py-4 px-4 text-slate-600 font-normal">{t("orders.time")}</TableHead>
              )}
              {activeTab === "past" && (
                <TableHead className="py-4 px-4 text-slate-600 font-normal">{t("orders.rating")}</TableHead>
              )}
              <TableHead className="py-4 px-4 text-slate-600 font-normal"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="lg:[&_tr:last-child]:border-1 grid grid-cols-[1fr] md:grid-cols-[1fr_1fr] gap-4 bg-white font-normal text-sm">
            {orders.map((order) => {
              const isBuyer = getPayReceiveLabel(order) === t("orders.youPay")

              return (
                <TableRow
                  className="grid grid-cols-[2fr_1fr] border rounded-lg cursor-pointer gap-2 py-4"
                  key={order.id}
                  onClick={() => {
                    track("ek_order_item_orders", {
                      section_name: activeTab === "active" ? "active_orders" : "past_orders",
                    })
                    navigateToOrderDetails(order.id)
                  }}
                >
                  {activeTab === "past" && (
                    <TableCell className="py-0 px-4 align-top text-slate-600 text-xs row-start-4 col-span-full">
                      {order.created_at ? formatDate(order.created_at) : ""}
                    </TableCell>
                  )}
                  <TableCell className="py-0 px-4 align-top row-start-2 col-span-full">
                    <div>
                      <div className="flex flex-row justify-between">
                        <div className="font-bold">
                          {getOrderType(order)}
                          <span className="text-base">
                            {` ${formatAmount(order.amount)} ${order.advert.account_currency}`}
                          </span>
                        </div>
                        <div className="mt-[4px] text-slate-600 text-xs">
                          {t("orders.id")}: {order.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-0 px-4 align-top text-xs row-start-3">
                    <div className="flex flex-row-reverse justify-end gap-[4px]">
                      <div>
                        {formatAmount(order.payment_amount)} {order.payment_currency}
                      </div>
                      <div className="text-slate-600 text-xs">{getPayReceiveLabel(order)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-0 px-4 align-top row-start-1">
                    <div
                      className={`w-fit px-[12px] py-[8px] rounded-[6px] text-xs ${getStatusBadgeStyle(order.status, isBuyer)}`}
                    >
                      {formatStatus(false, order.status, isBuyer, t)}
                    </div>
                  </TableCell>
                  {activeTab === "active" && (
                    <TableCell className="py-0 px-4 align-top row-start-1 col-start-2 justify-self-end">
                      {(order.status === "pending_payment" || order.status === "pending_release") && (
                        <TimeRemainingDisplay expiresAt={order.expires_at} />
                      )}
                    </TableCell>
                  )}
                  {activeTab === "past" && (
                    <TableCell className="py-0 px-4 align-top row-start-1 flex justify-end items-center">
                      {order.rating > 0 && (
                        <div className="flex">
                          <Image src="/icons/star-icon.png" alt="Rating" width={20} height={20} className="mr-1" />
                          {Number(order.rating).toFixed(1)}
                        </div>
                      )}
                      {order.is_reviewable > 0 && !order.disputed_at && (
                        <Button variant="black" size="xs" onClick={(e) => handleRateClick(e, order)}>
                          {t("orders.rate")}
                        </Button>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="py-0 px-4 align-top row-start-5 col-span-full">
                    <div className="flex flex-row items-center justify-between">
                      <div className="text-xs">
                        {order.advert.user.id == userId ? order.user.nickname : order.advert.user.nickname}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={(e) => {
                            handleChatClick(e, order)
                          }}
                          className="text-slate-500 hover:text-slate-700 z-auto p-0"
                          variant="ghost"
                          size="sm"
                        >
                          <Image src="/icons/chat-icon.png" alt="Chat" width={20} height={20} />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )

  if (isMobile && showChat && selectedOrder) {
    const counterpartyName =
      selectedOrder?.advert.user.id == userId ? selectedOrder?.user?.nickname : selectedOrder?.advert?.user?.nickname
    const counterpartyInitial = counterpartyName.charAt(0).toUpperCase()
    const isClosed = ["cancelled", "completed", "refunded"].includes(selectedOrder?.status)
    const counterpartyOnlineStatus =
      selectedOrder?.advert.user.id == userId ? selectedOrder?.user?.is_online : selectedOrder?.advert?.user?.is_online
    const counterpartyLastOnlineAt =
      selectedOrder?.advert.user.id == userId
        ? selectedOrder?.user?.last_online_at
        : selectedOrder?.advert?.user?.last_online_at

    return (
      <div className="h-screen md:h-[calc(100vh-64px)] md:mb-[64px] flex flex-col">
        <div className="flex-1 h-full">
          <OrderChat
            orderId={selectedOrder.id}
            counterpartyName={counterpartyName}
            counterpartyInitial={counterpartyInitial}
            isClosed={isClosed}
            counterpartyOnlineStatus={counterpartyOnlineStatus}
            counterpartyLastOnlineAt={counterpartyLastOnlineAt}
            onNavigateToOrderDetails={() => {
              router.push(`/orders/${selectedOrder.id}`)
            }}
          />
        </div>
      </div>
    )
  }

  if (showPreviousOrders) {
    return (
      <>
        <PreviousOrdersSection onBack={handleBackFromPreviousOrders} />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-col h-full px-3">
        <div className="flex flex-col">
          <div className="w-[calc(100%+24px)] md:w-full h-[80px] flex flex-row items-center gap-[16px] md:gap-[24px] bg-slate-1200 p-6 rounded-b-3xl md:rounded-3xl justify-between -m-3 mb-0 md:m-0">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="w-full bg-transparent p-0 gap-4">
                <TabsTrigger
                  value="active"
                  className="w-auto data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:rounded-none px-0"
                  variant="underline"
                >
                  {t("orders.active")}
                </TabsTrigger>
                <TabsTrigger
                  value="past"
                  className="w-auto data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:rounded-none px-0"
                  variant="underline"
                >
                  {t("orders.past")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {showCheckPreviousOrdersButton && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white font-normal hover:text-white hover:bg-transparent "
                onClick={handleCheckPreviousOrders}
              >
                {t("orders.checkPreviousOrders")}
                <Image src="/icons/chevron-right-white.png" width={10} height={24} className="ml-1" />
              </Button>
            )}
          </div>
          {tempBanUntil && (
            <div className="mt-4">
              <TemporaryBanAlert tempBanUntil={tempBanUntil} />
            </div>
          )}
          <div className="my-4 self-end">
            {activeTab === "past" && orders.length > 0 && (
              <DateFilter
                value={dateFilter}
                customRange={customDateRange}
                onValueChange={(val) => {
                  track("ek_date_filter_orders")
                  setDateFilter(val)
                }}
                onCustomRangeChange={setCustomDateRange}
              />
            )}
          </div>
        </div>
        <div className="flex-1 pb-4">
          {isLoading ? (
            <OrdersLoadingSkeleton />
          ) : orders.length === 0 ? (
            <div>
              {activeTab === "active" ? (
                <EmptyState icon="/icons/no-active-orders.svg" title={t("orders.noActiveOrders")} description={t("orders.noActiveOrdersDescription")} redirectToAds={true} redirectToMarket={true} />
              ) : (
                <EmptyState icon="/icons/no-active-orders.svg" title={t("orders.noPastOrders")} description={t("orders.noPastOrdersDescription")} />
              )}
            </div>
          ) : (
            <div>
              <DesktopOrderTable />
            </div>
          )}
        </div>
        <RatingSidebar
          isOpen={isRatingSidebarOpen}
          onClose={handleRatingSidebarClose}
          orderId={selectedOrderId}
          onSubmit={handleRatingSubmit}
          recommendLabel={t("orders.wouldYouRecommend", { role: getRecommendLabel() })}
        />
      </div>
    </>
  )
}
