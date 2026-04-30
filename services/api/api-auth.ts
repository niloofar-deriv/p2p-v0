import { useUserDataStore } from "@/stores/user-data-store"
import { useMarketFilterStore } from "@/stores/market-filter-store"

export interface LoginRequest {
  email: string
}

export interface LoginResponse {
  code: string
  message: string
}

export interface VerificationRequest {
  token: string
  type: string
  email: string
}

export interface VerificationResponse {
  access_token?: string
  errors?: string[]
  user?: {
    id: string
    email?: string
  }
}

export interface Country {
  code: string
  name: string
  currency?: string
  currency_name?: string
}

export interface CurrencyItem {
  code: string
  name: string
}

export interface CurrenciesResponse {
  [currencyCode: string]: Record<string, any>
}

export interface KycStatusResponse {
  kyc_step: "poi" | "poa"
  status: string
}

export interface TotalBalanceResponse {
  balance: number
  currency: string
}

export interface OnboardingStatusResponse {
  kyc: {
    status: string
  }
  verification: {
    email_verified: boolean
    phone_verified: boolean
  }
  p2p: {
    allowed: boolean
    criteria: Array<{
      code: string
      passed: boolean
    }>
  }
}

export interface CreateP2PUserResponse {
  id: string
  user_id: string
  created_at: string
}

const getAuthHeader = () => ({
  "Content-Type": "application/json",
})

/**
 * Initiate login with email
 */
export async function login(email: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CORE_URL}/login`, {
      method: "POST",
      body: JSON.stringify(email),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    const { data } = result

    return data
  } catch (error) {
    console.error("Login error:", error)
    throw new Error("Failed to login. Please try again.")
  }
}

/**
 * Verify the code sent to email
 */
export async function verifyCode(verificationData: VerificationRequest): Promise<VerificationResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CORE_URL}/verify`, {
      method: "POST",
      headers: {
        "X-Enable-Session": "true",
      },
      credentials: "include",
      body: JSON.stringify(verificationData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    const { data } = result

    return data
  } catch (error) {
    console.error("Verification error:", error)
    throw new Error("Failed to verify code. Please try again.")
  }
}

/**
 * Verify token from URL parameter
 */
export async function verifyToken(token: string): Promise<VerificationResponse> {
  const isOryEnabled = process.env.NEXT_PUBLIC_IS_ORY_ENABLED == 1

  try {
    if (isOryEnabled) {
      const url =
        process.env.NEXT_PUBLIC_NODE_ENV === "production" ? "https://dp2p.deriv.com" : "https://staging-dp2p.deriv.com"

      const response = await fetch(`${process.env.NEXT_PUBLIC_CORE_URL}/auth/redirect-url?token=${token}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const { data } = result

      if (data.recovery_link) {
        const recoveryResponse = await fetch(data.recovery_link, {
          method: "GET",
          redirect: "manual",
          credentials: "include",
        })

        if (recoveryResponse.ok || recoveryResponse.type === "opaqueredirect") {
          return data
        } else {
          throw new Error("Failed to process recovery link")
        }
      }

      return data
    } else {
      const response = await fetch(`${process.env.NEXT_PUBLIC_CORE_URL}/auth/token/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Enable-Session": "true",
        },
        credentials: "include",
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const { data } = result

      return data
    }
  } catch (error) {
    console.error("Token verification error:", error)
    throw new Error("Failed to verify token. Please try again.")
  }
}

/**
 * Check if user is authenticated
 */
export async function getSession(): Promise<boolean> {
  try {
    const isOryEnabled = process.env.NEXT_PUBLIC_IS_ORY_ENABLED == 1
    const sessionUrl = isOryEnabled
      ? `${process.env.NEXT_PUBLIC_ORY_URL}/sessions/whoami`
      : `${process.env.NEXT_PUBLIC_CORE_URL}/session`

    const response = await fetch(sessionUrl, {
      method: "GET",
      credentials: "include",
    })

    const result = await response.json()
    const externalId = result?.data?.identity?.external_id
    if (externalId) useUserDataStore.getState().setExternalId(externalId)

    const verifiableAddresses = result?.identity?.verifiable_addresses || []
    const emailVerified = verifiableAddresses.some(
      (addr: { via: string; verified: boolean }) => addr.via === "email" && addr.verified == true
    )

    useUserDataStore.getState().setOryEmailVerified(emailVerified)

    return response.status === 200
  } catch (error) {
    return false
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CORE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    useUserDataStore.getState().clearUserData()
    Analytics.reset()

    localStorage.removeItem("auth_token")
    localStorage.removeItem("socket_token")
    window.location.href = "/"
  } catch (error) {
    console.error(error)
    throw new Error("User not authenticated.")
  }
}

/**
 * Fetch current user data from /users/me endpoint
 */
export async function getMe(): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/me`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error fetching user data:", error)
    throw error
  }
}

/**
 * Fetch user data and store user_id in localStorage
 */
export async function fetchUserIdAndStore(): Promise<void> {
  try {
    await getClientProfile()

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/me`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })


    const result = await response.json()

    if (response.status === 403) {
      const errors = result?.errors || []
      const isUserDisabled = errors.some(
        (error: any) => error.code === "UserDisabled" || error.message?.includes("UserDisabled"),
      )

      if (isUserDisabled) {
        useUserDataStore.getState().updateUserData({
          balances: [{ amount: "0" }],
          signup: "v2",
          status: "disabled",
        })
        return
      }
    }

    if (!response.ok) {
      useUserDataStore.getState().updateUserData({
        balances: [{ amount: "0" }],
        signup: "v2",
      })
      useUserDataStore.getState().setUserId("")

      // Set local currency from residence country if available
      try {
        const residenceCountry = useUserDataStore.getState().residenceCountry
        if (residenceCountry) {
          const settings = await getSettings()
          const countries = settings?.countries || []
          const normalizedResidenceCode = typeof residenceCountry === "string" ? residenceCountry.toLowerCase() : ""

          const matchedCountry = normalizedResidenceCode
            ? countries.find((c: any) => typeof c?.code === "string" && c.code.toLowerCase() === normalizedResidenceCode)
            : null

          const derivedCurrency =
            (matchedCountry?.currency && String(matchedCountry.currency).toUpperCase()) ||
            (countries?.[0]?.currency && String(countries[0].currency).toUpperCase()) ||
            null

          useUserDataStore.getState().setLocalCurrency(derivedCurrency)
        } else {
          useUserDataStore.getState().setLocalCurrency(null)
        }
      } catch (error) {
        console.error("Error deriving local currency from residence:", error)
        useUserDataStore.getState().setLocalCurrency(null)
      }

      return
    }

    const userId = result?.data?.id
    let userCountryCode = result?.data?.country_code
    const brandClientId = result?.data?.brand_client_id
    const brand = result?.data?.brand
    const tempBanUntil = result?.data?.temp_ban_until
    const balances = result?.data?.total_account_value
    const status = result?.data?.status
    const tradeBand = result?.data?.trade_band

    // If userCountryCode is not available, fallback to residence from client profile
    if (!userCountryCode) {
      const residenceCountry = useUserDataStore.getState().residenceCountry
      if (residenceCountry) {
        userCountryCode = residenceCountry
      }
    }

    // Derive user's local currency from /settings.countries using /users/me country_code.
    // Fallback to the first country currency if no match.
    try {
      const settings = await getSettings()
      const countries = settings?.countries || []
      const normalizedUserCountryCode = typeof userCountryCode === "string" ? userCountryCode.toLowerCase() : ""

      const matchedCountry = normalizedUserCountryCode
        ? countries.find((c: any) => typeof c?.code === "string" && c.code.toLowerCase() === normalizedUserCountryCode)
        : null

      const derivedLocalCurrency =
        (matchedCountry?.currency && String(matchedCountry.currency).toUpperCase()) ||
        (countries?.[0]?.currency && String(countries[0].currency).toUpperCase()) ||
        null

      useUserDataStore.getState().setLocalCurrency(derivedLocalCurrency)
    } catch (error) {
      console.error("Error deriving local currency from settings:", error)
    }

    if (userId) {
      const newUserId = userId.toString()
      const previousUserId = useUserDataStore.getState().userId

      // Always store the userId once we have it (first load previousUserId is often null).
      // Only reset filters when the user actually changes between sessions.
      if (previousUserId && previousUserId !== newUserId) {
        useMarketFilterStore.getState().resetFilters()
      }

      if (previousUserId !== newUserId) {
        useUserDataStore.getState().setUserId(newUserId)
      }

      if (brandClientId) {
        useUserDataStore.getState().setBrandClientId(brandClientId)
      }
      if (brand) {
        useUserDataStore.getState().setBrand(brand)
      }

      const { userData } = useUserDataStore.getState()
      if (userData) {
        useUserDataStore.getState().updateUserData({
          adverts_are_listed: result.data.adverts_are_listed,
          signup: result.data.signup,
          wallet_id: result.data.wallet_id,
          temp_ban_until: tempBanUntil,
          balances: [balances],
          status: status,
          trade_band: tradeBand,
        })
      }
    } else {
      useUserDataStore.getState().updateUserData({
        balances: [{ amount: "0" }],
        signup: "v2",
      })
      useUserDataStore.getState().setUserId("")
      useUserDataStore.getState().setLocalCurrency(null)
      useMarketFilterStore.getState().resetFilters()
    }
  } catch (error) {
    console.error("Error fetching user ID:", error)
  }
}

export async function getClientProfile(): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CORE_URL}/client/profile`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`)
    }

    const result = await response.json()
    const { data } = result

    const userData = {
      adverts_are_listed: true,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      nickname: data.nickname,
    }

    useUserDataStore.getState().setUserData(userData)

    if (data.residence) {
      useUserDataStore.getState().setResidenceCountry(data.residence)
    }
  } catch (error) {
    console.error("Error fetching profile:", error)
  }
}

/**
 * Get websocket token
 */
export async function getSocketToken(token?: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/user-websocket-token`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.statusText}`)
    }

    const result = await response.json()
    const socketToken = result?.data.token

    if (socketToken) {
      useUserDataStore.getState().setSocketToken(socketToken.toString())
    }
  } catch (error) {
    console.error("Error fetching token:", error)
  }
}

/**
 * Get KYC status for user onboarding
 */
export async function getKycStatus(): Promise<KycStatusResponse[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CORE_URL}/client/kyc-status`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch KYC status: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error fetching KYC status:", error)
  }
}

/**
 * Get onboarding status for the user
 */
export async function getOnboardingStatus(): Promise<OnboardingStatusResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CORE_URL}/client/onboarding-status`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch onboarding status: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error fetching onboarding status:", error)
    throw error
  }
}

/**
 * Get total balance for the user
 */
export async function getTotalBalance(): Promise<TotalBalanceResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CORE_URL}/client/total-balance`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch total balance: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error fetching total balance:", error)
    throw error
  }
}

/**
 * Get balance from users/me endpoint (for V1 signup users)
 */
export async function getUserBalance(): Promise<{ amount: string; currency: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/users/me`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user balance: ${response.statusText}`)
    }

    const result = await response.json()
    const balances = result?.data?.balances || []

    const firstBalance = balances[0] || {}
    return {
      amount: firstBalance.amount || "0.00",
      currency: firstBalance.currency || "USD",
    }
  } catch (error) {
    console.error("Error fetching user balance:", error)
    throw error
  }
}

/**
 * Get list of available currencies
 */
export async function getCurrencies(): Promise<CurrenciesResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CORE_URL}/core/business/config/currencies`, {
      method: "POST",
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch currencies: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error fetching currencies:", error)
    throw error
  }
}

/**
 * Get user settings
 */
export async function getSettings(): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/settings`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error fetching settings:", error)
    throw error
  }
}

/**
 * Create a P2P user after verification is complete
 */
export async function createP2PUser(): Promise<CreateP2PUserResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CORE_URL}/p2p/client`, {
      method: "POST",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to create P2P user: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error creating P2P user:", error)
    throw error
  }
}

/**
 * Get advert statistics for a specific currency
 * Returns minimum and maximum exchange rates for fixed and floating adverts
 */
export async function getAdvertStatistics(accountCurrency: string): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/advert-statistics/${accountCurrency}`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch advert statistics: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error fetching advert statistics:", error)
    throw error
  }
}
