"use client"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUserDataStore } from "@/stores/user-data-store"
import { Button } from "@/components/ui/button"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { KycOnboardingSheet } from "@/components/kyc-onboarding-sheet"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"

interface EmptyStateProps {
  adType?: "buy" | "sell"
  icon?: string
  title?: string
  description?: string
  className?: string
  redirectToAds?: boolean
  redirectToMarket?: boolean
  onAddPaymentMethod?: () => void
  route?: string | null
}

export default function EmptyState({
  adType = "sell",
  icon,
  title = "No ads available",
  description,
  className,
  redirectToAds = false,
  redirectToMarket = false,
  onAddPaymentMethod,
  route,
}: EmptyStateProps) {
  const router = useRouter()
  const userId = useUserDataStore((state) => state.userId)
  const verificationStatus = useUserDataStore((state) => state.verificationStatus)
  const onboardingStatus = useUserDataStore((state) => state.onboardingStatus)
  const isPoiExpired = userId && onboardingStatus?.kyc?.poi_status !== "approved"
  const isPoaExpired = userId && onboardingStatus?.kyc?.poa_status !== "approved"
  const { hideAlert, showAlert } = useAlertDialog()
  const { t } = useTranslations()
  const { track } = useTrackers()

  const createAd = () => {
    if (route === "markets") track("ek_create_ad_markets")
    if (userId && verificationStatus?.phone_verified && !isPoiExpired && !isPoaExpired) {
      const operation = adType === "buy" ? "sell" : "buy"
      router.push(`/ads/create?operation=${operation}`)
    } else {
      let title = t("profile.gettingStarted")

      if (isPoiExpired && isPoaExpired) title = t("profile.verificationExpired")
      else if (isPoiExpired) title = t("profile.identityVerificationExpired")
      else if (isPoaExpired) title = t("profile.addressVerificationExpired")

      showAlert({
        title,
        description: (
          <div className="space-y-4 my-2">
            <KycOnboardingSheet route={route || "ads"} onClose={hideAlert} />
          </div>
        ),
        confirmText: undefined,
        cancelText: undefined,
      })
    }
  }

  const browseMarket = () => {
    router.push("/")
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-8 text-center px-3 md:px-0 justify-self-center", className)}>
      <Image src={icon || "/icons/search-icon.svg"} alt="No ads found" width={88} height={88} />
      {title && <p className="text-base text-slate-1200 mt-2 mb-1 font-bold whitespace-pre-wrap wrap-anywhere">{title}</p>}
      {description && <p className="text-base font-normal text-grayscale-600">{description}</p>}
      <div className="flex w-full gap-2 justify-center flex-wrap-reverse mt-4">
        {redirectToMarket && (
          <Button onClick={browseMarket} className={cn("basis-auto shrink", redirectToMarket && redirectToAds && "grow")} variant="outline">
            {t("market.browseMarket")}
          </Button>
        )}
        {redirectToAds && (
          <Button onClick={createAd} className={cn("basis-auto shrink", redirectToMarket && redirectToAds && "grow")}>
            {t("myAds.createAd")}
          </Button>
        )}
      </div>
      {onAddPaymentMethod && (
        <Button onClick={onAddPaymentMethod} className="mt-4">
          {t("profile.addPaymentMethod")}
        </Button>
      )}
    </div>
  )
}
