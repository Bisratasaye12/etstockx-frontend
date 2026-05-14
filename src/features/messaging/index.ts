/**
 * Messaging feature — shared API hooks, types, and utilities reused by the
 * broker portal and the investor surface.
 *
 * Public API is exposed through deep imports (e.g.
 * `@/features/messaging/api/use-conversations`) to mirror how the rest of the
 * codebase consumes feature slices; this barrel exists only to document scope.
 *
 * Realtime delivery via SignalR (`/hubs/chat`) is not wired yet; that wiring
 * will live under `features/messaging/realtime/` when added.
 */
export {};
