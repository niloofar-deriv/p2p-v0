"use client"

import { useState, useEffect, useCallback } from "react"
import { TransactionsTab } from "./components"
import WalletSummary from "./components/wallet-summary"
import WalletBalances from "./components/wallet-balances"
import { useCurrencies, useTotalBalance } from "@/hooks/use-api-queries"
import { TemporaryBanAlert } from "@/components/temporary-ban-alert"
import { useUserDataStore } from "@/stores/user-data-store"
import { P2PAccessRemoved } from "@/components/p2p-access-removed"
import { useRouter } from "next/navigation"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { KycOnboardingSheet } from "@/components/kyc-onboarding-sheet"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"

interface Balance {
  wallet_id: string
  amount: string
  currency: string
  label: string
}

export default function WalletPage() {
  const router = useRouter()
  const { t } = useTranslations()
  const { track } = useTrackers()
  const { hideAlert, showAlert } = useAlertDialog()
  const { data: currenciesResponse, isLoading: isCurrenciesLoading } = useCurrencies()
  const { data: balanceData, isLoading: isBalanceLoading } = useTotalBalance()
  const [displayBalances, setDisplayBalances] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>("USD")
  const [totalBalance, setTotalBalance] = useState("0.00")
  const [balanceCurrency, setBalanceCurrency] = useState("USD")
  const [p2pBalances, setP2pBalances] = useState<Balance[]>([])
  const [currenciesData, setCurrenciesData] = useState<Record<string, any>>({})
  const [hasCheckedSignup, setHasCheckedSignup] = useState(false)
  const [hasBalance, setHasBalance] = useState(false)
  const [showKycPopup, setShowKycPopup] = useState(false)
  const { userData } = useUserDataStore()
  const tempBanUntil = userData?.temp_ban_until
  const isDisabled = userData?.status === "disabled"

  const processBalanceData = useCallback(
    (currencies: Record<string, any>, balance: any) => {
      try {
        const p2pWallet = balance?.wallets?.items?.find((wallet: any) => wallet.type === "p2p")

        if (p2pWallet) {
          setTotalBalance(p2pWallet.total_balance?.approximate_total_balance ?? "0.00")
          setBalanceCurrency(p2pWallet.total_balance?.converted_to ?? "USD")

          const hasAnyBalance =
            p2pWallet.balances?.some((wallet: any) => Number.parseFloat(wallet.balance || "0") > 0) ?? false
          setHasBalance(hasAnyBalance)

          if (p2pWallet.balances) {
            const balancesList: Balance[] = p2pWallet.balances.map((wallet: any) => ({
              wallet_id: p2pWallet.id,
              amount: String(wallet.balance || "0"),
              currency: wallet.currency,
              label: currencies[wallet.currency]?.label || wallet.currency,
            }))
            setP2pBalances(balancesList)
          }
        }
      } catch (error) {
        console.error("Error processing P2P wallet balance:", error)
        setTotalBalance("0.00")
        setHasBalance(false)
      }
    },
    []
  )

  useEffect(() => {
    track("ek_open_wallets")
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
            <KycOnboardingSheet route="wallets" onClose={hideAlert} />
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
      router.push("/")
    } else {
      setHasCheckedSignup(true)
    }
  }, [userData?.signup, router])

  useEffect(() => {
    const currencies = currenciesResponse?.data || {}
    setCurrenciesData(currencies)
    processBalanceData(currencies, balanceData)
  }, [balanceData, currenciesResponse, processBalanceData])

  const handleBalanceClick = (currency: string, balance: string) => {
    track("ek_wallet_item_wallets", { currency_code: currency })
    setSelectedCurrency(currency)
    setTotalBalance(balance)
    setDisplayBalances(false)
  }

  const handleBackToBalances = () => {
    setDisplayBalances(true)
    setSelectedCurrency(null)
    // Restore the total balance from the p2p wallet
    if (balanceData?.wallets?.items) {
      const p2pWallet = balanceData.wallets.items.find((wallet: any) => wallet.type === "p2p")
      if (p2pWallet?.total_balance?.approximate_total_balance) {
        setTotalBalance(p2pWallet.total_balance.approximate_total_balance)
        setBalanceCurrency(p2pWallet.total_balance.converted_to || "USD")
      }
    }
  }

  if (userData?.signup === "v1") {
    return null
  }

  if (isDisabled) {
    return (
      <div className="flex flex-col h-screen overflow-hidden px-3">
        <P2PAccessRemoved />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-0 md:pl-[16px]">
      <div className="w-full flex flex-col items-center">
        <div className="w-full mt-0">
          <WalletSummary
            isBalancesView={displayBalances}
            selectedCurrency={selectedCurrency}
            onBack={handleBackToBalances}
            balance={totalBalance}
            currency={balanceCurrency}
            isLoading={isBalanceLoading}
            hasBalance={hasBalance}
          />
        </div>
        {tempBanUntil && (
          <div className="w-full px-4 md:px-0 mt-4">
            <TemporaryBanAlert tempBanUntil={tempBanUntil} />
          </div>
        )}
        <div className="w-full mt-6 mx-4 md:mx-4 px-6 md:px-0">
          {displayBalances ? (
            <WalletBalances onBalanceClick={handleBalanceClick} balances={p2pBalances} isLoading={isBalanceLoading} />
          ) : (
            <TransactionsTab selectedCurrency={selectedCurrency} currencies={currenciesData} />
          )}
        </div>
      </div>
    </div>
  )
}
