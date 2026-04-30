"use client"
import Image from "next/image"
import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  fetchWalletsList,
  walletTransfer,
  fetchExchangeRate,
  walletExchangeTransfer,
  fetchTransactionByReferenceId,
} from "@/services/api/api-wallets"
import { currencyLogoMapper, formatAmountWithDecimals } from "@/lib/utils"
import { useCurrencies } from "@/hooks/use-api-queries"
import WalletDisplay from "./wallet-display"
import ChooseCurrencyStep from "./choose-currency-step"
import TransactionDetails from "./transaction-details"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"

interface TransferProps {
  currencySelected?: string
  onClose: () => void
  stepVal: string
}

interface Currency {
  code: string
  name: string
  logo: string
  label: string
}

interface ProcessedWallet {
  wallet_id: string
  name: string
  balance: string
  currency: string
  icon: string
  type: string
}

interface WalletData {
  id: string
  name: string
  currency: string
  balance: string
}

interface Transaction {
  transaction_id: number
  timestamp: string
  metadata: {
    brand_name: string
    description: string
    destination_client_id: string
    destination_wallet_id: string
    destination_wallet_type: string
    is_reversible: string
    payout_method: string
    requester_platform: string
    source_client_id: string
    source_wallet_id: string
    source_wallet_type: string
    transaction_currency: string
    transaction_gross_amount: string
    transaction_net_amount: string
    transaction_status: string
    wallet_transaction_type: string
    external_reference_id?: string
  }
}

interface CurrencyData {
  type: "cryptocurrency" | "fiat" | "stablecoin"
  fee: {
    transfer: {
      crypto_percentage: number
      fiat_percentage: number
      stablecoin_percentage: number
    }
  }
  label: string
  decimal: {
    maximum: number
    minimum: number
  }
  limit: {
    transfer: {
      min_amount_per_transaction?: number
    }
  }
  [key: string]: any
}

interface CurrenciesResponse {
  data: {
    [currencyCode: string]: CurrencyData
  }
}

interface ExchangeRateData {
  source: string
  destination: string
  display_rate: string
  rate_token: string
  exchange_rate: string
}

interface TransferFeeCalculation {
  transferAmount: number
  transferFee: number
  youllReceive: number
  youllReceiveConverted: number
  feePercentage: number
}

type TransferStep = "chooseCurrency" | "enterAmount" | "success" | "unsuccessful"
type WalletSelectorType = "from" | "to" | null
type CurrencyToggleType = "source" | "destination"

export default function Transfer({ currencySelected, onClose, stepVal = "enterAmount" }: TransferProps) {
  const { t } = useTranslations()
  const { track } = useTrackers()
  const { data: currenciesResponse, isLoading: isCurrenciesLoading } = useCurrencies()

  const [step, setStep] = useState<TransferStep>(stepVal)
  const [wallets, setWallets] = useState<ProcessedWallet[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [currenciesData, setCurrenciesData] = useState<CurrenciesResponse | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(currencySelected || "USD")
  const [showMobileSheet, setShowMobileSheet] = useState<WalletSelectorType>(null)
  const [showDesktopWalletPopup, setShowDesktopWalletPopup] = useState<WalletSelectorType>(null)
  const [showMobileConfirmSheet, setShowMobileConfirmSheet] = useState(false)
  const [showDesktopConfirmPopup, setShowDesktopConfirmPopup] = useState(false)
  const [transferAmount, setTransferAmount] = useState<string | null>(null)
  const [sourceWalletData, setSourceWalletData] = useState<WalletData | null>(null)
  const [destinationWalletData, setDestinationWalletData] = useState<WalletData | null>(null)

  const [externalReferenceId, setExternalReferenceId] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [transferErrorMessage, setTransferErrorMessage] = useState<string | null>(null)

  const [exchangeRateData, setExchangeRateData] = useState<ExchangeRateData | null>(null)
  const [selectedAmountCurrency, setSelectedAmountCurrency] = useState<"source" | "destination">("source")
  const [countdown, setCountdown] = useState<number>(30)
  const [transferFeeCalculation, setTransferFeeCalculation] = useState<TransferFeeCalculation | null>(null)
  const [showCurrencySwitcher, setShowCurrencySwitcher] = useState(false)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [sourceMinAmount, setSourceMinAmount] = useState<number>(0)
  const [destinationMinAmount, setDestinationMinAmount] = useState<number>(0)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const toEnterAmount = () => setStep("enterAmount")
  const toConfirm = () => {
    if (window.innerWidth >= 768) {
      setShowDesktopConfirmPopup(true)
    } else {
      setShowMobileConfirmSheet(true)
    }
  }
  const toSuccess = () => setStep("success")
  const toUnsuccessful = () => setStep("unsuccessful")
  const goBack = () => {
    if (step === "enterAmount") setStep("chooseCurrency")
    else if (step === "chooseCurrency") onClose()
  }

  const handleCurrencySelect = (currency: string) => {
    setDestinationWalletData(null)
    if (sourceWalletData) {
      setSourceWalletData({
        id: sourceWalletData.id,
        name: sourceWalletData.name,
        currency: currency,
        balance: sourceWalletData.balance,
      })
    }
    setSelectedCurrency(currency)
    toEnterAmount()
  }

  useEffect(() => {
    if (!currenciesResponse?.data) return

    const currencyList = Object.entries(currenciesResponse.data).map(([code, data]: [string, any]) => ({
      code,
      name: data.label,
      logo: currencyLogoMapper[code as keyof typeof currencyLogoMapper],
      label: data.label,
    }))
    setCurrencies(currencyList)
    setCurrenciesData(currenciesResponse as CurrenciesResponse)
  }, [currenciesResponse])

  useEffect(() => {
    if (!selectedCurrency) return

    const loadWallets = async () => {
      try {
        const response = await fetchWalletsList()

        if (response?.data?.wallets) {
          const processedWallets: ProcessedWallet[] = []

          response.data.wallets.forEach((wallet: any) => {
            if (!wallet.balances || wallet.balances.length === 0) {
              // Handle USD wallets with no balances
              const currencyLabel = currenciesData?.data["USD"]?.label || "USD"
              const walletName =
                (wallet.type || "").toLowerCase() === "p2p" ? `P2P ${currencyLabel}` : currencyLabel

              processedWallets.push({
                wallet_id: wallet.wallet_id,
                name: walletName,
                balance: "0",
                currency: "USD",
                icon: currencyLogoMapper["USD"],
                type: wallet.type,
              })
            } else {
              wallet.balances.forEach((balance: any) => {
                if ((wallet.type || "").toLowerCase() === "p2p" && balance.currency !== "USD") {
                  return
                }

                const currencyLabel = currenciesData?.data[balance.currency]?.label || balance.currency

                const walletName = (wallet.type || "").toLowerCase() === "p2p" ? `P2P ${currencyLabel}` : currencyLabel

                if (balance.currency === "USD") {
                  processedWallets.push({
                    wallet_id: wallet.wallet_id,
                    name: walletName,
                    balance: balance.balance,
                    currency: balance.currency,
                    icon: "/icons/p2p-black.png",
                    type: wallet.type,
                  })
                }
              })
            }
          })

          setWallets(processedWallets)

          const p2pWallet = processedWallets.find((w) => w.type?.toLowerCase() === "p2p")

          if (p2pWallet) {
            setSourceWalletData({
              id: p2pWallet.wallet_id,
              name: p2pWallet.name,
              currency: p2pWallet.currency,
              balance: p2pWallet.balance,
            })
          }
        }
      } catch (error) {
        console.error("Error fetching wallets:", error)
      }
    }

    loadWallets()
  }, [selectedCurrency])

  const calculateTransferFee = useCallback((): { feeAmount: number; feePercentage: number } | null => {
    if (!currenciesData || !sourceWalletData || !destinationWalletData || !transferAmount) {
      return null
    }

    if (sourceWalletData.currency === destinationWalletData.currency) {
      return null
    }

    const sourceCurrencyData = currenciesData.data[sourceWalletData.currency]
    const destinationCurrencyData = currenciesData.data[destinationWalletData.currency]

    if (!sourceCurrencyData || !destinationCurrencyData) {
      return null
    }

    const sourceType = sourceCurrencyData.type
    let feePercentage = 0

    if (sourceType === "cryptocurrency") {
      feePercentage = destinationCurrencyData.fee.transfer.crypto_percentage
    } else if (sourceType === "fiat") {
      feePercentage = destinationCurrencyData.fee.transfer.fiat_percentage
    } else if (sourceType === "stablecoin") {
      feePercentage = destinationCurrencyData.fee.transfer.stablecoin_percentage
    }

    if (feePercentage === 0) {
      return null
    }

    const amount = Number.parseFloat(transferAmount)
    const feeAmount = (amount * feePercentage) / 100

    return { feeAmount, feePercentage }
  }, [currenciesData, sourceWalletData, destinationWalletData, transferAmount])

  const calculateTransferFeeWithExchangeRate = useCallback((): TransferFeeCalculation | null => {
    if (!currenciesData || !sourceWalletData || !destinationWalletData || !transferAmount || !exchangeRateData) {
      return null
    }

    const feeInfo = calculateTransferFee()
    if (!feeInfo) return null

    const amount = Number.parseFloat(transferAmount)
    const exchangeRate = Number.parseFloat(exchangeRateData.exchange_rate)
    const fee = feeInfo.feePercentage

    let calculation: TransferFeeCalculation

    if (selectedAmountCurrency === "source") {
      const transferFee = amount * (fee / 100)

      const youllReceiveConverted = amount * (1 - fee / 100)
      const youllReceive = youllReceiveConverted * exchangeRate

      calculation = {
        transferAmount: amount,
        transferFee,
        youllReceive,
        youllReceiveConverted,
        feePercentage: fee,
      }
    } else {
      const transferFee = (amount / exchangeRate) * (fee / 100)
      const youllReceive = amount * (1 - fee / 100)
      const youllReceiveConverted = amount / exchangeRate - (amount / exchangeRate) * (fee / 100)

      calculation = {
        transferAmount: amount,
        transferFee,
        youllReceive,
        youllReceiveConverted,
        feePercentage: fee,
      }
    }

    return calculation
  }, [
    currenciesData,
    sourceWalletData,
    destinationWalletData,
    transferAmount,
    exchangeRateData,
    selectedAmountCurrency,
  ])

  const fetchAndSetExchangeRate = useCallback(async () => {
    if (!sourceWalletData || !destinationWalletData) return
    if (sourceWalletData.currency === destinationWalletData.currency) {
      setExchangeRateData(null)
      return
    }

    const feeInfo = calculateTransferFee()
    if (!feeInfo) {
      setExchangeRateData(null)
      return
    }

    try {
      const response = await fetchExchangeRate({
        source_currency: sourceWalletData.currency,
        destination_currency: destinationWalletData.currency,
      })

      if (response?.data) {
        setExchangeRateData(response.data)
        setCountdown(30)

        if (response.data.source === "USD") {
          setSourceMinAmount(1)
          setDestinationMinAmount(Number.parseFloat(response.data.exchange_rate))
        } else if (response.data.destination === "USD") {
          setDestinationMinAmount(1)
          setSourceMinAmount(Number.parseFloat(response.data.exchange_rate))
        }

        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
        }

        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              fetchAndSetExchangeRate()
              return 30
            }
            return prev - 1
          })
        }, 1000)
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error)
    }
  }, [sourceWalletData, destinationWalletData, calculateTransferFee])

  useEffect(() => {
    if (!sourceWalletData || !destinationWalletData || !currenciesData) {
      setShowCurrencySwitcher(false)
      setExchangeRateData(null)
      return
    }

    const sourceCurrencyData = currenciesData.data[sourceWalletData.currency]
    const destinationCurrencyData = currenciesData.data[destinationWalletData.currency]

    if (!sourceCurrencyData || !destinationCurrencyData) {
      setShowCurrencySwitcher(false)
      setExchangeRateData(null)
      return
    }


    if (sourceWalletData.currency === destinationWalletData.currency) {
      setShowCurrencySwitcher(false)
      setExchangeRateData(null)
      return
    }

    const sourceType = sourceCurrencyData.type
    let feePercentage = 0

    if (sourceType === "cryptocurrency") {
      feePercentage = destinationCurrencyData.fee.transfer.crypto_percentage
    } else if (sourceType === "fiat") {
      feePercentage = destinationCurrencyData.fee.transfer.fiat_percentage
    } else if (sourceType === "stablecoin") {
      feePercentage = destinationCurrencyData.fee.transfer.stablecoin_percentage
    }

    const hasFee = feePercentage > 0

    if (hasFee) {
      setShowCurrencySwitcher(true)
      fetchAndSetExchangeRate()
    } else {
      setShowCurrencySwitcher(false)
      setExchangeRateData(null)
    }
  }, [sourceWalletData, destinationWalletData, currenciesData, fetchAndSetExchangeRate])



  useEffect(() => {
    const calculation = calculateTransferFeeWithExchangeRate()
    setTransferFeeCalculation(calculation)
  }, [calculateTransferFeeWithExchangeRate])

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  const handleTransferClick = () => {
    track("ek_transfer_transfer")
    toConfirm()
  }

  const handleConfirmTransfer = async () => {
    if (!transferAmount || !sourceWalletData || !destinationWalletData) {
      console.error("Missing required transfer data")
      return
    }

    track("ek_confirm_transfer_confirm_transfer_sheet")
    setIsSubmitting(true)

    try {
      const generatedRequestId = crypto.randomUUID()
      setRequestId(generatedRequestId)

      const isSameWallet = sourceWalletData.id === destinationWalletData.id

      let result

      if (isSameWallet) {
        if (!exchangeRateData) {
          console.error("Exchange rate data is required for same-wallet transfers")
          setIsSubmitting(false)
          return
        }

        const exchangeParams = {
          amount: transferAmount,
          source_currency: sourceWalletData.currency,
          destination_wallet_id: destinationWalletData.id,
          request_id: generatedRequestId,
          source_wallet_id: sourceWalletData.id,
          destination_currency: destinationWalletData.currency,
          rate_token: exchangeRateData.rate_token,
          exchange_rate: exchangeRateData.exchange_rate,
        }

        result = await walletExchangeTransfer(exchangeParams)
      } else {
        const transferParams = {
          amount: transferAmount,
          currency: selectedCurrency || "USD",
          destination_wallet_id: destinationWalletData.id,
          request_id: generatedRequestId,
          source_wallet_id: sourceWalletData.id,
        }

        result = await walletTransfer(transferParams)
      }

      if (result?.errors && result.errors.length > 0) {
        const errorMessage = result.errors[0]?.message || "An error occurred during the transfer."
        setTransferErrorMessage(errorMessage)
        setShowDesktopConfirmPopup(false)
        setShowMobileConfirmSheet(false)
        track("ek_transfer_failed_confirm_transfer_sheet", { error_code: "transfer_failed", error_message: errorMessage })
        toUnsuccessful()
      } else if (!result?.data?.errors || result.data.errors.length === 0) {
        if (result?.data?.external_reference_id) {
          setExternalReferenceId(result.data.external_reference_id)
        }
        setShowDesktopConfirmPopup(false)
        setShowMobileConfirmSheet(false)
        track("ek_transfer_successful_confirm_transfer_sheet")
        toSuccess()
      } else {
        const errorMessage = result.data.errors[0]?.message || "An error occurred during the transfer."
        setTransferErrorMessage(errorMessage)
        setShowDesktopConfirmPopup(false)
        setShowMobileConfirmSheet(false)
        track("ek_transfer_failed_confirm_transfer_sheet", { error_code: "transfer_failed", error_message: errorMessage })
        toUnsuccessful()
      }
    } catch (error) {
      console.error("Error during transfer:", error)
      const transferErrorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again."
      setTransferErrorMessage("An unexpected error occurred. Please try again.")
      setShowDesktopConfirmPopup(false)
      setShowMobileConfirmSheet(false)
      track("ek_transfer_failed_confirm_transfer_sheet", { error_code: "network_error", error_message: transferErrorMessage })
      toUnsuccessful()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewDetails = async () => {
    if (!requestId) {
      console.error("No request ID available")
      return
    }

    try {
      const response = await fetchTransactionByReferenceId(requestId)

      if (response?.data?.transactions && response.data.transactions.length > 0) {
        const transaction = response.data.transactions[0]
        setSelectedTransaction(transaction)
      } else {
        console.error("Transaction not found with reference_id:", requestId)
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error)
    }
  }

  const handleCloseTransactionDetails = () => {
    setSelectedTransaction(null)
    onClose()
  }

  const handleDoneClick = () => {
    setStep("chooseCurrency")
    setTransferAmount(null)
    setSourceWalletData(null)
    setDestinationWalletData(null)
    setSelectedCurrency(null)
    setExternalReferenceId(null)
    setRequestId(null)

    onClose()
  }

  const handleWalletSelect = (wallet: ProcessedWallet, type: WalletSelectorType) => {
    track("ek_select_wallet_wallet_selector_sheet", { wallet_currency: wallet.currency })
    if (type === "from") {
      setSourceWalletData({
        id: wallet.wallet_id,
        name: wallet.name,
        currency: wallet.currency,
        balance: wallet.balance,
      })
    } else if (type === "to") {
      setDestinationWalletData({
        id: wallet.wallet_id,
        name: wallet.name,
        currency: wallet.currency,
        balance: wallet.balance,
      })
    }

    setTransferAmount("")
    setSelectedAmountCurrency("source")

    setShowMobileSheet(null)
    setShowDesktopWalletPopup(null)
  }

  const handleInterchange = () => {
    track("ek_swap_wallets_transfer")
    const tempSource = sourceWalletData
    setSourceWalletData(destinationWalletData)
    setDestinationWalletData(tempSource)

    setTransferAmount("")
    setSelectedAmountCurrency("source")
  }

  const formatAmountByCurrency = useCallback(
    (amount: number | string, currencyCode: string): string => {
      if (!currenciesData) return formatAmountWithDecimals(amount)

      const currencyData = currenciesData.data[currencyCode]
      if (!currencyData?.decimal?.maximum) return formatAmountWithDecimals(amount)

      const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
      if (isNaN(numAmount)) return "0.00"

      return numAmount.toFixed(currencyData.decimal.maximum)
    },
    [currenciesData],
  )

  const getSourceWalletBalance = (): number => {
    const wallet = wallets.find((w) => w.wallet_id === sourceWalletData?.id)
    return wallet ? Number.parseFloat(wallet.balance) : 0
  }

  const getDecimalPlaces = (value: string): number => {
    const decimalPart = value.split(".")[1]
    return decimalPart ? decimalPart.length : 0
  }

  const getDecimalConstraints = (): { minimum: number; maximum: number } | null => {
    if (!selectedCurrency || !currenciesData) return null
    const currencyData = currenciesData.data[selectedCurrency]
    return currencyData?.decimal || null
  }

  const isAmountValid = (amount: string): boolean => {
    const numAmount = Number.parseFloat(amount)
    const sourceBalance = getSourceWalletBalance()

    if (!isNaN(numAmount) && selectedCurrency && currenciesData) {
      const currencyData = currenciesData.data[selectedCurrency]
      const minAmount = currencyData?.limit?.transfer?.min_amount_per_transaction || 0

      const effectiveMinAmount =
        selectedAmountCurrency === "source"
          ? Math.max(minAmount, sourceMinAmount)
          : Math.max(minAmount, destinationMinAmount)

      return numAmount > 0 && numAmount >= effectiveMinAmount && numAmount <= sourceBalance
    }

    return !isNaN(numAmount) && numAmount > 0 && numAmount <= sourceBalance
  }

  const getAmountErrorMessage = (): string => {
    if (!transferAmount) return ""

    const numAmount = Number.parseFloat(transferAmount)
    const sourceBalance = getSourceWalletBalance()

    const effectiveMinAmount = selectedAmountCurrency === "source" ? sourceMinAmount : destinationMinAmount
    const effectiveCurrency =
      selectedAmountCurrency === "source" ? sourceWalletData?.currency : destinationWalletData?.currency

    if (numAmount < effectiveMinAmount && effectiveMinAmount > 0) {
      return t("wallet.minimumTransfer", {
        amount: formatAmountByCurrency(effectiveMinAmount),
        currency: effectiveCurrency || "",
      })
    }

    const minAmount = getMinimumAmount()
    if (numAmount < minAmount) {
      return t("wallet.minimumTransferAmount", {
        amount: formatAmountWithDecimals(minAmount),
        currency: selectedCurrency || "USD",
      })
    }

    if (numAmount > sourceBalance) {
      return t("wallet.exceedsBalance", {
        amount: formatAmountWithDecimals(sourceBalance.toString()),
        currency: selectedCurrency || "USD",
      })
    }

    return ""
  }

  const getMinimumAmount = (): number => {
    if (!selectedCurrency || !currenciesData) return 0
    const currencyData = currenciesData.data[selectedCurrency]
    return currencyData?.limit?.transfer?.min_amount_per_transaction || 0
  }

  const getSourceWalletAmount = (): string => {
    return sourceWalletData ? `${formatAmountWithDecimals(sourceWalletData.balance)} ${sourceWalletData.currency}` : ""
  }

  const getDestinationWalletAmount = (): string => {
    return destinationWalletData
      ? `${formatAmountWithDecimals(destinationWalletData.balance)} ${destinationWalletData.currency}`
      : ""
  }

  const getFilteredWallets = (type: WalletSelectorType) => {
    if (type === "from" && destinationWalletData) {
      return wallets.filter((w) => w.name !== destinationWalletData.name)
    }

    if (type === "to" && sourceWalletData) {
      return wallets.filter((w) => w.name !== sourceWalletData.name)
    }

    return wallets
  }

  const renderMobileSheet = (type: WalletSelectorType) => {
    if (showMobileSheet !== type) return null

    const title = type === "from" ? t("wallet.from") : t("wallet.to")
    const selectedWalletName = type === "from" ? sourceWalletData?.name : destinationWalletData?.name

    const filteredWallets = getFilteredWallets(type)
    const p2pWallets = filteredWallets.filter((w) => w.type?.toLowerCase() === "p2p")
    const tradingWallets = filteredWallets.filter((w) => w.type?.toLowerCase() !== "p2p")

    return (
      <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileSheet(null)}>
        <div
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            <h2 className="text-slate-1200 text-[20px] font-extrabold mb-6 text-center">{title}</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {p2pWallets.length > 0 && (
                <>
                  <h3 className="text-base font-normal text-slate-1200">{t("wallet.p2pWallet")}</h3>
                  {p2pWallets.map((wallet) => (
                    <div
                      key={wallet.wallet_id}
                      className="cursor-pointer"
                      onClick={() => {
                        handleWalletSelect(wallet, type)
                        setShowMobileSheet(null)
                      }}
                    >
                      <WalletDisplay
                        name={wallet.name}
                        amount={formatAmountWithDecimals(wallet.balance)}
                        currency={wallet.currency}
                        icon={wallet.icon}
                        isSelected={selectedWalletName === wallet.name}
                        onClick={() => { }}
                      />
                    </div>
                  ))}
                </>
              )}
              {tradingWallets.length > 0 && (
                <>
                  <h3 className="text-base font-normal text-slate-1200 mt-2">{t("wallet.tradingWallet")}</h3>
                  {tradingWallets.map((wallet) => (
                    <div
                      key={wallet.wallet_id}
                      className="cursor-pointer"
                      onClick={() => {
                        handleWalletSelect(wallet, type)
                        setShowMobileSheet(null)
                      }}
                    >
                      <WalletDisplay
                        name={wallet.name}
                        amount={formatAmountWithDecimals(wallet.balance)}
                        currency={wallet.currency}
                        icon={wallet.icon}
                        isSelected={selectedWalletName === wallet.name}
                        onClick={() => { }}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderDesktopWalletPopup = (type: WalletSelectorType) => {
    if (showDesktopWalletPopup !== type) return null

    const title = type === "from" ? t("wallet.from") : t("wallet.to")
    const selectedWalletName = type === "from" ? sourceWalletData?.name : destinationWalletData?.name

    const filteredWallets = getFilteredWallets(type)
    const p2pWallets = filteredWallets.filter((w) => w.type?.toLowerCase() === "p2p")
    const tradingWallets = filteredWallets.filter((w) => w.type?.toLowerCase() !== "p2p")

    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 hidden md:flex items-center justify-center"
        onClick={() => setShowDesktopWalletPopup(null)}
      >
        <div
          className="bg-white rounded-[32px] w-[512px] min-w-[512px] max-w-[512px] max-h-[80vh] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="default"
            className="absolute top-4 right-4 min-w-0 px-0"
            onClick={() => setShowDesktopWalletPopup(null)}
            aria-label="Close"
          >
            <Image src="/icons/button-close.png" alt="Close" width={48} height={48} />
          </Button>
          <div className="p-8">
            <h2 className="text-slate-1200 text-[24px] font-extrabold mb-6">{title}</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {p2pWallets.length > 0 && (
                <>
                  <h3 className="text-base font-normal text-slate-1200">{t("wallet.p2pWallet")}</h3>
                  {p2pWallets.map((wallet) => (
                    <div
                      key={wallet.wallet_id}
                      className="cursor-pointer"
                      onClick={() => {
                        handleWalletSelect(wallet, type)
                        setShowDesktopWalletPopup(null)
                      }}
                    >
                      <WalletDisplay
                        name={wallet.name}
                        amount={formatAmountWithDecimals(wallet.balance)}
                        currency={wallet.currency}
                        icon={getCurrencyImage(wallet.name, wallet.currency)}
                        isSelected={selectedWalletName === wallet.name}
                        onClick={() => { }}
                      />
                    </div>
                  ))}
                </>
              )}
              {tradingWallets.length > 0 && (
                <>
                  <h3 className="text-base font-normal text-slate-1200 mt-2">{t("wallet.tradingWallet")}</h3>
                  {tradingWallets.map((wallet) => (
                    <div
                      key={wallet.wallet_id}
                      className="cursor-pointer"
                      onClick={() => {
                        handleWalletSelect(wallet, type)
                        setShowDesktopWalletPopup(null)
                      }}
                    >
                      <WalletDisplay
                        name={wallet.name}
                        amount={formatAmountWithDecimals(wallet.balance)}
                        currency={wallet.currency}
                        icon={getCurrencyImage(wallet.name, wallet.currency)}
                        isSelected={selectedWalletName === wallet.name}
                        onClick={() => { }}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderDesktopConfirmPopup = () => {
    if (!showDesktopConfirmPopup) return null

    const hasTransferFee = transferFeeCalculation !== null

    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 hidden md:flex items-center justify-center"
        onClick={() => setShowDesktopConfirmPopup(false)}
      >
        <div
          className="bg-white rounded-[32px] w-[512px] min-w-[512px] max-w-[512px] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="default"
            className="absolute top-4 right-4 min-w-0 px-0"
            onClick={() => setShowDesktopConfirmPopup(false)}
            aria-label="Close"
          >
            <Image src="/icons/button-close.png" alt="Close" width={48} height={48} />
          </Button>
          <div className="p-8">
            <h2 className="text-slate-1200 text-[24px] font-extrabold mb-12 text-left">
              {t("wallet.reviewAndConfirm")}
            </h2>
            <div className="mb-6">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.from")}</span>
                  <div className="flex items-center gap-3">
                    {sourceWalletData &&
                      (sourceWalletData.name.includes("P2P") ? (
                        <div className="relative w-[21px] h-[21px] flex-shrink-0">
                          <Image
                            src="/icons/p2p-black.png"
                            alt="P2P"
                            width={21}
                            height={21}
                            className="w-[21px] h-[21px] rounded-full"
                          />
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="w-[10.5px] h-[10.5px] rounded-full bg-white flex items-center justify-center">
                              <Image
                                src={
                                  getCurrencyImage(sourceWalletData.name, sourceWalletData.currency)}
                                alt={sourceWalletData.currency}
                                width={9}
                                height={9}
                                className="w-[9px] h-[9px] rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mb-3 mt-1">
                          <Image
                            src={
                              getCurrencyImage(sourceWalletData.name, sourceWalletData.currency)}
                            alt={sourceWalletData.currency}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    <span className="text-base font-normal text-slate-1200">{sourceWalletData?.name}</span>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.to")}</span>
                  <div className="flex items-center gap-3">
                    {destinationWalletData &&
                      (destinationWalletData.name.includes("P2P") ? (
                        <div className="relative w-[21px] h-[21px] flex-shrink-0">
                          <Image
                            src="/icons/p2p-black.png"
                            alt="P2P"
                            width={21}
                            height={21}
                            className="w-[21px] h-[21px] rounded-full"
                          />
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="w-[10.5px] h-[10.5px] rounded-full bg-white flex items-center justify-center">
                              <Image
                                src={
                                  getCurrencyImage(destinationWalletData.name, destinationWalletData.currency)}
                                alt={destinationWalletData.currency}
                                width={9}
                                height={9}
                                className="w-[9px] h-[9px] rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mb-3 mt-1">
                          <Image
                            src={
                              getCurrencyImage(destinationWalletData.name, destinationWalletData.currency)}
                            alt={destinationWalletData.currency}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    <span className="text-base font-normal text-slate-1200">{destinationWalletData?.name}</span>
                  </div>
                </div>
              </div>

              {hasTransferFee && transferFeeCalculation && (
                <>
                  <div className="h-1 bg-[#F6F7F8] mt-4 mb-0"></div>
                  <div className="flex flex-col justify-center gap-2 py-4">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-normal text-grayscale-text-muted">
                        {t("wallet.transferAmount")}
                      </span>
                      <span className="text-base font-normal text-slate-1200">
                        {formatAmountByCurrency(
                          transferFeeCalculation.transferAmount,
                          selectedAmountCurrency === "source"
                            ? sourceWalletData?.currency || ""
                            : destinationWalletData?.currency || "",
                        )}{" "}
                        {selectedAmountCurrency === "source"
                          ? sourceWalletData?.currency
                          : destinationWalletData?.currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-normal text-grayscale-text-muted">
                        {t("wallet.transferFee")} ({transferFeeCalculation.feePercentage}%)
                      </span>
                      <span className="text-base font-normal text-slate-1200">
                        {formatAmountByCurrency(transferFeeCalculation.transferFee, sourceWalletData?.currency || "")}{" "}
                        {sourceWalletData?.currency}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 bg-[#F6F7F8]"></div>
                  <div className="py-4">
                    <div className="flex items-start justify-between w-full">
                      <span className="text-base font-normal text-grayscale-text-muted">
                        {t("wallet.youllReceive")}
                      </span>
                      <div className="text-right">
                        <div className="text-base font-normal text-slate-1200">
                          ≈
                          {formatAmountByCurrency(
                            transferFeeCalculation.youllReceive,
                            destinationWalletData?.currency || "",
                          )}{" "}
                          {destinationWalletData?.currency} ({countdown}s)
                        </div>
                        <div className="text-base font-normal text-grayscale-text-muted mt-1">
                          {formatAmountByCurrency(
                            transferFeeCalculation.youllReceiveConverted,
                            sourceWalletData?.currency || "",
                          )}{" "}
                          {sourceWalletData?.currency}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!hasTransferFee && (
                <>
                  <div className="h-1 bg-[#F6F7F8] mt-4 mb-0"></div>
                  <div className="h-[72px] flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-normal text-grayscale-text-muted">
                        {t("wallet.transferAmount")}
                      </span>
                      <span className="text-base font-normal text-slate-1200">
                        {formatAmountWithDecimals(Number.parseFloat(transferAmount || "0"))} {selectedCurrency || "USD"}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 bg-[#F6F7F8]"></div>
                  <div className="h-[72px] flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-normal text-grayscale-text-muted">
                        {t("wallet.amountReceive")}
                      </span>
                      <span className="text-base font-normal text-slate-1200">
                        {formatAmountWithDecimals(Number.parseFloat(transferAmount || "0"))} {selectedCurrency || "USD"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="space-y-2 mt-12">
              <Button
                onClick={handleConfirmTransfer}
                disabled={isSubmitting}
                className="w-full h-12 min-h-12 max-h-12 px-7 flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <Image src="/icons/spinner.png" alt="Loading" width={20} height={20} className="animate-spin" />
                ) : (
                  t("common.confirm")
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderMobileConfirmSheet = () => {
    if (!showMobileConfirmSheet) return null

    const hasTransferFee = transferFeeCalculation !== null

    return (
      <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMobileConfirmSheet(false)}>
        <div
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pt-2 px-4 pb-8">
            <div className="flex justify-center mb-10">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            <h1 className="text-slate-1200 text-center text-[20px] font-extrabold mb-8 ml-4 ">
              {t("wallet.reviewAndConfirm")}
            </h1>
            <div className="mb-6 px-4">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.from")}</span>
                  <div className="flex items-center gap-3">
                    {sourceWalletData &&
                      (sourceWalletData.name.includes("P2P") ? (
                        <div className="relative w-[21px] h-[21px] flex-shrink-0">
                          <Image
                            src="/icons/p2p-black.png"
                            alt="P2P"
                            width={21}
                            height={21}
                            className="w-[21px] h-[21px] rounded-full"
                          />
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="w-[10.5px] h-[10.5px] rounded-full bg-white flex items-center justify-center">
                              <Image
                                src={
                                  getCurrencyImage(sourceWalletData.name, sourceWalletData.currency)}
                                alt={sourceWalletData.currency}
                                width={9}
                                height={9}
                                className="w-[9px] h-[9px] rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mb-3 mt-1">
                          <Image
                            src={
                              getCurrencyImage(sourceWalletData.name, sourceWalletData.currency)}
                            alt={sourceWalletData.currency}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    <span className="text-base font-normal text-slate-1200">{sourceWalletData?.name}</span>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.to")}</span>
                  <div className="flex items-center gap-3">
                    {destinationWalletData &&
                      (destinationWalletData.name.includes("P2P") ? (
                        <div className="relative w-[21px] h-[21px] flex-shrink-0">
                          <Image
                            src="/icons/p2p-black.png"
                            alt="P2P"
                            width={21}
                            height={21}
                            className="w-[21px] h-[21px] rounded-full"
                          />
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="w-[10.5px] h-[10.5px] rounded-full bg-white flex items-center justify-center">
                              <Image
                                src={
                                  getCurrencyImage(destinationWalletData.name, destinationWalletData.currency)}
                                alt={destinationWalletData.currency}
                                width={9}
                                height={9}
                                className="w-[9px] h-[9px] rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mb-3 mt-1">
                          <Image
                            src={
                              getCurrencyImage(destinationWalletData.name, destinationWalletData.currency)}
                            alt={destinationWalletData.currency}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    <span className="text-base font-normal text-slate-1200">{destinationWalletData?.name}</span>
                  </div>
                </div>
              </div>

              {hasTransferFee && transferFeeCalculation && (
                <>
                  <div className="h-1 bg-[#F6F7F8] mt-4 mb-0"></div>
                  <div className="flex flex-col justify-center gap-2 py-4">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-normal text-grayscale-text-muted">
                        {t("wallet.transferAmount")}
                      </span>
                      <span className="text-base font-normal text-slate-1200">
                        {formatAmountByCurrency(
                          transferFeeCalculation.transferAmount,
                          selectedAmountCurrency === "source"
                            ? sourceWalletData?.currency || ""
                            : destinationWalletData?.currency || "",
                        )}{" "}
                        {selectedAmountCurrency === "source"
                          ? sourceWalletData?.currency
                          : destinationWalletData?.currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-normal text-grayscale-text-muted">
                        {t("wallet.transferFee")} ({transferFeeCalculation.feePercentage}%)
                      </span>
                      <span className="text-base font-normal text-slate-1200">
                        {formatAmountByCurrency(transferFeeCalculation.transferFee, sourceWalletData?.currency || "")}{" "}
                        {sourceWalletData?.currency}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 bg-[#F6F7F8]"></div>
                  <div className="py-4">
                    <div className="flex items-start justify-between w-full">
                      <span className="text-base font-normal text-grayscale-text-muted">
                        {t("wallet.youllReceive")}
                      </span>
                      <div className="text-right">
                        <div className="text-base font-normal text-slate-1200">
                          ≈
                          {formatAmountByCurrency(
                            transferFeeCalculation.youllReceive,
                            destinationWalletData?.currency || "",
                          )}{" "}
                          {destinationWalletData?.currency} ({countdown}s)
                        </div>
                        <div className="text-base font-normal text-grayscale-text-muted mt-1">
                          {formatAmountByCurrency(
                            transferFeeCalculation.youllReceiveConverted,
                            sourceWalletData?.currency || "",
                          )}{" "}
                          {sourceWalletData?.currency}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!hasTransferFee && (
                <>
                  <div className="h-1 bg-[#F6F7F8] mt-4 mb-0"></div>
                  <div className="h-[72px] flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-normal text-grayscale-text-muted">
                        {t("wallet.transferAmount")}
                      </span>
                      <span className="text-base font-normal text-slate-1200">
                        {formatAmountWithDecimals(Number.parseFloat(transferAmount || "0"))} {selectedCurrency || "USD"}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 bg-[#F6F7F8]"></div>
                  <div className="h-[72px] flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-normal text-grayscale-text-muted">
                        {t("wallet.amountReceive")}
                      </span>
                      <span className="text-base font-normal text-slate-1200">
                        {formatAmountWithDecimals(Number.parseFloat(transferAmount || "0"))} {selectedCurrency || "USD"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="space-y-3 mt-8">
              <Button
                onClick={handleConfirmTransfer}
                disabled={isSubmitting}
                className="w-full h-12 min-w-24 min-h-12 max-h-12 px-7 flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <Image src="/icons/spinner.png" alt="Loading" width={20} height={20} className="animate-spin" />
                ) : (
                  t("common.confirm")
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getCurrencyImage = (walletName: string, currency: string) => {
    return currencyLogoMapper[currency as keyof typeof currencyLogoMapper]
  }

  const getSourceWalletCurrency = () => {
    const wallet = wallets.find((w) => w.wallet_id === sourceWalletData?.id)
    return wallet?.currency || ""
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (value === "") {
      setTransferAmount("")
      return
    }

    const decimalConstraints = getDecimalConstraints()
    if (decimalConstraints) {
      const decimalPlaces = getDecimalPlaces(value)

      if (decimalPlaces > decimalConstraints.maximum) {
        return
      }
    }

    setTransferAmount(value)
  }

  const handlePercentageClick = (percentage: number) => {
    track("ek_percentage_fill_transfer", { percentage_value: percentage })
    const sourceBalance = getSourceWalletBalance()
    const calculatedAmount = (sourceBalance * percentage) / 100

    const decimalConstraints = getDecimalConstraints()
    if (decimalConstraints) {
      const formattedAmount = calculatedAmount.toFixed(decimalConstraints.maximum)
      setTransferAmount(formattedAmount)
    } else {
      setTransferAmount(calculatedAmount.toFixed(2))
    }
  }

  if (step === "chooseCurrency") {
    return (
      <ChooseCurrencyStep
        title={t("wallet.transfer")}
        description={t("wallet.chooseCurrencyDescription", { action: "transfer" })}
        currencies={currencies}
        onClose={onClose}
        onCurrencySelect={handleCurrencySelect}
      />
    )
  }

  if (step === "enterAmount") {
    return (
      <div className="absolute inset-0 flex flex-col h-full p-4 md:pt-5">
        <div className="flex justify-between items-center mb-6 md:max-w-[608px] md:mx-auto md:w-full">
          <Button variant="ghost" size="sm" className="px-0 md:hidden" onClick={goBack} aria-label="Go back">
            <Image src="/icons/back-circle.png" alt="Back" width={32} height={32} />
          </Button>
          <div className="hidden md:block w-8 h-8"></div>
          <Button variant="ghost" size="sm" className="px-0" onClick={() => { track("ek_close_transfer"); onClose() }} aria-label="Close">
            <Image src="/icons/close-circle-secondary.png" alt="Close" width={32} height={32} />
          </Button>
        </div>
        <div className="md:max-w-[608px] md:mx-auto md:w-full flex-1 flex flex-col">
          <h1 className="text-slate-1200 text-xl md:text-[32px] font-extrabold mt-6 mb-6 px-2">
            {t("wallet.transfer")}
          </h1>
          <div className="relative mb-6 px-2">
            <div
              className="bg-grayscale-500 p-4 px-6 flex items-center gap-1 rounded-2xl cursor-pointer h-[100px] relative"
              onClick={() => {
                track("ek_from_wallet_transfer")
                if (window.innerWidth < 768) {
                  setShowMobileSheet("from")
                } else {
                  setShowDesktopWalletPopup("from")
                }
              }}
            >
              <div className="absolute top-4 left-6 flex flex-col items-start gap-1.5 w-10">
                <div className="text-grayscale-text-muted text-base font-normal">{t("wallet.from")}</div>
                {sourceWalletData ? (
                  sourceWalletData.name.includes("P2P") ? (
                    <div className="relative w-[21px] h-[21px] flex-shrink-0 mt-1">
                      <Image
                        src="/icons/p2p-black.png"
                        alt="P2P"
                        width={21}
                        height={21}
                        className="w-[21px] h-[21px] rounded-full"
                      />
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-[10.5px] h-[10.5px] rounded-full bg-white flex items-center justify-center">
                          <Image
                            src={
                              getCurrencyImage(sourceWalletData.name, sourceWalletData.currency)}
                            alt={sourceWalletData.currency}
                            width={9}
                            height={9}
                            className="w-[9px] h-[9px] rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mb-3 mt-1">
                      <Image
                        src={getCurrencyImage(sourceWalletData.name, sourceWalletData.currency)}
                        alt={sourceWalletData.currency}
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )
                ) : (
                  <div className="text-grayscale-text-placeholder text-base font-normal mb-3 mt-1">Select</div>
                )}
              </div>
              <div className="flex-1 mt-6 ml-10">
                {sourceWalletData && (
                  <>
                    <div className="text-slate-1200 text-base font-bold">{sourceWalletData.name}</div>
                    <div className="text-grayscale-600 text-sm font-normal">{getSourceWalletAmount()}</div>
                  </>
                )}
              </div>
              <Image src="/icons/chevron-down.png" alt="Dropdown" width={24} height={24} />
            </div>
            <div className="h-2"></div>
            <div
              className="bg-grayscale-500 p-4 px-6 flex items-center gap-1 rounded-2xl cursor-pointer h-[100px] relative"
              onClick={() => {
                track("ek_to_wallet_transfer")
                if (window.innerWidth < 768) {
                  setShowMobileSheet("to")
                } else {
                  setShowDesktopWalletPopup("to")
                }
              }}
            >
              <div className="absolute top-4 left-6 flex flex-col items-start gap-1.5 w-10">
                <div className="text-grayscale-text-muted text-base font-normal">{t("wallet.to")}</div>
                {destinationWalletData ? (
                  destinationWalletData.name.includes("P2P") ? (
                    <div className="relative w-[21px] h-[21px] flex-shrink-0 mt-1">
                      <Image
                        src="/icons/p2p-black.png"
                        alt="P2P"
                        width={21}
                        height={21}
                        className="w-[21px] h-[21px] rounded-full"
                      />
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-[10.5px] h-[10.5px] rounded-full bg-white flex items-center justify-center">
                          <Image
                            src={
                              getCurrencyImage(destinationWalletData.name, destinationWalletData.currency)}
                            alt={destinationWalletData.currency}
                            width={9}
                            height={9}
                            className="w-[9px] h-[9px] rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mb-3 mt-1">
                      <Image
                        src={
                          getCurrencyImage(destinationWalletData.name, destinationWalletData.currency)}
                        alt={destinationWalletData.currency}
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )
                ) : (
                  <div className="text-grayscale-text-placeholder text-base font-normal mb-3 mt-1">Select</div>
                )}
              </div>
              <div className="flex-1 mt-6 ml-10">
                {destinationWalletData && (
                  <>
                    <div className="text-slate-1200 text-base font-bold">{destinationWalletData.name}</div>
                    <div className="text-grayscale-600 text-sm font-normal">{getDestinationWalletAmount()}</div>
                  </>
                )}
              </div>
              <Image src="/icons/chevron-down.png" alt="Dropdown" width={24} height={24} />
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleInterchange}
                className="p-0 bg-white rounded-full shadow-sm"
              >
                <Image src="/icons/button-switch.png" alt="Switch" width={48} height={48} />
              </Button>
            </div>
          </div>
          <div className="mb-6 px-2 relative">
            <h2 className="text-slate-1200 text-sm font-normal mb-2">{t("wallet.amount")}</h2>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={transferAmount || ""}
                  onChange={handleAmountChange}
                  className="h-12 px-4 border border-grayscale-200 rounded-lg text-base placeholder:text-grayscale-text-placeholder appearance-none"
                  max={getSourceWalletBalance()}
                />
                {!showCurrencySwitcher && (
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-grayscale-600">
                    {selectedCurrency || "USD"}
                  </span>
                )}
              </div>
              {showCurrencySwitcher && (
                <div className="w-32 h-12 bg-black/[0.04] rounded-2xl p-2 flex items-center justify-center">
                  <Tabs
                    value={selectedAmountCurrency}
                    onValueChange={(value) => {
                      if (value) {
                        if (value === "source") {
                          track("ek_source_currency_segment_transfer")
                          setSelectedCurrency(sourceWalletData?.currency || null)
                        } else if (value === "destination") {
                          track("ek_destination_currency_segment_transfer")
                          setSelectedCurrency(destinationWalletData?.currency || null)
                        }
                        setTransferAmount("")
                        setSelectedAmountCurrency(value as "source" | "destination")
                      }
                    }}
                    className="w-full h-full"
                  >
                    <TabsList className="bg-transparent h-full gap-1 w-full p-0">
                      <TabsTrigger
                        value="source"
                        className="text-base px-3 h-full rounded-lg border-0 shadow-none data-[state=active]:bg-white data-[state=inactive]:bg-transparent hover:bg-white/50 text-[#181C25] font-normal flex-1"
                      >
                        {sourceWalletData?.currency}
                      </TabsTrigger>
                      <TabsTrigger
                        value="destination"
                        className="text-base px-3 h-full rounded-lg border-0 shadow-none data-[state=active]:bg-white data-[state=inactive]:bg-transparent hover:bg-white/50 text-[#181C25] font-normal flex-1"
                      >
                        {destinationWalletData?.currency}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}
            </div>
            {transferAmount && !isAmountValid(transferAmount) && (
              <p className="text-red-500 text-sm mt-1">{getAmountErrorMessage()}</p>
            )}
            <div className="flex gap-2 mt-6">
              <Button
                className="flex-1 text-grayscale-600 font-normal border-grayscale-200 hover:bg-transparent"
                onClick={() => handlePercentageClick(25)}
                size="sm"
                variant="outline"
              >
                25%
              </Button>
              <Button
                className="flex-1 text-grayscale-600 font-normal border-grayscale-200 hover:bg-transparent"
                onClick={() => handlePercentageClick(50)}
                size="sm"
                variant="outline"
              >
                50%
              </Button>
              <Button
                className="flex-1 text-grayscale-600 font-normal border-grayscale-200 hover:bg-transparent"
                onClick={() => handlePercentageClick(75)}
                size="sm"
                variant="outline"
              >
                75%
              </Button>
              <Button
                className="flex-1 text-grayscale-600 font-normal border-grayscale-200 hover:bg-transparent"
                onClick={() => handlePercentageClick(100)}
                size="sm"
                variant="outline"
              >
                100%
              </Button>
            </div>

            {showCurrencySwitcher && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-black/50 text-xs font-normal">{t("wallet.transferAmount")}</span>
                  <span className="text-[#181C25] text-xs font-normal">
                    {transferFeeCalculation
                      ? `${formatAmountByCurrency(
                        transferFeeCalculation.transferAmount,
                        selectedAmountCurrency === "source"
                          ? sourceWalletData?.currency || ""
                          : destinationWalletData?.currency || "",
                      )} ${selectedAmountCurrency === "source" ? sourceWalletData?.currency : destinationWalletData?.currency}`
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black/50 text-xs font-normal">
                    {t("wallet.transferFee")} ({transferFeeCalculation?.feePercentage || 0}%)
                  </span>
                  <span className="text-[#181C25] text-xs font-normal">
                    {transferFeeCalculation
                      ? `${formatAmountByCurrency(transferFeeCalculation.transferFee, sourceWalletData?.currency || "")} ${sourceWalletData?.currency}`
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-black/50 text-xs font-normal">{t("wallet.youllReceive")}:</span>
                  <div className="text-right">
                    <div className="text-[#181C25] text-xs font-normal">
                      {transferFeeCalculation && exchangeRateData
                        ? `${formatAmountByCurrency(transferFeeCalculation.youllReceive, destinationWalletData?.currency || "")} ${destinationWalletData?.currency} (${countdown}s)`
                        : "-"}
                    </div>
                    {transferFeeCalculation && (
                      <div className="text-black/50 text-xs font-normal mt-1">
                        {formatAmountByCurrency(
                          transferFeeCalculation.youllReceiveConverted,
                          sourceWalletData?.currency || "",
                        )}{" "}
                        {sourceWalletData?.currency}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="hidden md:block absolute top-full right-0 mt-6">
              <Button
                onClick={handleTransferClick}
                disabled={
                  !transferAmount ||
                  transferAmount.trim() === "" ||
                  !sourceWalletData ||
                  !destinationWalletData ||
                  !isAmountValid(transferAmount)
                }
                className="flex h-12 min-h-12 max-h-12 px-7 justify-center items-center gap-2"
              >
                {t("wallet.transfer")}
              </Button>
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="mt-auto md:hidden">
            <Button
              onClick={handleTransferClick}
              disabled={
                !transferAmount ||
                transferAmount.trim() === "" ||
                !sourceWalletData ||
                !destinationWalletData ||
                !isAmountValid(transferAmount)
              }
              className="w-full h-12 min-w-24 min-h-12 max-h-12 px-7 flex justify-center items-center gap-2"
            >
              {t("wallet.transfer")}
            </Button>
          </div>
        </div>
        {renderMobileSheet("from")}
        {renderMobileSheet("to")}
        {renderDesktopWalletPopup("from")}
        {renderDesktopWalletPopup("to")}
        {renderMobileConfirmSheet()}
        {renderDesktopConfirmPopup()}
      </div>
    )
  }

  if (step === "success") {
    const transferText = t("wallet.transferSuccessMessage", {
      amount: formatAmountWithDecimals(Number.parseFloat(transferAmount || "0")),
      currency: selectedCurrency || "USD",
      from: sourceWalletData?.name || "",
      to: destinationWalletData?.name || "",
    })

    return (
      <>
        <div
          className="absolute inset-0 flex flex-col h-full p-6"
          style={{
            background:
              "radial-gradient(108.21% 50% at 52.05% 0%, rgba(255, 68, 79, 0.24) 0%, rgba(255, 68, 79, 0.00) 100%), #181C25",
          }}
        >
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="mb-6">
              <Image src="/icons/success-transfer.png" alt="Success" width={256} height={256} />
            </div>
            <h1 className="text-white text-center text-2xl font-extrabold mb-4">{t("wallet.transferSuccessful")}</h1>
            <p className="text-white text-center text-base font-normal">{transferText}</p>
            <div className="hidden md:flex gap-4 mt-6">
              <Button
                onClick={() => { track("ek_view_details_transfer_successful"); handleViewDetails() }}
                className="w-[276px] h-12 px-7 flex justify-center items-center gap-2 bg-transparent border border-white rounded-3xl text-white text-base font-extrabold hover:bg-white/10"
              >
                {t("wallet.viewDetails")}
              </Button>
              <Button onClick={() => { track("ek_got_it_transfer_successful"); handleDoneClick() }} className="w-[276px] h-12 px-7 flex justify-center items-center gap-2">
                {t("wallet.gotIt")}
              </Button>
            </div>
          </div>
          <div className="block md:hidden w-full space-y-3">
            <Button
              onClick={() => { track("ek_got_it_transfer_successful"); handleDoneClick() }}
              className="w-full h-12 min-w-24 min-h-12 max-h-12 px-7 flex justify-center items-center gap-2"
            >
              {t("wallet.gotIt")}
            </Button>
            <Button
              onClick={() => { track("ek_view_details_transfer_successful"); handleViewDetails() }}
              className="w-full h-12 min-w-24 min-h-12 max-h-12 px-7 flex justify-center items-center gap-2 bg-transparent border border-white rounded-3xl text-white text-base font-extrabold hover:bg-white/10"
            >
              {t("wallet.viewDetails")}
            </Button>
          </div>
        </div>

        {selectedTransaction && (
          <TransactionDetails transaction={selectedTransaction} onClose={handleCloseTransactionDetails} />
        )}
      </>
    )
  }

  if (step === "unsuccessful") {
    const transferText = `${t("wallet.transferUnsuccessfulMessage")} ${transferErrorMessage || ""}`

    return (
      <div
        className="absolute inset-0 flex flex-col h-full p-6"
        style={{
          background:
            "radial-gradient(108.21% 50% at 52.05% 0%, rgba(255, 68, 79, 0.24) 0%, rgba(255, 68, 79, 0.00) 100%), #181C25",
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="mb-6">
            <Image src="/icons/success-transfer.png" alt="Unsuccessful" width={256} height={256} />
          </div>
          <h1 className="text-white text-center text-2xl font-extrabold mb-4">{t("wallet.transferUnsuccessful")}</h1>
          <p className="text-white text-center text-base font-normal">{transferText}</p>
          <div className="hidden md:flex gap-4 mt-6">
            <Button
              onClick={() => { track("ek_not_now_transfer_unsuccessful"); handleDoneClick() }}
              className="w-[276px] h-12 px-7 flex justify-center items-center gap-2 bg-transparent border border-white rounded-3xl text-white text-base font-extrabold hover:bg-white/10"
            >
              {t("wallet.notNow")}
            </Button>
            <Button onClick={() => { track("ek_try_again_transfer_unsuccessful"); toEnterAmount() }} className="w-[276px] h-12 px-7 flex justify-center items-center gap-2">
              {t("wallet.tryAgain")}
            </Button>
          </div>
        </div>
        <div className="block md:hidden w-full space-y-3">
          <Button
            onClick={() => { track("ek_try_again_transfer_unsuccessful"); toEnterAmount() }}
            className="w-full h-12 min-w-24 min-h-12 max-h-12 px-7 flex justify-center items-center gap-2"
          >
            {t("wallet.tryAgain")}
          </Button>
          <Button
            onClick={() => { track("ek_not_now_transfer_unsuccessful"); handleDoneClick() }}
            className="w-full h-12 min-w-24 min-h-12 max-h-12 px-7 flex justify-center items-center gap-2 bg-transparent border border-white rounded-3xl text-white text-base font-extrabold hover:bg-white/10"
          >
            {t("wallet.notNow")}
          </Button>
        </div>
      </div>
    )
  }

  return null
}
