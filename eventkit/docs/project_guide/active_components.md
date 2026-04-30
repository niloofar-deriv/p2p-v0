# Active Components

Components, hooks, and functions that call `track()` or are parents of components that do.

---

## BuySellPage
- **File:** `app/page.tsx`
- **Type:** component
- **Calls track():** yes
- **Route:** `/`
- **Handlers:** `handleOrderClick`, `handleAdvertiserClick`, tab `onValueChange`
- **Notes:** Markets main page; mounts once per route navigation

## OrderSidebar
- **File:** `components/buy-sell/order-sidebar.tsx`
- **Type:** component
- **Calls track():** yes
- **Parent of:** `RateChangeConfirmation`, `AdUpdatedConfirmation`
- **Handlers:** `handleClose`, `handleShowPaymentSelection`, `handleSubmit`, `proceedWithOrder`
- **Notes:** Sheet panel (not a route) — rendered from `app/page.tsx`. Contains the full place-order flow.

## MobileAdvertiserSearch
- **File:** `components/mobile-advertiser-search.tsx`
- **Type:** component
- **Calls track():** yes
- **Handlers:** `handleBack`, `handleClear`, `handleBuySellClick`, `handleAdvertiserClick`, tab `onValueChange`
- **Notes:** Mobile/tablet only; opened from search button in `components/header.tsx`

## Sidebar
- **File:** `components/sidebar.tsx`
- **Type:** component
- **Calls track():** yes
- **Handlers:** `handleLiveChat`, `handleClear`, `handleBuySellClick`, `handleAdvertiserClick`, tab `onValueChange`
- **Notes:** Desktop only; contains search, nav links, profile/notification icons

## Header
- **File:** `components/header.tsx`
- **Type:** component
- **Calls track():** yes
- **Handlers:** search button `onClick`, notifications `onClick`
- **Notes:** Mobile header; search opens `MobileAdvertiserSearch`

## MarketFilterDropdown
- **File:** `components/market-filter/market-filter-dropdown.tsx`
- **Type:** component
- **Calls track():** yes
- **Handlers:** `handleApply`, `handleReset`, `handleFilterChange`, `handleSortByChange`
- **Notes:** Filter sheet (desktop popover / mobile drawer)

## PaymentMethodsFilter
- **File:** `components/payment-methods-filter/payment-methods-filter.tsx`
- **Type:** component
- **Calls track():** yes
- **Handlers:** `handleSelectAll`, `handleMethodToggle`, `handleApply`, `handleReset`
- **Notes:** Payment method filter sheet

## CurrencyFilter
- **File:** `components/currency-filter/currency-filter.tsx`
- **Type:** component
- **Calls track():** yes
- **Handlers:** `handleCurrencySelect`
- **Notes:** Payment currency selector

## EmptyState
- **File:** `components/empty-state.tsx`
- **Type:** component
- **Calls track():** yes
- **Handlers:** `createAd`
- **Notes:** Fires `ek_create_ad_markets` only when `route === 'markets'`

## OrdersPage
- **File:** `app/orders/page.tsx`
- **Type:** component
- **Calls track():** yes
- **Route:** `/orders`
- **Handlers:** open event in `useEffect`

## OrderDetailPage
- **File:** `app/orders/[id]/page.tsx`
- **Type:** component
- **Calls track():** yes
- **Route:** `/orders/[id]`
- **Handlers:** cancel order confirm handler

## MyAdsPage
- **File:** `app/ads/page.tsx`
- **Type:** component
- **Calls track():** yes
- **Route:** `/ads`
- **Handlers:** open event in `useEffect`, `handleToggleHideMyAds`

## MultiStepAdForm
- **File:** `app/ads/components/shared/multi-step-ad-form.tsx`
- **Type:** component
- **Calls track():** yes
- **Handlers:** ad submission error handler
- **Notes:** Used by both `/ads/create` and `/ads/edit/[id]`

## ProfilePage
- **File:** `app/profile/page.tsx`
- **Type:** component
- **Calls track():** yes
- **Route:** `/profile`
- **Handlers:** open event in `useEffect`

## WalletPage
- **File:** `app/wallet/page.tsx`
- **Type:** component
- **Calls track():** yes
- **Route:** `/wallet`
- **Handlers:** open event in `useEffect`

## Transfer
- **File:** `app/wallet/components/transfer.tsx`
- **Type:** component
- **Calls track():** yes
- **Handlers:** transfer outcome handlers (success, failure, catch)

## StatsTabs
- **File:** `app/profile/components/stats-tabs.tsx`
- **Type:** component
- **Calls track():** yes
- **Handlers:** tab click handlers

---

## Route-to-File Map

| Route | File | Component |
|---|---|---|
| `/` | `app/page.tsx` | `BuySellPage` |
| `/orders` | `app/orders/page.tsx` | Orders list |
| `/orders/[id]` | `app/orders/[id]/page.tsx` | Order detail |
| `/ads` | `app/ads/page.tsx` | My ads |
| `/ads/create` | `app/ads/create/page.tsx` | Create ad |
| `/ads/edit/[id]` | `app/ads/edit/[id]/page.tsx` | Edit ad |
| `/advertiser/[id]` | `app/advertiser/[id]/page.tsx` | Advertiser profile |
| `/profile` | `app/profile/page.tsx` | User profile |
| `/wallet` | `app/wallet/page.tsx` | Wallet |

## Sheets / Panels (not routes — rendered in-page)

| Component | File | Trigger |
|---|---|---|
| Markets advert sheet | `components/buy-sell/order-sidebar.tsx` | Ad's buy/sell button in `app/page.tsx` |
| Rate slippage dialog | `components/buy-sell/rate-change-confirmation.tsx` | Inside `order-sidebar.tsx` |
| Ad updated dialog | `components/buy-sell/ad-updated-confirmation.tsx` | Inside `order-sidebar.tsx` |
| Markets filter | `components/market-filter/market-filter-dropdown.tsx` | Filter button in `app/page.tsx` |
| Payment method filter | `components/payment-methods-filter/payment-methods-filter.tsx` | Payment method button in `app/page.tsx` |
| Currency selector | `components/currency-filter/currency-filter.tsx` | Currency button in `app/page.tsx` |
| Markets search (mobile) | `components/mobile-advertiser-search.tsx` | Search button in `components/header.tsx` |
