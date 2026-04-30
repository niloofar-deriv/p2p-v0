"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useUserDataStore } from "@/stores/user-data-store"
import { NovuNotifications } from "./novu-notifications"
import { MobileSidebarTrigger } from "./mobile-sidebar-wrapper"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useChatVisibilityStore } from "@/stores/chat-visibility-store"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTrackers } from "@/analytics/useTrackers"

export default function Header() {
  const userId = useUserDataStore((state) => state.userId)
  const { t } = useTranslations()
  const { track } = useTrackers()
  const isMobile = useIsMobile()
  const { isChatVisible } = useChatVisibilityStore()

  const pathname = usePathname()
  const navItems = [
    { name: t("navigation.market"), href: "/" },
    { name: t("navigation.orders"), href: "/orders" },
    { name: t("navigation.myAds"), href: "/ads" },
    { name: t("navigation.wallet"), href: "/wallet" },
    { name: t("navigation.profile"), href: "/profile" },
  ]

  // Hide header on advertiser page, order detail page, and when viewing chat on mobile
  const isOrderDetailPage = pathname.match(/^\/orders\/[^/]+$/)
  if (pathname.startsWith("/advertiser") || isOrderDetailPage || (isMobile && isOrderDetailPage && isChatVisible)) return null

  return (
    <header className="flex justify-between items-center px-6 md:px-[24px] py-4 md:py-3 bg-slate-1200 -mb-px md:mb-0 h-14 md:h-auto">
      <div className="md:hidden">
        <MobileSidebarTrigger />
      </div>

      <div className="hidden md:block">
        <nav className="flex h-12 border-b border-slate-200">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/advertiser")
                : pathname.startsWith(item.href)

            return (
              <Link
                prefetch
                key={item.name}
                href={item.href}
                className={cn(
                  "inline-flex h-12 items-center border-b-2 px-4 text-sm",
                  isActive
                    ? "text-slate-1400 border-primary font-bold"
                    : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-700",
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="h-12 flex items-center space-x-4">
        {userId && (
          <div className="text-slate-600 hover:text-slate-700" onClick={() => track("ek_notifications_markets")}>
            <NovuNotifications />
          </div>
        )}
      </div>
    </header>
  )
}
