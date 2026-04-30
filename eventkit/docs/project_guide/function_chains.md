# Function Chains

Call chains from UI handler down to the outcome function (try/catch or conditional branches).

---

## BuySellPage mount → ek_open_markets

- **Entry point:** `BuySellPage.render`
- **File:** `app/page.tsx`
- **Chain:** `useEffect([], mount)` → fires once on component mount
- **Outcome function:** `app/page.tsx useEffect` (no async — fires unconditionally)
- **Branches:** open event only — no error path

---

## Sidebar profile click → ek_profile_markets

- **Entry point:** `Sidebar.render`
- **File:** `components/sidebar.tsx`
- **Chain:** profile `<a>` onClick → inline `track("ek_profile_markets")`
- **Outcome function:** `components/sidebar.tsx:390 onClick`
- **Branches:** click event — no async outcome

---

## Header + Sidebar notifications click → ek_notifications_markets

- **Entry point:** `Header.render` + `Sidebar.render`
- **File:** `components/header.tsx` + `components/sidebar.tsx`
- **Chain:** notifications bell `div` onClick → inline `track`
- **Outcome function:** `components/header.tsx:104` + `components/sidebar.tsx:250`
- **Branches:** click event — no async outcome
- **Notes:** Multi-parent coverage — both Header and Sidebar fire this tracker

---

## Sidebar Live Chat → ek_ask_amy_markets

- **Entry point:** `Sidebar.handleLiveChat`
- **File:** `components/sidebar.tsx`
- **Chain:** Live Chat nav item onClick → `handleLiveChat()` → `window.Intercom('show')`
- **Outcome function:** `components/sidebar.tsx:239 handleLiveChat()`
- **Branches:** click event — fires before Intercom call

---

## Header search click → ek_search_markets

- **Entry point:** `Header.render`
- **File:** `components/header.tsx`
- **Chain:** search Button onClick → `setUserIsSearchOpen(true)`
- **Outcome function:** `components/header.tsx:95 onClick`
- **Branches:** click event — fires before MobileAdvertiserSearch sheet opens

---

## BuySellPage currency filter → ek_payment_currency_markets

- **Entry point:** `BuySellPage.render`
- **File:** `app/page.tsx`
- **Chain:** CurrencyFilter trigger Button onClick → inline track
- **Outcome function:** `app/page.tsx:500 onClick`
- **Branches:** click event — fires before Popover/Drawer opens

---

## BuySellPage tab switch → ek_buy_markets / ek_sell_markets

- **Entry point:** `BuySellPage.render`
- **File:** `app/page.tsx`
- **Chain:** Tabs `onValueChange` → conditional on tab value
- **Outcome function:** `app/page.tsx:459 Tabs onValueChange`
- **Branches:** `value === 'sell'` → ek_buy_markets; `value === 'buy'` → ek_sell_markets

---

## BuySellPage payment method filter → ek_payment_method_filter_markets

- **Entry point:** `BuySellPage.render`
- **File:** `app/page.tsx`
- **Chain:** PaymentMethodsFilter trigger Button onClick → inline track
- **Outcome function:** `app/page.tsx:567 onClick`
- **Branches:** click event — fires before sheet opens

---

## BuySellPage filter button → ek_filter_markets

- **Entry point:** `BuySellPage.render`
- **File:** `app/page.tsx`
- **Chain:** MarketFilterDropdown trigger Button onClick → inline track
- **Outcome function:** `app/page.tsx:609 onClick`
- **Branches:** click event — fires before filter sheet opens

---

## BuySellPage advert buy/sell → ek_advert_action_markets

- **Entry point:** `BuySellPage.handleOrderClick`
- **File:** `app/page.tsx`
- **Chain:** advert buy/sell button onClick → `handleOrderClick(ad)`
- **Outcome function:** `app/page.tsx:307 handleOrderClick`
- **Branches:** click — `advert_type = ad.type === 'buy' ? 'sell' : 'buy'`

---

## BuySellPage advertiser click → ek_advertiser_profile_markets

- **Entry point:** `BuySellPage.handleAdvertiserClick`
- **File:** `app/page.tsx`
- **Chain:** advertiser name/avatar onClick → `handleAdvertiserClick(advertiserId)`
- **Outcome function:** `app/page.tsx:283 handleAdvertiserClick`
- **Branches:** click — fires on click before any verification gate

---

## EmptyState create ad → ek_create_ad_markets

- **Entry point:** `EmptyState.createAd`
- **File:** `components/empty-state.tsx`
- **Chain:** Create Ad Button onClick → `createAd()` when `route === 'markets'`
- **Outcome function:** `components/empty-state.tsx:46 createAd()`
- **Branches:** guarded by `route === 'markets'`

---

## MobileAdvertiserSearch back → ek_back_markets_search

- **Entry point:** `MobileAdvertiserSearch.handleBack`
- **File:** `components/mobile-advertiser-search.tsx`
- **Chain:** back arrow Button onClick → `handleBack()`
- **Outcome function:** `components/mobile-advertiser-search.tsx:152 handleBack()`
- **Branches:** mobile only

---

## MobileAdvertiserSearch + Sidebar clear → ek_clear_search_markets_search

- **Entry point:** `MobileAdvertiserSearch.handleClear` + `Sidebar.handleClear`
- **File:** `components/mobile-advertiser-search.tsx` + `components/sidebar.tsx`
- **Chain:** clear button onClick → `handleClear()` in both components
- **Outcome function:** `components/mobile-advertiser-search.tsx:145` + `components/sidebar.tsx:167`
- **Notes:** Multi-parent coverage

---

## Search tab switch → ek_buy_tab / ek_sell_tab markets_search

- **Entry point:** `MobileAdvertiserSearch.render` + `Sidebar.render`
- **Chain:** Tabs `onValueChange` in both search components
- **Outcome function:** `components/mobile-advertiser-search.tsx:210` + `components/sidebar.tsx:290`
- **Notes:** `v === 'sell'` → buy_tab; `v === 'buy'` → sell_tab

---

## Search advert action → ek_advert_action_markets_search

- **Entry point:** `MobileAdvertiserSearch.handleBuySellClick` + `Sidebar.handleBuySellClick`
- **Chain:** advert action button → `handleBuySellClick(ad)` in both
- **Outcome function:** `components/mobile-advertiser-search.tsx:139` + `components/sidebar.tsx:158`
- **Notes:** `advert_type = ad.type === 'buy' ? 'sell' : 'buy'`

---

## Search advertiser click → ek_advertiser_profile_markets_search

- **Entry point:** `MobileAdvertiserSearch.handleAdvertiserClick` + `Sidebar.handleAdvertiserClick`
- **Chain:** advertiser name/avatar onClick in both search components
- **Outcome function:** `components/mobile-advertiser-search.tsx:113` + `components/sidebar.tsx:134`

---

## OrderSidebar close → ek_close_markets_advert_sheet

- **Entry point:** `OrderSidebar.handleClose`
- **File:** `components/buy-sell/order-sidebar.tsx`
- **Chain:** close Button + backdrop div onClick → `handleClose()`
- **Outcome function:** `components/buy-sell/order-sidebar.tsx:486 handleClose()`
- **Branches:** fires on every close including backdrop click

---

## OrderSidebar payment method → ek_select_payment_method_markets_advert_sheet

- **Entry point:** `OrderSidebar.handleShowPaymentSelection`
- **File:** `components/buy-sell/order-sidebar.tsx`
- **Chain:** payment method selector div onClick → `handleShowPaymentSelection()`
- **Outcome function:** `components/buy-sell/order-sidebar.tsx:311 handleShowPaymentSelection()`

---

## OrderSidebar place order → ek_place_order_markets_advert_sheet

- **Entry point:** `OrderSidebar.handleSubmit`
- **File:** `components/buy-sell/order-sidebar.tsx`
- **Chain:** Place Order Button onClick → `handleSubmit()`
- **Outcome function:** `components/buy-sell/order-sidebar.tsx:341 handleSubmit()`
- **Branches:** click event with optional error fields

---

## OrderSidebar rate slippage detected → ek_order_rate_slippage_detected_markets_advert_sheet

- **Entry point:** `OrderSidebar.handleSubmit`
- **File:** `components/buy-sell/order-sidebar.tsx`
- **Chain:** `handleSubmit()` → float rate check → `if (marketRate != ad.effective_rate)`
- **Outcome function:** `components/buy-sell/order-sidebar.tsx:349 handleSubmit()`
- **Branches:** trigger event — fires before `showRateChangeConfirmation` is set

---

## RateChangeConfirmation confirm → ek_confirm_rate_change_markets_advert_sheet

- **Entry point:** `RateChangeConfirmation.onConfirm`
- **File:** `components/buy-sell/order-sidebar.tsx`
- **Chain:** `RateChangeConfirmation onConfirm={() => { track(...); proceedWithOrder() }}`
- **Outcome function:** `components/buy-sell/order-sidebar.tsx:758 RateChangeConfirmation onConfirm`

---

## RateChangeConfirmation cancel → ek_cancel_rate_change_markets_advert_sheet

- **Entry point:** `RateChangeConfirmation.onCancel`
- **File:** `components/buy-sell/order-sidebar.tsx`
- **Chain:** `RateChangeConfirmation onCancel={() => { track(...); setShowRateChangeConfirmation(false) }}`
- **Outcome function:** `components/buy-sell/order-sidebar.tsx:760 RateChangeConfirmation onCancel`

---

## OrderSidebar order created → ek_order_created_markets_advert_sheet

- **Entry point:** `OrderSidebar.proceedWithOrder` — success branch
- **File:** `components/buy-sell/order-sidebar.tsx`
- **Chain:** `proceedWithOrder()` → `createOrder()` → `if (order.errors.length === 0)` → track → `router.push`
- **Outcome function:** `components/buy-sell/order-sidebar.tsx:470 proceedWithOrder()`
- **Branches:** trigger success — fires immediately before `router.push` to order detail

---

## OrderSidebar order creation failed → ek_order_creation_failed_markets_advert_sheet

- **Entry point:** `OrderSidebar.proceedWithOrder` — error branches
- **File:** `components/buy-sell/order-sidebar.tsx`
- **Chain:** `proceedWithOrder()` → `createOrder()` → `if (order.errors.length > 0)` and `catch` block
- **Outcome function:** `components/buy-sell/order-sidebar.tsx:377 + 474 proceedWithOrder()`
- **Branches:** trigger failure — fires for all API error codes (line 377) and catch errors (line 474). Passes `error_code` and `error_message`.

---

## OrderSidebar retry order → ek_retry_order_markets_advert_sheet

- **Entry point:** `OrderSidebar.proceedWithOrder` — `OrderFloatRateSlippage` onConfirm
- **File:** `components/buy-sell/order-sidebar.tsx`
- **Chain:** `proceedWithOrder()` → `OrderFloatRateSlippage` alert → `onConfirm` → track
- **Outcome function:** `components/buy-sell/order-sidebar.tsx:404 onConfirm`

---

## OrderSidebar view other ads → ek_view_other_ads_markets_advert_sheet

- **Entry point:** `OrderSidebar.proceedWithOrder` — multiple error `onConfirm` callbacks
- **File:** `components/buy-sell/order-sidebar.tsx`
- **Chain:** `proceedWithOrder()` → `OrderExists`/`v1InsufficientFunds`/`OrderCountryInvalid`/`v1DebitFailed` onConfirm
- **Outcome function:** `components/buy-sell/order-sidebar.tsx:388 + 414 + 425 + 436 onConfirm`
- **Notes:** 'Try different ad' / 'View other ads' button fires in 4 error code handlers

---

## OrderSidebar view active order → ek_view_active_order_markets_advert_sheet

- **Entry point:** `OrderSidebar.proceedWithOrder` — `OrderExists` alert `onCancel`
- **File:** `components/buy-sell/order-sidebar.tsx`
- **Chain:** `proceedWithOrder()` → `OrderExists` alert → `onCancel` → track → `router.push`
- **Outcome function:** `components/buy-sell/order-sidebar.tsx:392 onCancel`

---

## OrderSidebar open live chat → ek_open_live_chat_markets_advert_sheet

- **Entry point:** `OrderSidebar.proceedWithOrder` — `UserReadOnly` alert `onConfirm`
- **File:** `components/buy-sell/order-sidebar.tsx`
- **Chain:** `proceedWithOrder()` → `UserReadOnly` alert → `onConfirm` → track → `window.Intercom('show')`
- **Outcome function:** `components/buy-sell/order-sidebar.tsx:455 onConfirm`

---

## MarketFilterDropdown toggle followed users → ek_toggle_followed_users_markets_filter

- **Entry point:** `MarketFilterDropdown.handleFilterChange`
- **File:** `components/market-filter/market-filter-dropdown.tsx`
- **Chain:** `fromFollowing` checkbox → `handleFilterChange(key)` when `key === 'fromFollowing'`
- **Outcome function:** `components/market-filter/market-filter-dropdown.tsx:74 handleFilterChange()`

---

## MarketFilterDropdown sort by → ek_sort_by_*_markets_filter

- **Entry point:** `MarketFilterDropdown.handleSortByChange`
- **File:** `components/market-filter/market-filter-dropdown.tsx`
- **Chain:** sort RadioGroup → `handleSortByChange(value)`
- **Outcome function:** `components/market-filter/market-filter-dropdown.tsx:87-89 handleSortByChange()`
- **Branches:** `value === 'trade_band_rank'` → tier_level; `value === 'exchange_rate'` → exchange_rate; `value === 'user_rating_average_lifetime'` → user_rating

---

## MarketFilterDropdown apply → ek_apply_filters_markets_filter

- **Entry point:** `MarketFilterDropdown.handleApply`
- **File:** `components/market-filter/market-filter-dropdown.tsx`
- **Chain:** Apply Button onClick → `handleApply()`
- **Outcome function:** `components/market-filter/market-filter-dropdown.tsx:59 handleApply()`
- **Notes:** Mobile only (Apply button)

---

## MarketFilterDropdown reset → ek_reset_filters_markets_filter

- **Entry point:** `MarketFilterDropdown.handleReset`
- **File:** `components/market-filter/market-filter-dropdown.tsx`
- **Chain:** Reset Button onClick → `handleReset()`
- **Outcome function:** `components/market-filter/market-filter-dropdown.tsx:51 handleReset()`

---

## PaymentMethodsFilter select all → ek_select_all_payment_methods_markets_payment_method_filter

- **Entry point:** `PaymentMethodsFilter.handleSelectAll`
- **File:** `components/payment-methods-filter/payment-methods-filter.tsx`
- **Chain:** 'All Payment Methods' checkbox → `handleSelectAll()` when `checked === true`
- **Outcome function:** `components/payment-methods-filter/payment-methods-filter.tsx:88 handleSelectAll()`

---

## PaymentMethodsFilter toggle method → ek_select_payment_method_markets_payment_method_filter

- **Entry point:** `PaymentMethodsFilter.handleMethodToggle`
- **File:** `components/payment-methods-filter/payment-methods-filter.tsx`
- **Chain:** method checkbox → `handleMethodToggle(methodId)`
- **Outcome function:** `components/payment-methods-filter/payment-methods-filter.tsx:104 handleMethodToggle()`
- **Notes:** `payment_method_name = methodId`

---

## PaymentMethodsFilter apply → ek_apply_filter_markets_payment_method_filter

- **Entry point:** `PaymentMethodsFilter.handleApply`
- **File:** `components/payment-methods-filter/payment-methods-filter.tsx`
- **Chain:** Apply Button onClick → `handleApply()`
- **Outcome function:** `components/payment-methods-filter/payment-methods-filter.tsx:142 handleApply()`

---

## PaymentMethodsFilter reset → ek_reset_filter_markets_payment_method_filter

- **Entry point:** `PaymentMethodsFilter.handleReset`
- **File:** `components/payment-methods-filter/payment-methods-filter.tsx`
- **Chain:** Reset Button onClick → `handleReset()`
- **Outcome function:** `components/payment-methods-filter/payment-methods-filter.tsx:132 handleReset()`

---

## CurrencyFilter select currency → ek_select_payment_currency_markets_payment_currency

- **Entry point:** `CurrencyFilter.handleCurrencySelect`
- **File:** `components/currency-filter/currency-filter.tsx`
- **Chain:** currency item onClick → `handleCurrencySelect(currencyCode)`
- **Outcome function:** `components/currency-filter/currency-filter.tsx:59 handleCurrencySelect()`
- **Notes:** `currency_code = selected currency code string`
