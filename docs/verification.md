# Verification

## Automated checks

The release candidate passes TypeScript, 12 state/layout/SDK lifecycle tests, the public-SDK import scanner, and `bb plugin build` with BB 0.47.1 / SDK 0.6.79. CI runs the same checks. A clean source copy also builds with only production dependencies installed (`npm ci --omit=dev --omit=optional --ignore-scripts` followed by `bb plugin build`).

Tests cover malformed storage, independent presets, bounded numeric values, local-storage fallback, pane isolation, scroll-history column detection, cleanup and ambient-listener lifetime. Independent mounted-SDK probes also checked responsive overlay switching and supported-to-unsupported navigation.

## Live BB checks

Observed in Chromium on 2026-10-26:

- Fresh install keeps native layout; selecting a mode updates both message and input widths.
- Independent preset values survive switching and reload.
- Invalid input keeps the previous valid value and shows a validation message.
- Escape closes the menu and returns focus to its trigger.
- Both columns clamp equally when a side panel opens or the workspace is split.
- Compact-screen controls use a bottom drawer without horizontal page overflow.
- A mid-history width change keeps the visible message anchor within 0.1 CSS px.
- Disable removes the header control and owned layout marks; re-enable recalls preferences.

One initial automated compact-to-desktop sequence appeared to need a reload. A later state readback found that the menu was already expanded and the next click closed it; independent SDK transition probes passed. This is retained as an unclassified observation, not a confirmed runtime defect. Report it if it recurs in ordinary use.

## Scope

Tested target: BB 0.47.1, SDK 0.6.79, Chromium. Other browser/desktop clients and custom themes are not claimed as verified. Internal layout selectors can change between BB versions.
