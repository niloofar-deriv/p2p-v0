"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as AuthAPI from "@/services/api/api-auth"
import Image from "next/image"
import { useUserDataStore } from "@/stores/user-data-store"
import { useAnalytics } from "@/analytics/useAnalytics"

export default function LoginPage() {
  const { identifyEvent } = useAnalytics()
  const [step, setStep] = useState<"login" | "verification">("login")
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationMessage, setVerificationMessage] = useState("")
  const [resendTimer, setResendTimer] = useState(59)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await AuthAPI.login({ email })

      if (response.code === "Success") {
        setVerificationMessage(response.message)
        setStep("verification")

        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(response.message || "Login failed. Please try again.")
      }
    } catch (error: any) {
      console.error("Login failed:", error)
      setError(error.message || "Failed to login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async () => {
    try {
      setIsLoading(true)
      setError("")

      const verificationData = {
        token: verificationCode,
        type: "email",
        email,
      }

      const response = await AuthAPI.verifyCode(verificationData)

      if (response) {
        if (response.access_token) localStorage.setItem("auth_token", response.access_token)

        if (response.user?.id) {
          useUserDataStore.getState().setClientId(response.user.id)
        }

        await AuthAPI.fetchUserIdAndStore()
        await AuthAPI.getSocketToken(response.access_token)

        await AuthAPI.getSession()
        const externalId = useUserDataStore.getState().externalId
        if (externalId) {
          identifyEvent({
            userId: externalId,
            email,
            language: navigator.language,
          })
        }

        window.location.href = "/"
      } else {
        setError("Verification failed. Please try again.")
      }
    } catch (error: any) {
      console.error("Verification failed:", error)
      setError(error.message || "Failed to verify code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendTimer > 0) return

    try {
      setError("")
      const response = await AuthAPI.login({ email })

      if (response.success) {
        setResendTimer(59)
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(response.message || "Failed to resend code.")
      }
    } catch (error: any) {
      setError(error.message || "Failed to resend code. Please try again.")
    }
  }

  if (step === "verification") {
    return (
      <div className="min-h-screen bg-white px-4 py-6">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => setStep("login")} className="p-2 -ml-2">
            <Image src="/icons/arrow-left-icon.png" width={24} height={24} />
            Back
          </Button>
        </div>
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-black mb-6">Verification</h1>

          <p className="text-gray-600 mb-8">{verificationMessage}</p>
          <div className="mb-8">
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
              maxLength={6}
            />
            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          </div>
          <div className="text-center mb-8 space-y-2">
            <p className="text-gray-600">{"Didn't receive the code?"}</p>
            {resendTimer > 0 ? (
              <p className="text-gray-600">Resend code ({resendTimer}s)</p>
            ) : (
              <Button variant="ghost" onClick={handleResendCode} size="sm">
                Resend code
              </Button>
            )}
          </div>
          <Button className="w-full" onClick={handleVerification} disabled={verificationCode.length !== 6 || isLoading}>
            {isLoading ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-md mx-auto mt-12">
        <h1 className="text-4xl font-bold text-black mb-8">Welcome back!</h1>
        <div className="mb-6">
          <label className="block text-gray-600 mb-3">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" />
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
        <Button onClick={handleLogin} disabled={!email.trim() || isLoading} className="w-full">
          {isLoading ? "Logging in..." : "Log in"}
        </Button>
        <div className="mt-[2rem] text-center">
          Don't have an account yet?{" "}
          <a className="text-primary" href="https://home.deriv.com/dashboard" target="_blank" rel="noopener noreferrer">
            Sign up
          </a>
        </div>
      </div>
    </div>
  )
}
