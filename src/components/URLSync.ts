/**
 * URLSync removed in Chunk 1: router is the sole URL/history writer.
 * Kept as no-op export for compatibility with any stale imports during transition.
 */
export function URLSync() {
  return { init() {} };
}
