# Migration Run

This file is only needed when a legacy `eventkit/docs/project_guide.md` exists. Once migration is complete it will never be read again.

---

A legacy `eventkit/docs/project_guide.md` is a single-file guide from an older agent run. It contains useful content but the format is stale.

### 1. Read the legacy file in full

```bash
cat eventkit/docs/project_guide.md
```

### 2. Extract content into the five sub-files

Map legacy sections to new sub-files:

| Legacy section heading (common patterns) | Target sub-file |
|------------------------------------------|-----------------|
| "Directory Structure", "File Tree", "Folder Structure" | `directory_tree.md` |
| "Components", "Active Components", "Hooks", "Call Sites" | `active_components.md` |
| "Dead Code", "Deprecated", "Unused", "Stubs" | `dead_code.md` |
| "Function Chains", "Call Chains", "Handler → API" | `function_chains.md` |
| Everything else / introductory text | `README.md` summary section |

If a section is missing from the legacy file, build it from scratch using the content spec in `project_guide_builder.md` for that sub-file.

### 3. Create the folder and write all five sub-files

```bash
mkdir -p eventkit/docs/project_guide
```

### 4. Delete the legacy file

```bash
rm eventkit/docs/project_guide.md
```

### 5. Write `README.md` with the current HEAD commit as `last_updated_commit`

> **Rule:** Content from the legacy file takes precedence over shell output for historical context (e.g., chain notes the previous agent wrote manually). Supplement, don't discard.
