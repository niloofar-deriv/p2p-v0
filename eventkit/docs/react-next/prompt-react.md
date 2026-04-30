# SetupAgent — React / Next.js

Read `eventkit/docs/react-next/react-setup.md` (all templates live there), `rules_scan.md`, and `architecture.md` before editing anything.

---

## STEP 1 — Check & upgrade the package

Detect PM: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `package-lock.json` → npm, none → npm.

Resolve exact latest version — never write `"latest"`:
```bash
npm view @deriv-com/analytics version
```
Install with the resolved version using flags from the `install` section in react-setup.md. Run whether present or missing. Verify `package.json` shows the exact version. Then check existing `useAnalytics.ts`, `useTrackEvent.ts`, `analytics-provider.tsx` against react-setup.md and fix mismatches.

---

## STEP 2 — Remove deprecated and dead analytics code

Read `rules_scan.md` — source of truth. Run every scan; apply the documented fix for each match.

**Delete:** CDN-pattern files (`window.DerivAnalytics`, `cacheTrackEvents`, script-tag imports) · `use*Trackers.ts/tsx` outside `analytics/flows/` (comment out call sites: `// TODO: ImplementAgent — <original call>`) · stale wrappers (`analyticsService.ts`, `lib/services/analytics*.ts`) · analytics files at non-canonical locations (`lib/providers/*analytics*`, `lib/hooks/use-analytics.ts`, `lib/hooks/use-*-analytics.ts`, `src/analytics/*`) · test files for any of the above.

**Never delete:** `analytics/useAnalytics.ts` · `analytics/useTrackEvent.ts` · `analytics/useTrackers.ts` · `analytics/flows/use*Trackers.ts` · `app/analytics-provider.tsx` — patch only if shape violates.

**Always output REMOVAL REPORT (even if all zeros):**
```
REMOVAL REPORT
  CDN patterns removed:         <count or 0>
  Old per-flow hooks deleted:   <list or "none found">
  Deprecated SDK methods fixed: <count or 0>
  Stale wrappers removed:       <list or "none found">
  Bad-location files removed:   <list or "none found">
```

Confirm no stray files:
```bash
find . -path ./node_modules -prune -o -path ./analytics -prune -o -path ./app -prune \
  -o -name "*analytics*" -type f -print | grep -E "\.(ts|tsx)$"
```
Any result = missed file — investigate before continuing.

---

## STEP 3 — Determine providers

Scan `analytics/useAnalytics.ts` and `.env*`. Both keys → both; PostHog only → PostHog; Rudderstack only → Rudderstack. If neither or only `YOUR_*` placeholders, ask:

> "Which providers?" — [ ] Rudderstack  [ ] PostHog  [ ] Both

---

## STEP 4 — Validate env vars

Scan `.env*`. Use exact names found — never rename or assume. Ask if missing. Required: Rudderstack → write key; PostHog → API key (host optional).

---

## STEP 5 — Scaffold files

Use templates from react-setup.md exactly. Every exported function, hook, and component you create or patch (including Step 6 injections) must have a JSDoc block: what it does, when to call it, constraints, `@example`. Extend with project-specific details (actual auth source, env var names).

- **5a** `analytics/useAnalytics.ts` — create from `custom_hook` template if missing. Replace `YOUR_*` with STEP 4 names. Remove `"use client"` for plain React.
- **5b** `analytics/useTrackEvent.ts` — skip if `SendParams`/`buildAndSend` shape exists. Otherwise create from stub. Leave `eventMetadata` empty with `TODO: ImplementAgent`. Do not create `use*Trackers.ts`.
- **5c** `AnalyticsProvider` (Next.js only) — create `app/analytics-provider.tsx` from `next.js_app_router_integration` template and add to root layout. **Body is `useAnalytics()` + `return <>{children}</>` — nothing else. Never add auth state, `identifyEvent`, or `backfillPersonProperties` here.** Skip for plain React — call `useAnalytics()` in `App.tsx` instead.
- **5d** Tests — if `jest`/`vitest`/`@testing-library/react` detected, create tests using project conventions. Otherwise skip and note.

---

## STEP 6 — Wire identify and reset

**Never call `identifyEvent` and `backfillPersonProperties` in the same `useEffect`. Never put either inside `AnalyticsProvider`.**

Remove any CDN `window.DerivAnalytics` calls for `identifyEvent`, `backfillPersonProperties`, and `reset`.

### 6a — Detect scenario (before writing any code)

```bash
# Form-based auth handlers
grep -r "handleVerif\|handleLogin\|handleOtp\|handleSubmit\|verifyCode\|verifyToken\|onLoginSuccess\|onVerifySuccess\|handleSignup\|handleRegister\|onSignupSuccess\|handleRegisterSubmit" \
  --include="*.tsx" --include="*.ts" -l .

# Token-based URL param auth (email link, signup redirect, password reset)
grep -r "searchParams\.get.*token\|verifyToken" --include="*.tsx" --include="*.ts" -l .
```

- **Scenario A** — in-app login/signup form with a success callback, OR a `?token=` URL param handler. An app can have both — each is a separate auth completion point. Auto-redirecting to `/login` does not make it Scenario B.
- **Scenario B** — no in-app auth at all. Always loads already-authenticated (embedded widget, external SSO with no local callback).

**Before writing any code, state:**
1. Scenario and why (name the file/function that determined it).
2. Every file + function where `identifyEvent` will be injected.
3. Where `reset()` goes or that `AuthWatcher` will be created.

Uncertain → list candidates and ask.

### 6b — identifyEvent

Follow `identify_event` section in react-setup.md for templates and examples.

- **Scenario A:** inject into every auth completion point from 6a (form handlers and token handler). Edge case: if `externalId` only comes from `getSession()` and not the verify response, call `getSession()` first inside the handler, then read `externalId` from the store. Do **not** call `backfillPersonProperties` in any handler.
- **Scenario B:** create `useAnalyticsIdentify` from `scenario_b` template. Mount near app root — not inside `AnalyticsProvider`. Add `← verify` comments.

### 6c — backfillPersonProperties (PostHog only — skip entirely if not configured)

Follow `backfill_person_properties` section in react-setup.md for template.

- **Scenario A: always required.** Create `useAnalyticsIdentify` from `usage_in_the_main_layout` template. Mount near app root — not inside `AnalyticsProvider`.
- **Scenario B: never call.** If present anywhere, remove it.

### 6d — reset

```bash
grep -r "logout\|signOut\|handleLogout\|onLogout\|logOut" --include="*.tsx" --include="*.ts" -l .
```

- Found → call `reset()` inside the handler. See `option_a` template in react-setup.md.
- Not found → create `AuthWatcher` from `option_b` template. Mount near app root.

---

## STEP FINAL — Completion summary

Stack · package version · files created/rewritten/validated · providers wired · env vars confirmed/missing · identify/backfill/reset wired (file + function) or TODO · unresolved TODOs · 2–4 next-step bullets.

`verified` + empty TODOs → ImplementAgent can run. Any TODOs → gate blocks.
