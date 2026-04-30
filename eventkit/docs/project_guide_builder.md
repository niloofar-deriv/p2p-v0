# Project Guide Builder

This file is the authoritative spec for building, validating, and migrating the EventKit project guide. It is invoked from STEP 4 of `prompt.md`. Follow every instruction in this file before proceeding to STEP 4B.

---

## what_the_project_guide_is

The project guide is a **folder** at `eventkit/docs/project_guide/` containing five sub-files. Each sub-file covers one concern. Agents load only what they need — this is why the guide is a folder, not a single file.

```
eventkit/docs/project_guide/
├── README.md              ← index: one-line description of each sub-file + last-updated commit
├── directory_tree.md      ← relevant src tree (analytics/, app/, lib/, pages/ — not node_modules)
├── active_components.md   ← components, hooks, and functions that call track(), with their parent components
├── dead_code.md           ← unused components, functions, deprecated files, stubs — do not instrument these
└── function_chains.md     ← call chains from UI handler down to the try/catch or conditional outcome
```

---

## detect_run_type

Run this detection before doing anything else:

```bash
# Check for legacy single-file guide
ls eventkit/docs/project_guide.md 2>/dev/null && echo "LEGACY" || echo "not legacy"

# Check for new folder
ls eventkit/docs/project_guide/ 2>/dev/null && echo "FOLDER_EXISTS" || echo "no folder"
```

| Condition | Run type |
|-----------|----------|
| `project_guide/` folder exists | SUBSEQUENT RUN — go to [subsequent_run](#subsequent_run) |
| `project_guide.md` exists, no folder | MIGRATION RUN — go to [migration_run](#migration_run) |
| Neither exists | FIRST RUN — go to [first_run](#first_run) |

---

## first_run

### 1. Create the folder

```bash
mkdir -p eventkit/docs/project_guide
```

### 2. Get current HEAD commit

```bash
git rev-parse --short HEAD
```

Record the SHA — it goes into `README.md`.

### 3. Build each sub-file

Build all five sub-files using the content specs below. Write them in order: `directory_tree.md` → `active_components.md` → `dead_code.md` → `function_chains.md` → `README.md` (index last, after you know what went in the others).

---

## migration_run

Follow the instructions in [migration_run.md](migration_run.md). Load that file only when this run type is detected.

---

## subsequent_run

### 1. Read `README.md` to get `last_updated_commit`

```bash
cat eventkit/docs/project_guide/README.md
```

### 2. Compare to HEAD

```bash
git rev-parse --short HEAD
git log --oneline <last_updated_commit>..HEAD -- \
  analytics/ app/ lib/ pages/ components/ src/ hooks/ 2>/dev/null | head -20
```

If the commit log is empty (HEAD == last_updated_commit), the guide is **fresh** — skip patching and proceed to STEP 4B.

If there are commits since last update, identify which sub-files are stale:

| Changed paths | Stale sub-files |
|---------------|-----------------|
| `analytics/`, `hooks/` | `active_components.md`, `function_chains.md` |
| `app/`, `pages/`, `components/`, `lib/` | `active_components.md`, `dead_code.md`, `function_chains.md` |
| Any structural rename / deletion | `directory_tree.md` + all above |

### 3. Patch stale sub-files only

Re-build each stale sub-file using its content spec. Leave fresh sub-files untouched.

### 4. Update `last_updated_commit` in `README.md`

---

## content_specs

### README.md

```markdown
# Project Guide

| Sub-file | Contents |
|----------|----------|
| [directory_tree.md](directory_tree.md) | Source folder tree (analytics, app/pages, components, lib) |
| [active_components.md](active_components.md) | Components, hooks, and functions that call track(); parent components |
| [dead_code.md](dead_code.md) | Unused files, deprecated stubs — do not instrument |
| [function_chains.md](function_chains.md) | UI handler → outcome function call chains |

**last_updated_commit:** <sha>
**stack:** <REACT_SINGLE | REACT_MONO | FLUTTER_MONO>
```

---

### directory_tree.md

Run:

```bash
# React/Next
find . \( -path ./node_modules -o -path ./.next -o -path ./build -o -path ./dist \) -prune \
  -o -type f \( -name "*.ts" -o -name "*.tsx" \) -print \
  | grep -E "^./(analytics|app|pages|components|hooks|lib|src)/" \
  | sort

# Flutter
find lib/ packages/ -name "*.dart" | grep -v ".dart_tool" | sort
```

Include only paths relevant to tracker instrumentation. Omit test files, generated files, config files, and third-party vendored code.

Format as a fenced tree block:

```
analytics/
  flows/
    useMarketsTrackers.ts
    useOrdersTrackers.ts
  useTrackers.ts
  useTrackEvent.ts
app/
  markets/
    page.tsx
  orders/
    [id]/
      page.tsx
```

---

### active_components.md

List every component, hook, or standalone function that:
- calls `track()` directly, OR
- is a parent of a component that calls `track()`, OR
- contains a handler that will be traced in `function_chains.md`

Format:

```markdown
## <ComponentName | functionName>
- **File:** `app/orders/[id]/page.tsx`
- **Type:** component / hook / function
- **Calls track():** yes / via child
- **Parent of:** <ChildComponent> (if applicable)
- **Handlers:** `handleSubmit`, `handleCancel`, `handleCancelOrder`
- **Notes:** <any relevant detail — e.g., "mounts once per route navigation">
```

Run to find call sites:

```bash
grep -rn "track(" . \
  --include="*.ts" --include="*.tsx" --include="*.dart" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=build \
  | grep -v "analytics/flows\|useTrackers\|useTrackEvent"
```

---

### dead_code.md

List every file that is:
- not reachable from any route or entry point
- a deprecated stub (empty default export, `// deprecated`, `// TODO: remove`)
- a duplicate of another component with a renamed suffix (`Old`, `Legacy`, `V1`, `Backup`)
- explicitly marked unused with a comment

Format:

```markdown
## Dead Files

| File | Reason |
|------|--------|
| `components/OldSignupForm.tsx` | Superseded by `SignupForm.tsx`, no imports found |
| `lib/legacyApi.ts` | `// deprecated — use api/client.ts instead` |
```

Run to find candidates:

```bash
# Files with no imports pointing to them (React/Next)
for f in $(find . -path ./node_modules -prune -o -name "*.tsx" -print | grep -v node_modules); do
  base=$(basename "$f" .tsx)
  count=$(grep -rl "$base" . --include="*.ts" --include="*.tsx" \
    --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null | grep -v "$f" | wc -l)
  [ "$count" -eq 0 ] && echo "$f (0 imports)"
done

# Deprecated markers
grep -rln "deprecated\|TODO: remove\|@deprecated" . \
  --include="*.ts" --include="*.tsx" --include="*.dart" \
  --exclude-dir=node_modules --exclude-dir=.next
```

If no dead code is found, write:

```markdown
## Dead Files

None found at last scan (<sha>).
```

---

### function_chains.md

List the call chain from every UI handler that will trigger a tracker, down to the function that contains the actual outcome (`try/catch`, `if/else`, `.then/.catch`).

This is the primary input for STEP 8d (outcome-owner tracing) in `prompt.md`. When this file is fresh, STEP 8d may skip re-tracing chains that are already documented here.

Format per chain:

```markdown
## <handler_name> → <outcome_function>

- **Entry point:** `OrderDetailsPage.handleCancelOrder`
- **File:** `app/orders/[id]/page.tsx:42`
- **Chain:** `handleCancelOrder` → `OrdersAPI.cancelOrder` → (try/catch in `handleCancelOrder`)
- **Outcome function:** `app/orders/[id]/page.tsx:55 handleCancelOrder` (contains the try/catch)
- **Branches:**
  - success: `result.success === true`
  - error (in-band): `result.success === false`
  - error (exception): `catch (error)`
- **Notes:** showAlert confirmation step precedes the async call — cancel button fires click tracker before API call
```

Run to find handlers as starting point:

```bash
# React/Next — find onClick, onSubmit, onConfirm, and similar handler props
grep -rn "on[A-Z][a-zA-Z]*={" . \
  --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  | grep -v "analytics/"

# Find try/catch blocks (outcome owners)
grep -rn "} catch\|try {" . \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  | grep -v analytics/
```

Trace each handler manually by reading the source. Document the full chain — do not guess. If a chain ends in an external library without an inspectable outcome, note: "outcome not inspectable — track at call site."

---

## rules

1. **Never create `eventkit/docs/project_guide.md`** — the flat file is the legacy format. Always use the folder.
2. **Never delete `eventkit/docs/` files** — see Global Rule 10 in `implementation_guide.md`. Exception: deleting `project_guide.md` during a migration run is the only permitted deletion.
3. **Do not include `node_modules`, `.next`, `build`, `dist`, or generated files** in any sub-file.
4. **`function_chains.md` must document outcomes, not just entry points.** An entry point without a traced outcome is incomplete.
5. **`dead_code.md` must never be empty** — if no dead code exists, write the "None found" note with the current SHA.
6. **`README.md` must always have `last_updated_commit`** — without it, subsequent-run detection cannot determine freshness.
7. **On migration run:** follow [migration_run.md](migration_run.md) — do not inline migration steps here.
