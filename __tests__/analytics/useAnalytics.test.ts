import { renderHook } from "@testing-library/react"
import { Analytics } from "@deriv-com/analytics"
import { useAnalytics } from "@/analytics/useAnalytics"

jest.mock("@deriv-com/analytics", () => ({
  Analytics: {
    initialise: jest.fn(),
    pageView: jest.fn(),
    identifyEvent: jest.fn(),
    backfillPersonProperties: jest.fn(),
    reset: jest.fn(),
  },
}))

// Reset the module-level isInitialized flag between tests
beforeEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
})

describe("useAnalytics", () => {
  it("returns reset, identifyEvent, and backfillPersonProperties when PostHog key is set", () => {
    process.env.NEXT_PUBLIC_RUDDERSTACK_KEY = "rs-key"
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "ph-key"

    const { result } = renderHook(() => useAnalytics())

    expect(typeof result.current.reset).toBe("function")
    expect(typeof result.current.identifyEvent).toBe("function")
    expect(typeof result.current.backfillPersonProperties).toBe("function")
  })

  it("does not expose backfillPersonProperties when PostHog key is absent", () => {
    process.env.NEXT_PUBLIC_RUDDERSTACK_KEY = "rs-key"
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY

    const { result } = renderHook(() => useAnalytics())

    expect(result.current.backfillPersonProperties).toBeUndefined()
  })

  it("identifyEvent delegates to Analytics.identifyEvent", () => {
    process.env.NEXT_PUBLIC_RUDDERSTACK_KEY = "rs-key"

    const { result } = renderHook(() => useAnalytics())

    result.current.identifyEvent({
      userId: "user-123",
      email: "user@example.com",
      countryOfResidence: "gb",
    })

    expect(Analytics.identifyEvent).toHaveBeenCalledWith("user-123", {
      email: "user@example.com",
      language: undefined,
      country_of_residence: "gb",
    })
  })

  it("reset delegates to Analytics.reset", () => {
    const { result } = renderHook(() => useAnalytics())
    expect(result.current.reset).toBe(Analytics.reset)
  })
})
