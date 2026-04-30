# React / Next.js — Anti-Pattern Scan Procedure

Run the checks below whenever existing EventKit tracking code is detected (STEP 4B of `prompt.md`). Output the full results table **before** proceeding to parse or implement any trackers.

---

## detection

Run ALL checks below when `useTrackers.ts` is found:

```bash
find . -name "useTrackers.ts" -o -name "useTrackers.tsx" 2>/dev/null \
  | grep -v node_modules | grep -v .next | head -5
```

If not found: this is the first run. Skip this file and proceed to STEP 4C.

## scan_commands

```bash
# 1. Direct @deriv-com/analytics import outside analytics/
grep -rn "from '@deriv-com/analytics'" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  | grep -v "analytics/useTrackEvent"

# 2. CDN window.DerivAnalytics pattern
grep -rn "window\.DerivAnalytics\|window?\.DerivAnalytics\|cacheTrackEvents\.loadEvent" . \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.next

# 3. Old single-hook pattern — switch cases directly in useTrackers.ts (should be in flow files)
grep -n "case '" analytics/useTrackers.ts 2>/dev/null | grep "'ek_\|\"ek_"
# Any hit = cases were not migrated to analytics/flows/ — extract to per-flow hooks

# 4. Unconditional track — fires outside mutually exclusive branches
grep -rn "track('" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  -A 1 | grep -B 1 "try {"
# Also check manually: track() placed outside an if/else block when track() also exists inside it
# Any track() not inside a branch (try/catch, if/else, .then/.catch) is a candidate for double-fire

# 5. Null or undefined error fields in track calls
grep -rn "error_message.*null\|error_code.*null\|error_message.*undefined\|error_code.*undefined" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next

# 6. Open event outside useEffect
grep -rn "track('ek_open_\|track(\"ek_open_" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next
# Verify each match is inside a useEffect — any match outside useEffect is a violation

# 7. Missing @eventkit-cases markers in per-flow hook files
find analytics/flows -name "use*Trackers.ts" 2>/dev/null | while read f; do
  count=$(grep -c "@eventkit-cases-start\|@eventkit-cases-end" "$f" 2>/dev/null || echo 0)
  echo "$f: $count markers (expect 2)"
done
# Each flow file must have exactly 2 marker lines — missing means markers were removed

# 8. track() at call site instead of inside outcome function
grep -rn "track('" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  -A 1 | grep -B 1 "[a-zA-Z]\+();"

# 9. Unresolved // TODO: ImplementAgent — comments
grep -rn "TODO: ImplementAgent" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next

# 10. Coverage — spec count vs implemented count
grep -c '"eventkit_id"' eventkit/trackers/<flow_slug>.json
grep -h 'case "ek_' analytics/flows/use*Trackers.ts 2>/dev/null | wc -l
# Spec count must equal implemented count across all flow hook files
# Note: React/Next cases use bare "ek_" (no project prefix) — see Global Rule 2

# 11. track() inside try before API response check (in-band outcomes)
grep -rn "track('" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  -A 2 | grep -B 2 "await "
# Manual: flag any track() that precedes the await/response — outcome is unknown at that point

# 12. All parents of reusable components covered
grep -rn "on[A-Z][a-zA-Z]*={" . \
  --include="*.tsx" --include="*.ts" \
  --exclude-dir=node_modules --exclude-dir=.next
# Manual: for each callback prop, verify every parent component that passes it has a tracker

# 13. Every action event tracked on both success AND error branches
# Find catch blocks that contain no track() — potential missing error-path trackers
grep -rn "} catch" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  -A 5 | grep -v "track("
# Find try blocks that contain no track() — potential missing success-path trackers
grep -rn "try {" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  -A 10 | grep -v "track("
# Manual: for each action event (submit, click, etc.), confirm track() exists in ALL branches:
#   - try/catch: track() inside try (success) AND inside catch (error)
#   - if/else: track() inside if-branch (success) AND inside else-branch (error) — never outside
#   - .then/.catch: track() in .then (success) AND in .catch (error) — never before the call
# A track() that exists only in one branch = missing coverage on the other path

# 14. Misplaced call sites — track() in server/non-client context
grep -rn "track('ek_\|track(\"ek_" . \
  --include="*.ts" \
  --exclude-dir=node_modules --exclude-dir=.next \
  | grep -v "analytics/"
# .ts files outside analytics/ are server/utility code — hooks cannot run there
# Manual: for .tsx matches, verify 'use client' is present — Server Components cannot call track()

# 15. data_eventkit_id usage (must use eventkit_id only)
grep -rn "data_eventkit_id" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next

# 16. PREFIX constant in React/Next flow files (Flutter-only pattern — must not exist here)
grep -rn "const PREFIX\|PREFIX_\|PREFIX =" analytics/flows/ \
  --include="*.ts" 2>/dev/null
# Any match = the file uses the Flutter PREFIX anti-pattern — remove it and change
# switch(`${PREFIX}_${trackId}`) to switch(trackId), then update all case strings
# from "project_ek_..." to "ek_..." (→ See Global Rule 2 in ../implementation_guide.md)

# 17. Failure trigger events missing error params (must pass errorCode + errorMessage)
# Find flow hook cases for failure triggers (ek_*_failed) and check they read error params
grep -A 10 'case "ek_.*_failed' analytics/flows/*.ts 2>/dev/null | grep -v "error_code\|error_message\|errorCode\|errorMessage"
# Manual: for each failure trigger case in the flow hooks, confirm the send() call includes
# error_code: String(params?.error_code ?? "") and error_message: String(params?.error_message ?? "")
# Also confirm the call site passes { error_code: ..., error_message: ... } to track()
```

## required_output

Output this table before proceeding:

```
| #  | Check                                                        | Files Found        | Status    |
|----|--------------------------------------------------------------|--------------------|-----------|
| 1  | Direct @deriv-com/analytics import (outside analytics/)      | <count>            | PASS/FAIL |
| 2  | CDN window.DerivAnalytics / cacheTrackEvents                 | <count>            | PASS/FAIL |
| 3  | Old single-hook pattern (cases in useTrackers.ts directly)   | <count>            | PASS/FAIL |
| 4  | Unconditional track before try                               | <count>            | PASS/FAIL |
| 5  | Null/undefined error fields                                  | <count>            | PASS/FAIL |
| 6  | Open event outside useEffect                                 | <count>            | PASS/FAIL |
| 7  | @eventkit-cases markers present in each flow hook            | 2 per file         | PASS/FAIL |
| 8  | track() at call site instead of inside outcome function      | <count>            | PASS/FAIL |
| 9  | Unresolved // TODO: ImplementAgent — comments                | <count>            | PASS/FAIL |
| 10 | Coverage: spec count = implemented count                     | <spec>=<impl>      | PASS/FAIL |
| 11 | track() before in-band API response check                    | manual review      | PASS/FAIL |
| 12 | All parents of reusable component covered                    | manual review      | PASS/FAIL |
| 13 | Every action event tracked on both success AND error branches | manual review      | PASS/FAIL |
| 14 | Misplaced call sites (track() in server/non-client context)  | <count>            | PASS/FAIL |
| 15 | data_eventkit_id usage (must use eventkit_id only)           | <count>            | PASS/FAIL |
| 16 | PREFIX constant in flow files (Flutter-only — must not exist) | <count>            | PASS/FAIL |
| 17 | Failure trigger events missing error_code/error_message       | manual review      | PASS/FAIL |
```

## fail-fast_rules

- You MUST output the full table — skipping it is not allowed
- Any row marked FAIL must be fixed before proceeding
- **Check #3 FAIL:** extract each `case` block from `useTrackers.ts` into `analytics/flows/use<FlowName>Trackers.ts` (one file per flow), import and compose each flow hook in the `useTrackers.ts` aggregator, then remove the cases (and any markers) from `useTrackers.ts`
- **Check #8 FAIL:** follow the call chain to the function with the actual try/catch; place the tracker there (→ See Global Rule 6 in `../implementation_guide.md`)
- **Check #9 FAIL:** find the matching tracker in spec → replace with `track()` call; if no spec match → delete the comment
- **Check #10 FAIL:** find every `"eventkit_id"` in the spec that has no matching `case` in `useTrackers.ts` and implement it (→ See Global Rule 5 in `../implementation_guide.md`)
- **Check #11 FAIL:** move the `track()` call to after the response is read and each outcome branch is determined (→ See React Rule 12 in `rules.md`)
- **Check #12 FAIL:** grep for all usages of the prop across the codebase; add a tracker in every parent that is missing one (→ See Global Rule 10 in `../implementation_guide.md`)
- **Check #13 FAIL:** for each action event missing a branch, add `track()` to the uncovered branch — success-only trackers need an error-branch call with `error_message`/`error_code`; error-only trackers need a success-branch call (→ See React Rules 8, 12 in `rules.md`)
- **Check #14 FAIL:** `track()` cannot be called in Server Components or plain `.ts` utilities — move the call to a `'use client'` component (→ See React Rule 11 in `rules.md`)
- **Check #15 FAIL:** replace all `data_eventkit_id` references with `eventkit_id` (→ See Global Rule 3 in `../implementation_guide.md`)
- **Check #16 FAIL:** remove `const PREFIX = ...` from each affected flow file; change `switch(\`${PREFIX}_${trackId}\`)` to `switch(trackId)`; update all case strings by stripping the project prefix (`"my_app_ek_..."` → `"ek_..."`) — run `sed -i '' 's/"<project_name>_ek_/"ek_/g' <file>` per file (→ See Global Rule 2 in `../implementation_guide.md`)
- **Check #17 FAIL:** for each failure trigger case missing error params: (1) add `error_code: String(params?.error_code ?? "")` and `error_message: String(params?.error_message ?? "")` to the `send()` call in the flow hook; (2) update the call site to pass `{ error_code: ..., error_message: ... }` to `track()` (→ See event_types in `../implementation_guide.md`)
- After fixing, re-run all scans and output a second clean table confirming 0 findings
