"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import StatsGrid from "./stats-grid"
import PaymentMethodsTab from "./payment-methods-tab"
import FollowsTab from "./follows-tab"
import BlockedTab from "./blocked-tab"
import ClosedGroupTab from "./closed-group"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Divider } from "@/components/ui/divider"
import AddPaymentMethodPanel from "./add-payment-method-panel"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import Image from "next/image"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useUserDataStore } from "@/stores/user-data-store"
import { KycOnboardingSheet } from "@/components/kyc-onboarding-sheet"
import { useTranslations } from "@/lib/i18n/use-translations"
import { Skeleton } from "@/components/ui/skeleton"
import { useAddPaymentMethod } from "@/hooks/use-api-queries"
import { useTrackers } from "@/analytics/useTrackers"

interface StatsTabsProps {
  stats?: any
  isLoading?: boolean,
  activeTab: string
}

const profileTabTrackerMap: Record<string, string> = {
  stats: "ek_my_stats_profile",
  payment: "ek_payment_methods_profile",
  follows: "ek_following_profile",
  blocked: "ek_blocked_users_profile",
  counterparties: "ek_trade_partners_profile",
  "closed-group": "ek_closed_group_profile",
}

export default function StatsTabs({ stats, isLoading, activeTab }: StatsTabsProps) {
  const { track } = useTrackers()
  const isMobile = useIsMobile()
  const { hideAlert, showAlert } = useAlertDialog()
  const [showStatsSidebar, setShowStatsSidebar] = useState(false)
  const [showPaymentMethodsSidebar, setShowPaymentMethodsSidebar] = useState(false)
  const [showFollowsSidebar, setShowFollowsSidebar] = useState(false)
  const [showBlockedSidebar, setShowBlockedSidebar] = useState(false)
  const [showClosedGroupSidebar, setShowClosedGroupSidebar] = useState(false)
  const { toast } = useToast()
  const [showAddPaymentSheet, setShowAddPaymentSheet] = useState(false)
  const [showPaymentDetailsSheet, setShowPaymentDetailsSheet] = useState(false)
  const [selectedMethodForDetails, setSelectedMethodForDetails] = useState<string | null>(null)
  const [showAddPaymentPanel, setShowAddPaymentPanel] = useState(false)
  const { userData } = useUserDataStore()
  const userId = useUserDataStore((state) => state.userId)
  const verificationStatus = useUserDataStore((state) => state.verificationStatus)
  const onboardingStatus = useUserDataStore((state) => state.onboardingStatus)
  const isPoiExpired = userId && onboardingStatus?.kyc?.poi_status !== "approved"
  const isPoaExpired = userId && onboardingStatus?.kyc?.poa_status !== "approved"
  const { t, locale } = useTranslations()
  const [paymentMethodsCount, setPaymentMethodsCount] = useState(0)

  // Use React Query hook for adding payment methods
  const addPaymentMethod = useAddPaymentMethod()

  const helpCentreUrl =
    locale != "en"
      ? `https://trade.deriv.com/${locale}/help-centre/deriv-p2p`
      : `https://trade.deriv.com/help-centre/deriv-p2p`

  const isDiamond = userData.trade_band === "diamond"
  const showClosedGroupTab = isDiamond

  const tabs = [
    { id: "stats", label: t("profile.stats") },
    { id: "payment", label: t("profile.paymentMethods") },
    { id: "follows", label: t("profile.follows") },
    ...(showClosedGroupTab
      ? [{ id: "closed-group", label: t("profile.closedGroup") }]
      : []),
    { id: "blocked", label: t("profile.blocked") },
  ]

  const handleAddPaymentMethod = async (method: string, fields: Record<string, string>) => {
    try {
      await addPaymentMethod.mutateAsync({ method, fields })

      toast({
        description: (
          <div className="flex items-center gap-2">
            <Image src="/icons/tick.svg" alt="Success" width={24} height={24} className="text-white" />
            <span>{t("profile.paymentMethodAdded")}</span>
          </div>
        ),
        className: "bg-black text-white border-black h-[48px] rounded-lg px-[16px] py-[8px]",
        duration: 2500,
      })

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

  const handleShowAddPaymentMethod = () => {
    if (userId && verificationStatus?.phone_verified && !isPoiExpired && !isPoaExpired) {
      setShowAddPaymentPanel(true)
    } else {
      let title = t("profile.gettingStarted")

      if (isPoiExpired && isPoaExpired) title = t("profile.verificationExpired")
      else if (isPoiExpired) title = t("profile.identityVerificationExpired")
      else if (isPoaExpired) title = t("profile.addressVerificationExpired")

      showAlert({
        title,
        description: (
          <div className="space-y-4 my-2">
            <KycOnboardingSheet route="profile" onClose={hideAlert} />
          </div>
        ),
        confirmText: undefined,
        cancelText: undefined,
      })
    }
  }

  return (
    <div className="relative px-3 md:px-0">
      <div className="mb-[64px] md:mb-6">
        {isMobile ? (
          <div className="mx-[-12px]">
            <div className="font-bold text-[18px] mx-6 mt-6">{t("profile.aboutYou")}</div>
            <div
              onClick={() => {
                track("ek_my_stats_profile")
                setShowStatsSidebar(true)
              }}
              className="grid grid-cols-[auto_1fr_1fr] items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Image src="/icons/profile-stats.svg" width={20} height={20} />
              <span className="text-sm font-normal text-gray-900 ml-4">{t("profile.stats")}</span>
              <Image
                src="/icons/chevron-right-gray.png"
                alt="Chevron right"
                width={20}
                height={20}
                className="justify-self-end"
              />
            </div>
            {showStatsSidebar && (
              <div className="fixed inset-y-0 right-0 z-50 bg-white shadow-xl flex flex-col inset-0 w-full">
                <div className="flex items-center gap-4 px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStatsSidebar(false)}
                    className="bg-grayscale-300 px-1"
                  >
                    <Image src="/icons/arrow-left-icon.png" alt="Close" width={24} height={24} />
                  </Button>
                </div>
                <div className="m-4">
                  <h2 className="text-2xl font-bold mb-4 px-2 md:px-2">{t("profile.stats")}</h2>
                  <StatsGrid stats={stats} />
                </div>
              </div>
            )}
            <Divider className="ml-[60px]" />
            <div
              onClick={() => {
                track("ek_payment_methods_profile")
                setShowPaymentMethodsSidebar(true)
              }}
              className="grid grid-cols-[auto_1fr_1fr] items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Image src="/icons/profile-pm.svg" width={20} height={20} />
              <span className="text-sm font-normal text-gray-900 ml-4">{t("profile.paymentMethods")}</span>
              <Image
                src="/icons/chevron-right-gray.png"
                alt="Chevron right"
                width={20}
                height={20}
                className="justify-self-end"
              />
            </div>
            {showPaymentMethodsSidebar && (
              <div className="fixed inset-y-0 right-0 z-50 bg-white shadow-xl flex flex-col inset-0 w-full">
                <div className="flex items-center gap-4 px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPaymentMethodsSidebar(false)}
                    className="bg-grayscale-300 px-1"
                  >
                    <Image src="/icons/arrow-left-icon.png" alt="Close" width={24} height={24} />
                  </Button>
                </div>
                <div className="m-4 flex-1 overflow-auto">
                  {paymentMethodsCount > 0 && (
                    <h2 className="text-2xl font-bold mb-4">{t("profile.paymentMethods")}</h2>
                  )}
                  <PaymentMethodsTab
                    onAddPaymentMethod={handleShowAddPaymentMethod}
                    onPaymentMethodsCountChange={setPaymentMethodsCount}
                  />
                </div>
                {paymentMethodsCount > 0 && (
                  <div className="p-4">
                    <Button
                      onClick={handleShowAddPaymentMethod}
                      variant="outline"
                      className="w-full rounded-full bg-transparent"
                    >
                      {t("profile.addPaymentMethod")}
                    </Button>
                  </div>
                )}
              </div>
            )}
            <Divider className="ml-[60px]" />
            <div className="font-bold text-[18px] mx-6 mt-6">{t("profile.settings")}</div>
            <div
              onClick={() => {
                track("ek_following_profile")
                setShowFollowsSidebar(true)
              }}
              className="grid grid-cols-[auto_1fr_1fr] items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Image src="/icons/profile-follows.svg" width={20} height={20} />
              <span className="text-sm font-normal text-gray-900 ml-4">{t("profile.follows")}</span>
              <Image
                src="/icons/chevron-right-gray.png"
                alt="Chevron right"
                width={20}
                height={20}
                className="justify-self-end"
              />
            </div>
            {showFollowsSidebar && (
              <div className="fixed inset-y-0 right-0 z-50 bg-white shadow-xl flex flex-col inset-0 w-full">
                <div className="flex items-center gap-4 px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFollowsSidebar(false)}
                    className="bg-grayscale-300 px-1"
                  >
                    <Image src="/icons/arrow-left-icon.png" alt="Close" width={24} height={24} />
                  </Button>
                </div>
                <div className="m-4 flex-1 overflow-auto">
                  <h2 className="text-2xl font-bold mb-4">{t("profile.follows")}</h2>
                  <FollowsTab />
                </div>
              </div>
            )}
            {showClosedGroupTab && (
              <>
                <Divider className="ml-[60px]" />
                <div
                  onClick={() => {
                    track("ek_closed_group_profile")
                    setShowClosedGroupSidebar(true)
                  }}
                  className="grid grid-cols-[auto_1fr_1fr] items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Image src="/icons/star-light.svg" width={20} height={20} />
                  <span className="text-sm font-normal text-gray-900 ml-4">{t("profile.closedGroup")}</span>
                  <Image
                    src="/icons/chevron-right-gray.png"
                    alt="Chevron right"
                    width={20}
                    height={20}
                    className="justify-self-end"
                  />
                </div>
              </>)}
            {showClosedGroupTab && showClosedGroupSidebar && (
              <div className="fixed inset-y-0 right-0 z-50 bg-white shadow-xl flex flex-col inset-0 w-full">
                <div className="flex items-center gap-4 px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClosedGroupSidebar(false)}
                    className="bg-grayscale-300 px-1"
                  >
                    <Image src="/icons/arrow-left-icon.png" alt="Close" width={24} height={24} />
                  </Button>
                </div>
                <div className="m-4 flex-1 overflow-auto">
                  <h2 className="text-2xl font-bold mb-4">{t("profile.closedGroup")}</h2>
                  <ClosedGroupTab />
                </div>
              </div>
            )}
            <Divider className="ml-[60px]" />
            <div
              onClick={() => {
                track("ek_blocked_users_profile")
                setShowBlockedSidebar(true)
              }}
              className="grid grid-cols-[auto_1fr_1fr] items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Image src="/icons/profile-blocks.svg" width={20} height={20} />
              <span className="text-sm font-normal text-gray-900 ml-4">{t("profile.blocked")}</span>
              <Image
                src="/icons/chevron-right-sm.png"
                alt="Chevron right"
                width={20}
                height={20}
                className="justify-self-end"
              />
            </div>
            {showBlockedSidebar && (
              <div className="fixed inset-y-0 right-0 z-50 bg-white shadow-xl flex flex-col inset-0 w-full">
                <div className="flex items-center gap-4 px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBlockedSidebar(false)}
                    className="bg-grayscale-300 px-1"
                  >
                    <Image src="/icons/arrow-left-icon.png" alt="Close" width={24} height={24} />
                  </Button>
                </div>
                <div className="m-4 flex-1 overflow-auto">
                  <h2 className="text-2xl font-bold mb-4">{t("profile.blocked")}</h2>
                  <BlockedTab />
                </div>
              </div>
            )}
            <Divider className="ml-[60px]" />
            <div className="font-bold text-[18px] mx-6 mt-6">{t("profile.support")}</div>
            <div
              onClick={() => {
                track("ek_help_centre_profile")
                window.location.href = helpCentreUrl
              }}
              className="grid grid-cols-[auto_1fr_1fr] items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Image src="/icons/profile-help-centre.svg" width={20} height={20} />
              <span className="text-sm font-normal text-gray-900 ml-4">{t("navigation.p2pHelpCentre")}</span>
              <Image
                src="/icons/chevron-right-gray.png"
                alt="Chevron right"
                width={20}
                height={20}
                className="justify-self-end"
              />
            </div>
          </div>
        ) : (
          <Tabs defaultValue={activeTab} className="h-full">
            <div className="flex items-end border-b-2 border-b-grayscale-500 mb-2 md:mt-8">
              <TabsList className="w-auto h-9 bg-transparent">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="w-full px-4 py-2 rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-black data-[state=active]:shadow-none"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="stats" className="mt-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="py-4">
                          <Skeleton className="bg-grayscale-500 h-4 w-3/4 mb-2 rounded" />
                          <Skeleton className="bg-grayscale-500 h-8 w-1/2 rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-slate-200 py-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="py-4">
                          <Skeleton className="bg-grayscale-500 h-4 w-3/4 mb-2 rounded" />
                          <Skeleton className="bg-grayscale-500 h-8 w-1/2 rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="py-4">
                          <Skeleton className="bg-grayscale-500 h-4 w-3/4 mb-2 rounded" />
                          <Skeleton className="bg-grayscale-500 h-8 w-1/2 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <StatsGrid stats={stats} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="payment" className="mt-4 h-[calc(100vh-440px)] overflow-y-auto">
              <div className="relative">
                {paymentMethodsCount > 0 && (
                  <div className="flex justify-end mb-4">
                    <Button variant="outline" size="sm" onClick={handleShowAddPaymentMethod}>
                      <Image src="/icons/plus_icon.png" alt="Add payment" width={14} height={24} className="mr-1" />
                      {t("profile.addPaymentMethod")}
                    </Button>
                  </div>
                )}
                <PaymentMethodsTab
                  onAddPaymentMethod={handleShowAddPaymentMethod}
                  onPaymentMethodsCountChange={setPaymentMethodsCount}
                />
              </div>
            </TabsContent>

            <TabsContent value="follows" className="mt-4 h-[calc(100vh-480px)] overflow-y-auto">
              <div className="relative">
                <FollowsTab />
              </div>
            </TabsContent>

            {showClosedGroupTab && (
              <TabsContent value="closed-group" className="mt-4 h-[calc(100vh-440px)] overflow-y-auto">
                <div className="relative">
                  <ClosedGroupTab />
                </div>
              </TabsContent>
            )}

            <TabsContent value="blocked" className="mt-4 h-[calc(100vh-440px)] overflow-y-auto">
              <div className="relative">
                <BlockedTab />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {showAddPaymentPanel && (
        <AddPaymentMethodPanel
          onAdd={handleAddPaymentMethod}
          isLoading={addPaymentMethod.isPending}
          onClose={() => setShowAddPaymentPanel(false)}
        />
      )}
    </div>
  )
}
