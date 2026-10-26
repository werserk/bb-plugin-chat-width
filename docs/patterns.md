# Structural failure record

| Date | Invariant / class | Count | Structural fix | Enforcer |
| --- | --- | --- | --- | --- |
| 2026-10-26 | All plugin document listeners have an owned lifecycle | 1 | Remove unused import-time modality tracking from the vendored overlay helper | overlay-lifecycle.test.ts; import-side-effect probe |
| 2026-10-26 | An unsupported conversation never retains a usable stale binding | 1 | Publish null before every pane detection attempt | width-layout.test.ts; mounted SDK navigation probe |
| 2026-10-26 | Width is independent of following the streaming tail | 1 | Resolve a stable top-level timeline ancestor and own the layout marker | Detached-history regression and live anchor measurement |
