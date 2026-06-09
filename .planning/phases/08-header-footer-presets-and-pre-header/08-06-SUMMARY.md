# Plan 08-06 Summary — BuilderHeader Phase 8 Additions

**Status**: COMPLETE  
**Commit**: ab12521

## What was done
Rewrote `apps/client/src/components/builder/BuilderHeader.tsx`:
- New required props: `doc: NewsletterDoc | null`, `onUpdateHeader`, `onUpdateFooter`, `onUpdatePreHeader`
- Outer `div.sticky` wrapper containing existing `<header>` toolbar + new rows
- New pre-header row: `<input>` with 90-char limit, live `N/90` counter below main toolbar
- New RIGHT section buttons: "Header" and "Footer" (outline size-sm) — open respective PresetSelector
- Two controlled `<PresetSelector>` instances (headerSelectorOpen / footerSelectorOpen state)

## Outcome
BuilderHeader extended without breaking existing title-rename + save-status functionality.
