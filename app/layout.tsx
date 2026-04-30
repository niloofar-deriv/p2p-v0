import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Main from "./main"
import "./globals.css"
import { AlertDialogProvider } from "@/contexts/alert-dialog-context"
import { DatadogRumInit } from "@/components/datadog-rum-init"
import { AnalyticsProvider } from "@/app/analytics-provider"
import { LanguageSync } from "@/lib/i18n/language-sync"
import { LoadingIndicator } from "@/components/loading-indicator"
import Script from "next/script"
import { ReactQueryProvider } from "@/components/providers/react-query-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Buy and sell on Deriv P2P to fund your trading account | Deriv",
  description: "Buy and sell on Deriv P2P to fund your trading account | Deriv",
  generator: "v0.dev",
  icons: {
    icon: "/icons/dp2p.svg",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          id="gtm-script"
          strategy="afterInteractive"
        >
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-NF7884S');`}
        </Script>
      </head>
      <body className={inter.className}>
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NF7884S"
        height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe></noscript>
        <DatadogRumInit />
        <Suspense fallback={null}>
          <LanguageSync />
        </Suspense>
        <AnalyticsProvider>
          <ReactQueryProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              <AlertDialogProvider>
                <Toaster />
                <Suspense fallback={<div className="flex items-center justify-center h-screen"><LoadingIndicator/></div>}>
                  <Main>{children}</Main>
                </Suspense>
              </AlertDialogProvider>
            </ThemeProvider>
          </ReactQueryProvider>
        </AnalyticsProvider>
      </body>
    </html>
  )
}
