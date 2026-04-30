# Project Guide

| Sub-file | Contents |
|----------|----------|
| [directory_tree.md](directory_tree.md) | Source folder tree (analytics, app/pages, components, lib) |
| [active_components.md](active_components.md) | Components, hooks, and functions that call track(); parent components; route-to-file map |
| [dead_code.md](dead_code.md) | Unused files, deprecated stubs — do not instrument |
| [function_chains.md](function_chains.md) | UI handler → outcome function call chains |

**last_updated_commit:** 2317330d
**stack:** REACT_SINGLE

---

## Analytics Service

- **Package**: `@deriv-com/analytics` v1.41.1
- **Service class**: `Analytics` (imported from `@deriv-com/analytics`)
- **Only accessed in**: `analytics/useTrackEvent.ts`
- **Initialized in**: `analytics/useAnalytics.ts` → mounted via `app/analytics-provider.tsx` in root layout

## Global Tracker Function

- **File**: `analytics/useTrackEvent.ts`
- **Export**: `useTrackEvent()` → returns `{ send }`
- **Pattern**: `send` is a stable callback from `useCallback(buildAndSend, [])`. All runtime values read at call time via Zustand `getState()`.
- **Directive**: `"use client"` at top (Next.js App Router)

## Runtime Value Sources

| Field | Source |
|---|---|
| `project_name` | `"p2p_web_app"` — hardcoded |
| `page_name` | `params.pageName` — per tracker call |
| `account_type` | `useUserDataStore.getState().brand?.toLowerCase()` — only when `userId` non-null |
| `user_language` | `useLanguageStore.getState().locale` |
| `country_of_residence` | `useUserDataStore.getState().residenceCountry?.toLowerCase()` |
| `is_profile_completed` | `useUserDataStore.getState().onboardingStatus?.p2p?.allowed ?? false` |

## State Management

**Zustand** stores:
- `useUserDataStore` — `userId`, `brand`, `residenceCountry`, `onboardingStatus`
- `useLanguageStore` — `locale` (BCP 47)
- `useMarketFilterStore` — `activeTab`, `currency`, `sortBy`, `filterOptions`
