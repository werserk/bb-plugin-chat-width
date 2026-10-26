# Compatibility observations

Observed on BB 0.47.1 / SDK 0.6.79 in the user's real Chromium client on 2026-10-26.

- Conversation routes use /threads/<id>. The Personal project does not use a project-prefixed thread route.
- Each conversation header and window share a [data-split-pane-id] ancestor.
- [data-thread-window] contains one [data-page-scroll-viewport].
- The message column has native max-width 760 CSS px in the inspected pane. Find it as the closest .mx-auto.w-full ancestor of the unique [data-timeline-row-list="top-level"]. The [data-scroll-attached] attribute is transient: it disappears while reading away from the streaming tail and must not be used as a layout selector.
- .chat-prompt-box contains [data-app-composer-role="primary"] and uses the same native max-width and horizontal padding.
- The host measures the message column into --md-content-w; leave that property to its existing ResizeObserver.
- [data-timeline-row-id] identifies virtualized message rows for a visible-row scroll anchor.
- The viewport explicitly disables browser overflow anchoring, so width updates need a measured visible-row/bottom anchor.
- New-thread compose is separate and does not have this conversation-header binding.

These are internal DOM attributes, not a public width API. Unknown/ambiguous markup must stay native. Real feature/lifecycle verification is recorded separately after implementation.
