"use client"

import type React from "react"

import type { ReactElement } from "react"
import { useCallback, useState, useMemo, cloneElement, useRef, useEffect } from "react"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import EmptyState from "@/components/empty-state"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"

export interface PaymentMethod {
  display_name: string
  type: string
  method: string
}

interface PaymentMethodsFilterProps {
  paymentMethods: PaymentMethod[]
  selectedMethods: string[]
  onSelectionChange: (selectedMethods: string[]) => void
  isLoading?: boolean
  trigger: ReactElement
  onOpenChange?: (isOpen: boolean) => void
}

export default function PaymentMethodsFilter({
  paymentMethods,
  selectedMethods,
  onSelectionChange,
  isLoading = false,
  trigger,
  onOpenChange: onOpenChangeProp,
}: PaymentMethodsFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [tempSelectedMethods, setTempSelectedMethods] = useState<string[]>(selectedMethods)
  const isMobile = useIsMobile()
  const { t } = useTranslations()
  const { track } = useTrackers()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef<number | null>(null)

  const filteredPaymentMethods = useMemo(() => {
    if (!searchQuery.trim()) return paymentMethods

    return paymentMethods.filter(
      (method) =>
        method.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        method.method.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [paymentMethods, searchQuery])

  const groupedMethods = useMemo(() => {
    return filteredPaymentMethods.reduce(
      (acc, method) => {
        const { type } = method
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(method)
        return acc
      },
      {} as Record<string, PaymentMethod[]>,
    )
  }, [filteredPaymentMethods])

  const isAllSelected =
    paymentMethods.length > 0 &&
    paymentMethods.every((method) => tempSelectedMethods.includes(method.method))

  const isIndeterminate =
    paymentMethods.some((method) => tempSelectedMethods.includes(method.method)) && !isAllSelected

  const handleSelectAll = (checked: boolean) => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop
    }

    if (checked) {
      track("ek_select_all_payment_methods_markets_payment_method_filter")
      const newSelection = [...new Set([...tempSelectedMethods, ...paymentMethods.map((m) => m.method)])]
      setTempSelectedMethods(newSelection)
    } else {
      const allMethodIds = paymentMethods.map((method) => method.method)
      const newSelection = tempSelectedMethods.filter((id) => !allMethodIds.includes(id))
      setTempSelectedMethods(newSelection)
    }
  }

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }, [])

  const handleMethodToggle = (methodId: string) => {
    track("ek_select_payment_method_markets_payment_method_filter", { payment_method_name: methodId })
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop
    }

    if (isAllSelected) {
      setTempSelectedMethods([methodId])
      return
    }
    const isSelected = tempSelectedMethods.includes(methodId)
    if (isSelected) {
      setTempSelectedMethods(tempSelectedMethods.filter((id) => id !== methodId))
    } else {
      setTempSelectedMethods([...tempSelectedMethods, methodId])
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChangeProp?.(open)
    if (!open) {
      setSearchQuery("")
    } else {
      setTempSelectedMethods(selectedMethods)
    }
  }

  const handleReset = () => {
    track("ek_reset_filter_markets_payment_method_filter")
    const allMethodIds = paymentMethods.map((method) => method.method)
    setTempSelectedMethods(allMethodIds)
    onSelectionChange(allMethodIds)
    setIsOpen(false)
    onOpenChangeProp?.(false)
    setSearchQuery("")
  }

  const handleApply = () => {
    track("ek_apply_filter_markets_payment_method_filter")
    onSelectionChange(tempSelectedMethods)
    setIsOpen(false)
    onOpenChangeProp?.(false)
    setSearchQuery("")
  }

  const getGroupTitle = (type: string) => {
    if (type === "bank") return t("paymentMethod.bankTransfers")
    if (type === "ewallet") return t("paymentMethod.eWallets")
    return type?.charAt(0).toUpperCase() + type?.slice(1)
  }

  const renderPaymentMethodGroups = () => {
    if (Object.keys(groupedMethods).length === 0) {
      return null
    }

    return Object.entries(groupedMethods)
      .sort(([typeA], [typeB]) => typeA.localeCompare(typeB))
      .map(([type, methods]) => (
        <div key={type} className="space-y-3 border-t py-2">
          <h4 className="text-grayscale-text-muted text-sm">{getGroupTitle(type)}</h4>
          <div className="flex flex-col gap-3">
            {methods.map((method) => (
              <div key={method.method} className="flex items-center space-x-3">
                <Checkbox
                  id={method.method}
                  checked={isAllSelected ? false : tempSelectedMethods.includes(method.method)}
                  onCheckedChange={() => handleMethodToggle(method.method)}
                  className="data-[state=checked]:bg-black "
                  disabled={isLoading}
                />
                <label htmlFor={method.method} className="text-sm text-grayscale-600 cursor-pointer flex-1">
                  {method.display_name}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))
  }

  const FilterContent = () => (
    <div className="w-full">
      <div className="relative mb-4">
        <Image
          src="/icons/search-icon-custom.png"
          alt="Search"
          width={24}
          height={24}
          className="absolute left-3 top-1/2 transform -translate-y-1/2"
        />
        <Input
          placeholder={t("paymentMethod.search")}
          value={searchQuery}
          onChange={handleSearchChange}
          className="text-sm font-normal placeholder:text-grayscale-text-placeholder pl-10 pr-10 h-14 md:h-8 border-0 focus:border-0 bg-grayscale-500 rounded-lg"
          autoComplete="off"
          autoFocus
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 hover:bg-transparent"
          >
            <Image src="/icons/clear-search-icon.png" alt="Clear search" width={24} height={24} />
          </Button>
        )}
      </div>

      <div ref={scrollContainerRef} className="space-y-2 max-h-60 overflow-y-auto scrollbar-custom">
        {filteredPaymentMethods.length > 0 && (
          <div className="flex items-center space-x-3 mb-4">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate
              }}
              onCheckedChange={handleSelectAll}
              className="data-[state=checked]:bg-black "
              disabled={isLoading || filteredPaymentMethods.length === 0}
            />
            <label htmlFor="select-all" className="text-sm text-slate-1200 cursor-pointer">
              {t("paymentMethod.allPaymentMethod")}
            </label>
          </div>
        )}
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">{t("paymentMethod.loadingPaymentMethods")}</div>
        ) : filteredPaymentMethods.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            {searchQuery ? (
              <EmptyState
                title={t("paymentMethod.paymentMethodUnavailable")}
                description={t("paymentMethod.searchDifferent")}
                redirectToAds={false}
              />
            ) : (
              t("paymentMethod.noPaymentMethodsAvailable")
            )}
          </div>
        ) : (
          renderPaymentMethodGroups()
        )}
      </div>

      {filteredPaymentMethods.length > 0 && (
        <div className="flex flex-col-reverse md:flex-row gap-3 mt-4">
          <Button
            onClick={handleReset}
            className="flex-1 bg-transparent"
            variant="outline"
            size={isMobile ? "default" : "sm"}
          >
            {t("paymentMethod.reset")}
          </Button>
          <Button onClick={handleApply} className="flex-1" size={isMobile ? "default" : "sm"}>
            {t("paymentMethod.apply")}
          </Button>
        </div>
      )}
    </div>
  )

  useEffect(() => {
    if (!scrollContainerRef.current) return
    if (scrollPositionRef.current === null) return

    scrollContainerRef.current.scrollTop = scrollPositionRef.current
    scrollPositionRef.current = null
  }, [tempSelectedMethods])

  const enhancedTrigger = cloneElement(trigger, {
    className: cn(trigger.props.className, isOpen && "[&_img[alt='Arrow']]:rotate-180"),
  })

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{enhancedTrigger}</DrawerTrigger>
        <DrawerContent side="bottom" className="h-fit p-4 rounded-t-2xl">
          <div className="my-4">
            <h3 className="text-xl font-bold text-center">{t("paymentMethod.title")}</h3>
          </div>
          <FilterContent />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{enhancedTrigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <FilterContent />
      </PopoverContent>
    </Popover>
  )
}
