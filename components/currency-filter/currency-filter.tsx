"use client"

import type React from "react"

import { useState, useMemo, useCallback, cloneElement } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn, currencyFlagMapper } from "@/lib/utils"
import type { CurrencyFilterProps } from "./types"
import EmptyState from "@/components/empty-state"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"

export function CurrencyFilter({
  contentClassName,
  currencies,
  isTitleVisible = true,
  selectedCurrency,
  onCurrencySelect,
  title,
  trigger,
  placeholder = "Search",
}: CurrencyFilterProps) {
  const { t } = useTranslations()
  const { track } = useTrackers()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const isMobile = useIsMobile()

  const filteredCurrencies = useMemo(() => {
    let filtered = currencies

    if (searchQuery.trim()) {
      const query = searchQuery?.toLowerCase().trim()
      filtered = filtered.filter((currency) => {
        const codeMatch = currency?.code?.toLowerCase().includes(query)
        const nameMatch = currency?.name?.toLowerCase().includes(query)
        const wordMatch = currency?.name
          ?.toLowerCase()
          .split(" ")
          .some((word) => word.startsWith(query))
        return codeMatch || nameMatch || wordMatch
      })
    }
    const selectedCurrencyItem = filtered.find((currency) => currency.code === selectedCurrency)
    const unselectedCurrencies = filtered.filter((currency) => currency.code !== selectedCurrency)

    unselectedCurrencies.sort((a, b) => a.code.localeCompare(b.code))

    return selectedCurrencyItem ? [selectedCurrencyItem, ...unselectedCurrencies] : unselectedCurrencies
  }, [currencies, searchQuery, selectedCurrency])

  const handleCurrencySelect = useCallback(
    (currencyCode: string) => {
      track("ek_select_payment_currency_markets_payment_currency", { currency_code: currencyCode })
      onCurrencySelect(currencyCode)
      setIsOpen(false)
      setSearchQuery("")
    },
    [onCurrencySelect, track],
  )

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setSearchQuery("")
    }
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
      setSearchQuery("")
    }
  }, [])

  const CurrencyList = () => (
    <div className="w-full h-full">
      <div className="relative mb-6 md:mb-0 md:pr-6">
        <Image
          src="/icons/search-icon-custom.png"
          alt="Search"
          width={24}
          height={24}
          className="absolute left-3 top-1/2 transform -translate-y-1/2"
        />
        <Input
          placeholder={placeholder === "Search" ? t("common.search") : placeholder}
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          className="text-base h-14 pl-10 bg-black/[0.04] border-0 focus:border-0 focus:ring-0 rounded-lg placeholder:text-black/[0.24] placeholder:text-sm placeholder:font-normal"
          autoComplete="off"
          autoFocus
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="absolute right-0  md:right-4 top-1/2 transform -translate-y-1/2 hover:bg-transparent"
          >
            <Image src="/icons/clear-search-icon.png" alt="Clear search" width={24} height={24} />
          </Button>
        )}
      </div>

      <div className="max-h-[80%] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:pr-2 md:mr-2 md:relative md:left-[-16px] md:w-[calc(100%+24px)]">
        {filteredCurrencies.length === 0 ? (
          <EmptyState
            title={t("filter.currencyUnavailable", { currency: searchQuery })}
            description={t("filter.selectAnotherCurrency")}
            redirectToAds={false}
          />
        ) : (
          <div className="space-y-0 md:pr-2">
            {!isMobile && <div className="text-sm text-black/[0.48] font-normal pt-4 pb-2 md:ml-4">{isTitleVisible && title}</div>}
            {filteredCurrencies.map((currency) => (
              <div
                key={currency.code}
                onClick={() => handleCurrencySelect(currency.code)}
                className={cn(
                  "px-4 h-12 flex items-center gap-2 rounded-sm cursor-pointer transition-colors text-base font-normal",
                  selectedCurrency === currency.code ? "bg-black text-white" : "text-black/[0.72] hover:bg-gray-50",
                )}
              >
                {currencyFlagMapper[currency.code as keyof typeof currencyFlagMapper] && (
                  <Image
                    src={
                      currencyFlagMapper[currency.code as keyof typeof currencyFlagMapper] || "/placeholder.svg"
                    }
                    alt={`${currency.code} logo`}
                    width={24}
                    height={16}
                    className="object-cover"
                  />
                )}
                <span>{currency.code} - {currency.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const enhancedTrigger = cloneElement(trigger, {
    className: cn(trigger.props.className, isOpen && "[&_img[alt='Arrow']]:rotate-180"),
  })

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{enhancedTrigger}</DrawerTrigger>
        <DrawerContent side="bottom" className="h-[90vh] px-[16px] pb-[16px] rounded-t-2xl">
          <div className="my-4">
            <h3 className="text-xl font-extrabold text-center text-slate-1200">{title}</h3>
          </div>
          <CurrencyList />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{enhancedTrigger}</PopoverTrigger>
      <PopoverContent className={cn("w-80 h-80 p-4 md:pl-6 md:pt-4 md:pr-0 md:pb-0", contentClassName)} align="end" side="bottom" avoidCollisions={false}>
        <CurrencyList />
      </PopoverContent>
    </Popover>
  )
}
