# React / Next.js — Call Chain Trace Examples

Worked examples for the 8d Call Chain Trace. The mandatory format is defined in `prompt.md — STEP 8d`; these examples show correct application.

---

## example_1 — prop_callback_chain

```
CALL CHAIN TRACE: ek_save_document
  Step 1: UI element
    File: components/DocumentForm.tsx
    Line: 45
    Code: onClick={handleSave}

  Step 2: First function called
    → Calls: handleSave (local function)
    → Is this the outcome owner? (Does it have try/catch or state changes?)
       ❌ NO - Calls props.onSave

  Step 3: Second function called
    File: app/documents/page.tsx
    Line: 67
    → Calls: onSave prop → saveDocument()
    → Is this the outcome owner?
       ✓ YES - Has try/catch and api.save() call

  ✓ OUTCOME OWNER FOUND: app/documents/page.tsx:34 saveDocument()
  ✓ TRACKER PLACEMENT: Inside try block after api.save() succeeds (line 37)
```

---

## example_2 — inline_handler

```
CALL CHAIN TRACE: ek_continue_desktop
  Step 1: UI element
    File: components/QRScreen.tsx
    Line: 105
    Code: onClick={onContinueDesktop}

  Step 2: First function called
    → Calls: onContinueDesktop (prop from parent)
    → Is this the outcome owner?
       ❌ NO - It's a prop, need to find where it's defined

  Step 3: Prop definition
    File: components/Provider.tsx
    Line: 245
    → Inline: () => setCurrentStep('upload')
    → Is this the outcome owner?
       ✓ YES - Directly changes state, no further delegation

  ✓ OUTCOME OWNER FOUND: components/Provider.tsx:245 inline handler
  ✓ TRACKER PLACEMENT: Inside inline arrow function, before setCurrentStep()
```
