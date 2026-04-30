"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { Advertisement } from "@/services/api/api-buy-sell"
import { createOrder } from "@/services/api/api-orders"
import { ProfileAPI } from "@/services/api"
import { getCategoryDisplayName, formatPaymentMethodName, maskAccountNumber, cn } from "@/lib/utils"
import Image from "next/image"
import AddPaymentMethodPanel from "@/app/profile/components/add-payment-method-panel"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { useUserDataStore } from "@/stores/user-data-store"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { useAddPaymentMethod, useUserPaymentMethods } from "@/hooks/use-api-queries"
import RateChangeConfirmation from "./rate-change-confirmation"
import AdUpdatedConfirmation from "./ad-updated-confirmation"
import { useTrackers } from "@/analytics/useTrackers"

interface OrderSidebarProps {
  isOpen: boolean
  onClose: () => void
  ad: Advertisement | null
  orderType: "buy" | "sell"
  p2pBalance: number
}

interface PaymentMethod {
  id: string
  type: string
  display_name: string
  fields: Record<string, any>
  is_enabled: number
  method: string
}

interface SellerPaymentMethod {
  type: string
  method: string
}

interface PaymentMethodOption {
  name: string
  value: string
}

const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { name: "eWallet", value: "ewallet" },
  { name: "Bank transfer", value: "bank_transfer" },
]

const PaymentSelectionContent = ({
  userPaymentMethods,
  tempSelectedPaymentMethods,
  hideAlert,
  setSelectedPaymentMethods,
  setTempSelectedPaymentMethods,
  handleAddPaymentMethodClick,
  sellerPaymentMethods,
  onAddPaymentMethodWithType,
}) => {
  const { t } = useTranslations()
  const [selectedPMs, setSelectedPMs] = useState(tempSelectedPaymentMethods)

  const handlePaymentMethodToggle = (methodId: string) => {
    setSelectedPMs((prev) => {
      const newSelection = prev.includes(methodId)
        ? prev.filter((id) => id !== methodId)
        : prev.length < 3
          ? [...prev, methodId]
          : prev

      return newSelection
    })
  }

  const handleAcceptedMethodClick = (method: SellerPaymentMethod) => {
    hideAlert()
    onAddPaymentMethodWithType?.(method.method)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-1 space-y-4 overflow-y-auto md:max-h-[30vh]">
        {userPaymentMethods.length > 0 && <div className="text-[#000000B8]">{t("paymentMethod.selectUpTo3")}</div>}
        {userPaymentMethods.length === 0 ? (
          <div className="pb-4 space-y-4">
            <div>
              <div className="text-slate-1200">{t("paymentMethod.addCompatibleMethod")}</div>
            </div>
            {sellerPaymentMethods && sellerPaymentMethods.length > 0 && (
              <div className="space-y-3">
                {sellerPaymentMethods.map((method, index) => (
                  <div
                    key={index}
                    onClick={() => handleAcceptedMethodClick(method)}
                    className="border border-grayscale-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Image src="/icons/plus_icon.png" alt="Plus" width={14} height={24} />
                      <span className="text-base text-slate-1200">
                        {formatPaymentMethodName(method.method)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          userPaymentMethods.map((method) => (
            <div
              key={method.id}
              className={` bg-grayscale-500 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-color ${!selectedPMs?.includes(method.id) && selectedPMs?.length >= 3
                ? "opacity-30 cursor-not-allowed hover:bg-white"
                : ""
                }`}
              onClick={() => {
                if (!(!selectedPMs?.includes(method.id) && selectedPMs?.length >= 3)) {
                  handlePaymentMethodToggle(method.id)
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-[6px] gap-2">
                    <div
                      className={`h-2 w-2 rounded-full mr-2 ${method.type === "bank" ? "bg-paymentMethod-bank" : "bg-paymentMethod-ewallet"
                        }`}
                    />
                    <div className="flex- flex-col">
                      <span className="text-base text-slate-1200">{getCategoryDisplayName(method.type)}</span>
                      <div className="font-normal text-grayscale-text-muted text-xs">{`${formatPaymentMethodName(method.display_name)} - ${method.fields.account.value}`}</div>
                    </div>
                  </div>
                </div>
                <Checkbox
                  checked={selectedPMs?.includes(method.id)}
                  onCheckedChange={() => handlePaymentMethodToggle(method.id)}
                  disabled={!selectedPMs?.includes(method.id) && selectedPMs?.length >= 3}
                  className="border-neutral-7 data-[state=checked]:bg-black data-[state=checked]:border-black w-[20px] h-[20px] rounded-sm border-[2px] disabled:opacity-30 disabled:cursor-not-allowed pointer-events-none"
                />
              </div>
            </div>
          ))
        )}

        {userPaymentMethods.length > 0 && (
          <div
            className="border border-grayscale-200 rounded-lg p-4 cursor-pointer transition-colors"
            onClick={() => {
              handleAddPaymentMethodClick()
            }}
          >
            <div className="flex items-center">
              <Image src="/icons/plus_icon.png" alt="Plus" width={14} height={24} className="mr-2" />
              <span className="text-slate-1200 text-base">
                {t("paymentMethod.addPaymentMethod")}
              </span>
            </div>
          </div>
        )}
      </div>
      <Button
        className="w-full mt-12"
        disabled={selectedPMs.length == 0}
        onClick={() => {
          setSelectedPaymentMethods(selectedPMs)
          setTempSelectedPaymentMethods(selectedPMs)
          hideAlert()
        }}
      >
        {t("common.confirm")}
      </Button>
    </div>
  )
}

export default function OrderSidebar({ isOpen, onClose, ad, orderType, p2pBalance }: OrderSidebarProps) {
  const { t } = useTranslations()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [amount, setAmount] = useState(null)
  const [totalAmount, setTotalAmount] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderStatus, setOrderStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([])
  const [userPaymentMethods, setUserPaymentMethods] = useState<PaymentMethod[]>([])
  const [sellerPaymentMethods, setSellerPaymentMethods] = useState<SellerPaymentMethod[]>([])
  const [tempSelectedPaymentMethods, setTempSelectedPaymentMethods] = useState<string[]>([])
  const { hideAlert, showAlert } = useAlertDialog()
  const [showAddPaymentPanel, setShowAddPaymentPanel] = useState(false)
  const [selectedPaymentMethodType, setSelectedPaymentMethodType] = useState<string | undefined>()
  const userData = useUserDataStore((state) => state.userData)
  const {
    joinExchangeRatesChannel,
    leaveExchangeRatesChannel,
    requestExchangeRate,
    subscribe,
    isConnected
  } = useWebSocketContext()
  const [marketRate, setMarketRate] = useState<number | null>(null)
  const [showRateChangeConfirmation, setShowRateChangeConfirmation] = useState(false)
  const [lockedConfirmationRate, setLockedConfirmationRate] = useState<number | null>(null)
  const [hasAdvertUpdated, setHasAdvertUpdated] = useState(false)
  const [showAdUpdatedModal, setShowAdUpdatedModal] = useState(false)
  const { track } = useTrackers()

  // Use React Query hooks
  const addPaymentMethod = useAddPaymentMethod()
  const { data: paymentMethodsResponse } = useUserPaymentMethods(isOpen)

  useEffect(() => {
    if (
      isOpen &&
      ad &&
      ad.payment_currency &&
      ad.account_currency &&
      ad.exchange_rate_type === "float" &&
      isConnected
    ) {
      joinExchangeRatesChannel(ad.account_currency, ad.payment_currency)

      const requestTimer = setTimeout(() => {
        requestExchangeRate(ad.account_currency, ad.payment_currency)
      }, 400)

      const unsubscribe = subscribe((data) => {
        const expectedChannel = `exchange_rates/${ad.account_currency}/${ad.payment_currency}`

        if (data.options.channel === expectedChannel && data.payload?.rate) {
          setMarketRate(data.payload.rate * ((ad.exchange_rate / 100) + 1))
        } else if (data.options.channel === expectedChannel && data.payload?.data?.rate) {
          setMarketRate(data.payload.data.rate * ((ad.exchange_rate / 100) + 1))
          ad.effective_rate_display = Number(data.payload.data.rate * ((ad.exchange_rate / 100) + 1)).toFixed(6)
        } else if (data?.options?.channel?.startsWith("adverts/currency/")) {
          if (data?.payload?.data?.event === "update" && data?.payload?.data?.advert) {
            const updatedAdvert = data.payload.data.advert
            if (ad.id == updatedAdvert.id) {
              setMarketRate(updatedAdvert.effective_rate)
              ad.effective_rate_display = updatedAdvert.effective_rate_display
            }
          }
        }
      })
      return () => {
        clearTimeout(requestTimer)
        leaveExchangeRatesChannel(ad.account_currency, ad.payment_currency)
        unsubscribe()
      }
    }
  }, [isOpen, ad, isConnected])

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      setOrderStatus(null)
    } else {
      setIsAnimating(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (ad && amount) {
      const numAmount = Number.parseFloat(amount)
      const exchangeRate = ad.effective_rate_display || 0
      const total = numAmount * exchangeRate
      setTotalAmount(total)

      const minLimit = ad.minimum_order_amount || "0.00"
      const maxLimit = ad.actual_maximum_order_amount || "0.00"

      if (orderType === "buy" && numAmount > p2pBalance) {
        setValidationError(t("order.insufficientBalance"))
      } else if (numAmount < minLimit || numAmount > maxLimit) {
        setValidationError(t("order.orderLimitError", { min: minLimit, max: maxLimit, currency: ad.account_currency }))
      } else {
        setValidationError(null)
      }
    }

    if (!amount) setTotalAmount(0)
  }, [amount, ad, orderType, p2pBalance, t, marketRate])

  const handleShowPaymentSelection = () => {
    track("ek_select_payment_method_markets_advert_sheet")
    showAlert({
      title: t("paymentMethod.title"),
      description: (
        <PaymentSelectionContent
          userPaymentMethods={userPaymentMethods}
          tempSelectedPaymentMethods={tempSelectedPaymentMethods}
          setSelectedPaymentMethods={setSelectedPaymentMethods}
          hideAlert={hideAlert}
          handleAddPaymentMethodClick={handleAddPaymentMethodClick}
          setTempSelectedPaymentMethods={setTempSelectedPaymentMethods}
          sellerPaymentMethods={sellerPaymentMethods}
          onAddPaymentMethodWithType={handleAddPaymentMethodWithType}
        />
      ),
    })
  }

  const handleAddPaymentMethodWithType = (methodType: string) => {
    setSelectedPaymentMethodType(methodType)
    setShowAddPaymentPanel(true)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value)
  }

  const handleSubmit = async () => {
    if (!ad) return

    track("ek_place_order_markets_advert_sheet")

    if (hasAdvertUpdated) {
      setShowAdUpdatedModal(true)
      return
    }

    if (ad.exchange_rate_type == "float" && marketRate && marketRate != ad.effective_rate) {
      track("ek_order_rate_slippage_detected_markets_advert_sheet")
      setLockedConfirmationRate(marketRate)
      setShowRateChangeConfirmation(true)
      return
    }

    await proceedWithOrder()
  }

  const proceedWithOrder = async () => {
    if (!ad) return

    try {
      setIsSubmitting(true)
      setOrderStatus(null)
      setShowRateChangeConfirmation(false)

      const numAmount = Number.parseFloat(amount)

      const rateToUse = lockedConfirmationRate || marketRate
      const order = await createOrder(ad.id, rateToUse, numAmount, selectedPaymentMethods)
      if (order.errors.length > 0) {
        const errorCode = order.errors[0].code
        track("ek_order_creation_failed_markets_advert_sheet", { error_code: errorCode, error_message: errorCode })
        if (errorCode === "OrderAdvertVersionChanged") {
          setShowAdUpdatedModal(true)
        } else if (errorCode === "OrderExists") {
          showAlert({
            title: "Active order detected",
            description: t("order.orderExists"),
            cancelText: "View order",
            confirmText: "Try different ad",
            type: "warning",
            onConfirm: () => {
              track("ek_view_other_ads_markets_advert_sheet")
              handleClose()
            },
            onCancel: () => {
              track("ek_view_active_order_markets_advert_sheet")
              router.push("/orders/" + order.errors[0].detail.order_id)
            }
          })
        } else if (errorCode === "OrderFloatRateSlippage") {
          showAlert({
            title: "The rate moved too much",
            description:
              "The market rate moved significantly before we could place your order. Try again with the latest rate.",
            confirmText: "Try again",
            type: "warning",
            onConfirm: () => {
              track("ek_retry_order_markets_advert_sheet")
            },
          })
        } else if (errorCode === "v1InsufficientFunds") {
          showAlert({
            title: t("order.insufficientFunds"),
            description: t("order.insufficientFundsDescription"),
            confirmText: t("order.viewOtherAds"),
            type: "warning",
            onConfirm: () => {
              track("ek_view_other_ads_markets_advert_sheet")
              handleClose()
            },
          })
        } else if (errorCode === "OrderCountryInvalid") {
          showAlert({
            title: t("order.adNotAvailableTitle"),
            description: t("order.adCountryInvalidDescription"),
            confirmText: t("order.viewOtherAds"),
            type: "warning",
            onConfirm: () => {
              track("ek_view_other_ads_markets_advert_sheet")
              handleClose()
            },
          })
        } else if (errorCode === "v1DebitFailed") {
          showAlert({
            title: t("order.adNotAvailableTitle"),
            description: t("order.adNotAvailableDescription"),
            confirmText: t("order.viewOtherAds"),
            type: "warning",
            onConfirm: () => {
              track("ek_view_other_ads_markets_advert_sheet")
              handleClose()
            },
          })
        } else if (errorCode === "OrderExchangeRateRequired") {
          showAlert({
            title: t("order.exchangeRateRequiredTitle"),
            description: t("order.exchangeRateRequiredDescription"),
            confirmText: t("order.exchangeRateRequiredCta"),
            type: "warning",
          })
        } else if (errorCode === "UserReadOnly") {
          showAlert({
            title: t("order.userReadOnlyTitle"),
            description: t("order.userReadOnlyDescription"),
            confirmText: t("order.userReadOnlyOpenChat"),
            cancelText: t("order.userReadOnlyMaybeLater"),
            type: "warning",
            onConfirm: () => {
              track("ek_open_live_chat_markets_advert_sheet")
              if (typeof window !== "undefined" && window.Intercom) {
                window.Intercom("show")
              }
            },
          })
        } else {
          showAlert({
            title: t("order.unableToCreateOrder"),
            description: t("order.orderCreationError"),
            confirmText: t("common.ok"),
            type: "warning",
          })
        }
      } else {
        track("ek_order_created_markets_advert_sheet")
        router.push("/orders/" + order.data.id)
      }
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : "Unknown Error"
      track("ek_order_creation_failed_markets_advert_sheet", { error_code: "order_creation_error", error_message: errorCode })
      setOrderStatus({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create order. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    track("ek_close_markets_advert_sheet")
    setIsAnimating(false)
    setTimeout(() => {
      setTotalAmount(0)
      setSelectedPaymentMethods([])
      setAmount(null)
      setValidationError(null)
      setTempSelectedPaymentMethods([])
      setShowRateChangeConfirmation(false)
      setLockedConfirmationRate(null)
      onClose()
    }, 300)
  }

  const handleAddPaymentMethod = async (method: string, fields: Record<string, string>) => {
    try {
      await addPaymentMethod.mutateAsync({ method, fields })
      await fetchUserPaymentMethods()
      setShowAddPaymentPanel(false)
    } catch (error: any) {
      let title = t("paymentMethod.unableToAdd")
      let description = t("paymentMethod.addError")

      if (error.errors && error.errors.length > 0 && error.errors[0].code === "PaymentMethodDuplicate") {
        title = t("paymentMethod.duplicateMethod")
        description = t("paymentMethod.duplicateMethodDescription")
      }
      showAlert({
        title,
        description,
        confirmText: t("common.ok"),
        type: "warning",
      })
    }
  }

  const handleAddPaymentMethodClick = () => {
    setShowAddPaymentPanel(true)
    hideAlert()
  }

  const getSelectedPaymentMethodsText = () => {
    if (selectedPaymentMethods.length === 0) return t("order.receivePaymentTo")
    if (selectedPaymentMethods.length === 1) {
      const method = userPaymentMethods.find((m) => m.id === selectedPaymentMethods[0])
      return method ? `${method.display_name}` : t("order.receivePaymentTo")
    }
    return t("order.selected") + ` (${selectedPaymentMethods.length})`
  }

  const isBuy = orderType === "buy"
  const title = isBuy ? `${t("common.sell")} USD` : `${t("common.buy")} USD`
  const youSendText = isBuy ? t("order.youReceive") : t("order.youPay")

  const minLimit = ad?.minimum_order_amount || "0.00"
  const maxLimit = ad?.actual_maximum_order_amount || "0.00"

  // Filter and transform user payment methods based on ad's accepted methods
  const filteredPaymentMethods = useMemo(() => {
    if (!paymentMethodsResponse?.data || !ad?.payment_methods) return []

    const buyerAcceptedMethods = ad.payment_methods || []
    return paymentMethodsResponse.data.filter((method: any) => {
      return buyerAcceptedMethods.some(
        (buyerMethod: string) => method.method.toLowerCase() === buyerMethod.toLowerCase(),
      )
    })
  }, [paymentMethodsResponse?.data, ad?.payment_methods])

  // Set user payment methods and seller payment methods
  useEffect(() => {
    if (filteredPaymentMethods.length > 0) {
      setUserPaymentMethods(filteredPaymentMethods)
    }

    const buyerAcceptedMethods = ad?.payment_methods || []
    const sellerMethods: SellerPaymentMethod[] = buyerAcceptedMethods.map((method: string) => ({
      type: method.toLowerCase().includes("bank") ? "bank" : "ewallet",
      method: method,
    }))
    setSellerPaymentMethods(sellerMethods)
  }, [filteredPaymentMethods, ad?.payment_methods])

  if (!isOpen && !isAnimating) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div
          className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${isOpen && isAnimating ? "opacity-100" : "opacity-0"
            }`}
          onClick={handleClose}
        />
        <div
          className={`relative w-full bg-white h-full transform transition-transform duration-300 ease-in-out ${isOpen && isAnimating ? "translate-x-0" : "translate-x-full"
            }`}
        >
          {ad && (
            <div className="flex flex-col h-full max-w-xl mx-auto">
              <div className="flex items-center justify-end px-4 py-3">
                <Button onClick={handleClose} variant="ghost" size="sm" className="bg-grayscale-300 px-1">
                  <Image src="/icons/close-circle.png" alt="Close" width={24} height={24} />
                </Button>
              </div>

              <div className="flex flex-col h-auto overflow-y-auto">
                <h2 className="text-xl font-bold p-4 pb-0">{title}</h2>
                <div className="p-4">
                  <div className="mb-4">
                    <Input
                      value={amount}
                      onChange={handleAmountChange}
                      type="number"
                      className={cn(
                        "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-4 py-0",
                        validationError && "border-red-500 focus:border-red-500 focus-visible:ring-0",
                      )}
                      step="any"
                      inputMode="decimal"
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-"].includes(e.key)) {
                          e.preventDefault()
                        }
                      }}
                      placeholder="0.00"
                      variant="floatingCurrency"
                      currency={ad.account_currency}
                      label={t("order.amount")}
                    />
                  </div>
                  {validationError && <p className="text-xs text-red-500 text-sm mb-2">{validationError}</p>}
                  <div className="flex items-center">
                    <span className="text-grayscale-text-muted">{youSendText}:&nbsp;</span>
                    <span className="text-slate-1200 font-bold">
                      {Number.parseFloat(totalAmount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {ad.payment_currency}
                    </span>
                  </div>
                </div>

                {isBuy && (
                  <div className="mx-4 mt-4 pb-6 border-b">
                    <div
                      className="border border-gray-200 rounded-lg px-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center h-[56px]"
                      onClick={handleShowPaymentSelection}
                    >
                      <div className="flex items-center justify-between flex-1">
                        <div className="flex flex-col gap-[1px]">
                          {selectedPaymentMethods.length > 0 && <span className="text-black/[0.72] text-xs font-normal">{t("order.receivePaymentTo")}</span>}
                          <span className="text-black/[0.72] text-base font-normal">{getSelectedPaymentMethodsText()}</span>
                        </div>
                        <Image
                          src="/icons/chevron-down.png"
                          alt="Arrow"
                          width={24}
                          height={24}
                          className="ml-2 transition-transform duration-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mx-4 mt-4 text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-grayscale-text-muted">{t("order.rateType")}</span>
                    <span className="bg-blue-50 text-blue-800 capitalize text-xs rounded-sm p-1">
                      {ad.exchange_rate_type === "float" ? "Floating" : "Fixed"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-grayscale-text-muted">{t("order.exchangeRate")}</span>
                    <span className="text-slate-1200">
                      {ad.effective_rate_display} {ad.payment_currency}
                      <span className="text-grayscale-text-muted"> /{ad.account_currency}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-grayscale-text-muted">{t("order.orderLimit")}</span>
                    <span className="text-slate-1200">
                      {minLimit} - {maxLimit} {ad.account_currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-grayscale-text-muted">{t("order.paymentTime")}</span>
                    <span className="text-slate-1200">
                      {ad.order_expiry_period} {t("market.min")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-grayscale-text-muted">{isBuy ? t("order.buyer") : t("order.seller")}</span>
                    <span className="text-slate-1200">{ad.user?.nickname}</span>
                  </div>
                </div>

                <div className="border-t border-[#E9ECEF] m-4 mb-0 pt-4 text-sm flex flex-col md:flex-row justify-between">
                  <h3 className="text-grayscale-text-muted flex-1">
                    {isBuy ? t("order.buyersPaymentMethods") : t("order.sellersPaymentMethods")}
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {ad.payment_methods?.map((method, index) => (
                      <div key={index} className="flex items-center">
                        <div
                          className={`h-2 w-2 rounded-full mr-2 ${method.toLowerCase().includes("bank") ? "bg-paymentMethod-bank" : "bg-paymentMethod-ewallet"
                            }`}
                        />
                        <span className="text-slate-1200">{formatPaymentMethodName(method)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mx-4 mt-4 border-t border-[#E9ECEF] py-2 text-sm">
                  <h3 className="text-grayscale-text-muted">
                    {isBuy ? t("order.buyersInstructions") : t("order.sellersInstructions")}
                  </h3>
                  <p className="text-slate-1200 break-words mt-2">
                    {ad.description || "-"}
                  </p>
                </div>

                <div className="mt-auto p-4 flex justify-end">
                  <Button
                    className="w-full md:w-auto"
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={
                      !amount || (isBuy && selectedPaymentMethods.length === 0) || !!validationError || isSubmitting
                    }
                  >
                    {isSubmitting ? (
                      <Image src="/icons/spinner.png" alt="Loading" width={20} height={20} className="animate-spin" />
                    ) : (
                      t("order.placeOrder")
                    )}
                  </Button>
                  {orderStatus && !orderStatus.success && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{orderStatus.message}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddPaymentPanel && (
        <AddPaymentMethodPanel
          onAdd={handleAddPaymentMethod}
          isLoading={addPaymentMethod.isPending}
          allowedPaymentMethods={ad?.payment_methods}
          onClose={() => {
            setShowAddPaymentPanel(false)
            setSelectedPaymentMethodType(undefined)
          }}
          selectedMethod={selectedPaymentMethodType}
        />
      )}

      {ad && (
        <RateChangeConfirmation
          isOpen={showRateChangeConfirmation}
          onConfirm={() => { track("ek_confirm_rate_change_markets_advert_sheet"); proceedWithOrder() }}
          onCancel={() => {
            track("ek_cancel_rate_change_markets_advert_sheet")
            setShowRateChangeConfirmation(false)
            setLockedConfirmationRate(null)
          }}
          amount={amount || "0"}
          accountCurrency={ad.account_currency}
          paymentCurrency={ad.payment_currency}
          oldRate={ad.effective_rate}
          newRate={lockedConfirmationRate}
          isBuy={isBuy}
        />
      )}
    </>
  )
}
