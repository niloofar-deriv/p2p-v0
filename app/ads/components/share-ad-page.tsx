"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import QRCode from "qrcode"
import * as htmlToImage from "html-to-image"
import type { Ad } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"

interface ShareAdPageProps {
  ad: Ad
  onClose: () => void
}

export default function ShareAdPage({ ad, onClose }: ShareAdPageProps) {
  const { t } = useTranslations()
  const { track } = useTrackers()
  const { toast } = useToast()
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setIsLoading(true)
        const advertiserId = ad.user?.id
        const adUrl = `${window.location.origin}/advertiser/${advertiserId}?adId=${ad.id}`
        const qrCode = await QRCode.toDataURL(adUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })
        setQrCodeUrl(qrCode)
      } catch (error) {
        toast({
          description: t("shareAdPage.failedToGenerateQR"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    generateQRCode()
  }, [ad.id, toast, t])

  const handleShare = async (platform: string) => {
    track("ek_share_methods_share_ad", { method_name: platform })
    const advertiserId = ad.user?.id
    const adUrl = `${window.location.origin}/advertiser/${advertiserId}?adId=${ad.id}`
    const text = t("shareAdPage.shareMessage", {
      currency: ad?.account_currency,
      rate: ad?.rate.value,
      url: adUrl,
    })
    const telegramText = t("shareAdPage.shareTelegramMessage", {
      currency: ad?.account_currency,
      rate: ad?.rate.value,
    })

    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${adUrl}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(adUrl)}&text=${encodeURIComponent(telegramText)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      gmail: `https://mail.google.com/mail/?view=cm&fs=1&body=${encodeURIComponent(`${text}`)}`,
    }

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank")
    }
  }

  const handleCopyLink = async () => {
    const advertiserId = ad.user?.id
    const adUrl = `${window.location.origin}/advertiser/${advertiserId}?adId=${ad.id}`
    try {
      await navigator.clipboard.writeText(adUrl)
      toast({
        description: (
          <div className="flex items-center gap-2">
            <Image src="/icons/tick.svg" alt="Success" width={24} height={24} />
            <span>{t("shareAdPage.adLinkCopied")}</span>
          </div>
        ),
        className: "bg-black text-white border-black h-[48px] rounded-lg px-[16px] py-[8px]",
        duration: 2500,
      })
    } catch (error) {
      toast({
        description: t("shareAdPage.failedToCopyLink"),
        variant: "destructive",
      })
    }
  }

  const handleSaveImage = async () => {
    if (!cardRef.current) return
    track("ek_save_image_share_ad")

    try {
      await waitForImages(cardRef.current)

      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })

      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `deriv-p2p-ad-${ad.id}.png`

      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      track("ek_image_saved_share_ad")

      setTimeout(() => {
        document.body.removeChild(link)
      }, 100)

      if (!isMobile) {
        toast({
          description: (
            <div className="flex items-center gap-2">
              <Image src="/icons/tick.svg" alt="Success" width={24} height={24} />
              <span>{t("shareAdPage.imageSavedSuccessfully")}</span>
            </div>
          ),
          className: "bg-black text-white border-black h-[48px] rounded-lg px-[16px] py-[8px]",
          duration: 2500,
        })
      }
    } catch (error) {
      if (!isMobile) {
        toast({
          description: t("shareAdPage.failedToSaveImage"),
          variant: "destructive",
        })
      }
    }
  }

  const waitForImages = (element: HTMLElement) => {
    return Promise.all(
      Array.from(element.querySelectorAll("img")).map((img) => {
        if (img.complete) return Promise.resolve()
        return new Promise<void>((resolve) => {
          img.onload = img.onerror = () => resolve()
        })
      }),
    )
  }

  const handleShareImage = async () => {
    if (!cardRef.current) return
    track("ek_share_image_share_ad")

    await new Promise((r) => setTimeout(r, 300))
    await waitForImages(cardRef.current)

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: isMobile ? 2 : 3,
        backgroundColor: "#ffffff",
      })

      const response = await fetch(dataUrl)
      const blob = await response.blob()

      const file = new File([blob], `deriv-p2p-ad-${ad.id}.png`, {
        type: "image/png",
        lastModified: Date.now(),
      })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "",
          files: [file],
        })
        track("ek_image_shared_share_ad")
        toast({ description: t("shareAdPage.sharedSuccessfully") })
        return
      }

      await handleSaveImage()
    } catch (error) {
      console.log(error)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent"></div>
        <p className="mt-2 text-slate-600">{t("myAds.loadingAds")}</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex flex-col h-full max-w-xl mx-auto">
        <div className="flex items-center justify-end py-[12px] px-4 md:p-6 md:pb-4">
          <Button onClick={() => { track("ek_close_share_ad"); onClose() }} variant="ghost" size="sm" className="bg-grayscale-300 px-1">
            <Image src="/icons/close-icon.png" alt="Close" width={24} height={24} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto pb-32 md:pb-0">
          <h2 className="text-[24px] font-bold px-4 md:px-0">{t("shareAdPage.shareAdTitle")}</h2>
          <div className="flex items-center flex-col py-6 space-y-6 px-4 md:px-0">
            <div
              ref={cardRef}
              className="w-full md:w-[358px] bg-[linear-gradient(172deg,_#f4434f_73%,_rgba(0,0,0,0.04)_27%)] py-4 md:py-6 px-6 md:px-8 text-white"
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Image src="/icons/p2p-logo-white.svg" alt="Deriv P2P" />
                </div>
                <div className="text-lg font-bold">
                  {ad.type === "buy" ? t("common.sell") : t("common.buy")} {ad.account_currency}
                </div>
              </div>

              <div className="space-y-1 mb-4">
                <div className="grid grid-cols-[85px_auto]">
                  <span className="text-sm">{t("shareAdPage.idNumber")}</span>
                  <span className="font-bold text-sm">{ad.id}</span>
                </div>
                <div className="grid grid-cols-[85px_auto]">
                  <span className="text-sm">{t("shareAdPage.limits")}</span>
                  <span className="font-bold text-sm">
                    {ad.limits.min} - {ad.limits.max} {ad.limits.currency}
                  </span>
                </div>
                <div className="grid grid-cols-[85px_auto]">
                  <span className="text-sm">{t("shareAdPage.rate")}</span>
                  <span className="font-bold text-sm">
                    {ad.exchange_rate_type === "float"
                      ? `${ad.exchange_rate > 0 ? "+" : ""}${ad.exchange_rate}%`
                      : ad.rate.value}
                  </span>
                </div>
              </div>

              {qrCodeUrl && (
                <>
                  <div className="bg-white rounded-lg p-2 flex flex-col items-center w-fit mx-auto">
                    <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code" width={110} height={110} />
                  </div>
                  <p className="text-grayscale-text-muted text-xs mt-3 text-center">{t("shareAdPage.qrCodeDescription")}</p>
                </>
              )}
            </div>
            {!isMobile && (
              <div className="flex gap-6">
                <Button
                  variant="ghost"
                  onClick={() => handleShare("whatsapp")}
                  className="flex flex-col items-center gap-2 rounded-lg transition-colors min-w-fit min-h-fit p-0 hover:bg-transparent"
                >
                  <div className="bg-[#F2F3F4] p-2 rounded-full flex items-center justify-center">
                    <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={36} height={36} />
                  </div>
                  <span className="text-[10px] font-normal text-slate-1600">WhatsApp</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => handleShare("facebook")}
                  className="flex flex-col items-center gap-2 rounded-lg transition-colors min-w-fit min-h-fit p-0 hover:bg-transparent"
                >
                  <div className="bg-[#F2F3F4] p-2 rounded-full flex items-center justify-center">
                    <Image src="/icons/facebook.svg" alt="Facebook" width={36} height={36} />
                  </div>
                  <span className="text-[10px] font-normal text-slate-1600">Facebook</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => handleShare("telegram")}
                  className="flex flex-col items-center gap-2 rounded-lg transition-colors min-w-fit min-h-fit p-0 hover:bg-transparent"
                >
                  <div className="bg-[#F2F3F4] p-2 rounded-full flex items-center justify-center">
                    <Image src="/icons/telegram.svg" alt="Telegram" width={36} height={36} />
                  </div>
                  <span className="text-[10px] font-normal text-slate-1600">Telegram</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => handleShare("gmail")}
                  className="flex flex-col items-center gap-2 rounded-lg transition-colors min-w-fit min-h-fit p-0 hover:bg-transparent"
                >
                  <div className="bg-[#F2F3F4] p-2 rounded-full flex items-center justify-center">
                    <Image src="/icons/google.svg" alt="Gmail" width={36} height={36} />
                  </div>
                  <span className="text-[10px] font-normal text-slate-1600">Gmail</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-2 rounded-lg transition-colors min-w-fit min-h-fit p-0 hover:bg-transparent"
                >
                  <div className="bg-[#F2F3F4] p-2 rounded-full flex items-center justify-center">
                    <Image src="/icons/link.svg" alt="link" width={36} height={36} />
                  </div>
                  <span className="text-[10px] font-normal text-slate-1600">{t("shareAdPage.copyLink")}</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSaveImage}
                  className="flex flex-col items-center gap-2 rounded-lg transition-colors min-w-fit min-h-fit p-0 hover:bg-transparent"
                >
                  <div className="bg-[#F2F3F4] p-2 rounded-full flex items-center justify-center">
                    <Image src="/icons/download.svg" alt="download" width={36} height={36} />
                  </div>
                  <span className="text-[10px] font-normal text-slate-1600">{t("shareAdPage.saveImage")}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 p-4 flex flex-col gap-2 max-w-xl mx-auto">
            <Button onClick={handleShareImage}>{t("shareAdPage.shareImage")}</Button>
            <Button variant="outline" onClick={handleSaveImage}>
              {t("shareAdPage.saveImage")}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
