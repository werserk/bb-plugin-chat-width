# Chat Width architecture

## Homes
README.md is the user/developer entry point. This file owns module boundaries and runtime decisions. docs/compatibility.md owns observed host selectors and tested versions. README.md describes the product contract. CHANGELOG.md records releases.

## Structure
- server.ts is the minimal BB-required backend factory; it registers no services or RPC.
- app.tsx registers one conversation-header control and a trusted content-script generation. It owns the popover/drawer UI.
- width-state.ts owns validated presets, browser-local storage, preview/commit state and subscriptions.
- width-layout.ts owns all host DOM selectors, per-pane width changes, scroll anchoring and cleanup.
- app.css owns scoped control styles and layout overrides.
- components/ui, hooks and lib contain only host-vendored overlay dependencies.

Allowed imports: app -> state/layout/UI. state and layout do not import app or each other. The server imports only the public SDK type.

## Operations
Run npm run typecheck, npm test, npm run check:sdk and npm run build. scripts/check-sdk.mjs applies the SDK's import scanner with an exact allowlist of the public UI packages used by the plugin; CI runs it too. The SDK is pinned in package.json. Runtime state lives only in a versioned localStorage record namespaced by the public runtime plugin ID. Build artifacts live in ignored dist/. Installation/reload is owned by BB. assets/icon.svg is the one artwork source for branding and the namespaced header glyph.

## Rationale
Header-instance binding uses the host's observed pane ancestor; it avoids a global route observer. The unique top-level timeline locates the stable centered column; owned markers keep CSS independent from transient scroll-attachment attributes. CSS naturally clamps each pane without overwriting the saved preference. Native mode removes owned overrides entirely. The content-script generation owns cleanup, including during hot reload. Unused document-level modality tracking is removed from the vendored overlay helper because its import-time listeners cannot participate in plugin cleanup.
