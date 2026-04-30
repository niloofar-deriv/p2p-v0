import { renderHook } from "@testing-library/react"
import { Analytics } from "@deriv-com/analytics"
import { useTrackEvent } from "@/analytics/useTrackEvent"

jest.mock("@deriv-com/analytics", () => ({
  Analytics: {
    trackEvent: jest.fn(),
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe("useTrackEvent", () => {
  it("returns a stable send function", () => {
    const { result, rerender } = renderHook(() => useTrackEvent())
    const first = result.current.send
    rerender()
    expect(result.current.send).toBe(first)
  })

  it("send delegates to Analytics.trackEvent", () => {
    const { result } = renderHook(() => useTrackEvent())

    result.current.send({
      eventName: "ce_p2p_page",
      action: "open",
      pageName: "ads",
    })

    expect(Analytics.trackEvent).toHaveBeenCalledWith(
      "ce_p2p_page",
      expect.objectContaining({ action: "open" })
    )
  })

  it("does not propagate Analytics.trackEvent errors", () => {
    ;(Analytics.trackEvent as jest.Mock).mockImplementationOnce(() => {
      throw new Error("sdk error")
    })

    const { result } = renderHook(() => useTrackEvent())

    expect(() =>
      result.current.send({ eventName: "ce_p2p_page", action: "open", pageName: "ads" })
    ).not.toThrow()
  })

  it("includes cta_information for click action with ctaName", () => {
    const { result } = renderHook(() => useTrackEvent())

    result.current.send({
      eventName: "ce_p2p_page",
      action: "click",
      pageName: "ads",
      ctaName: "buy_now",
      sectionName: "header",
    })

    expect(Analytics.trackEvent).toHaveBeenCalledWith(
      "ce_p2p_page",
      expect.objectContaining({
        cta_information: { cta_name: "buy_now", section_name: "header" },
      })
    )
  })

  it("includes error object when errorMessage is provided", () => {
    const { result } = renderHook(() => useTrackEvent())

    result.current.send({
      eventName: "ce_p2p_page",
      action: "click",
      pageName: "ads",
      errorMessage: "Insufficient balance",
      errorCode: "ERR_BALANCE",
    })

    expect(Analytics.trackEvent).toHaveBeenCalledWith(
      "ce_p2p_page",
      expect.objectContaining({
        error: { error_message: "Insufficient balance", error_code: "ERR_BALANCE" },
      })
    )
  })
})
