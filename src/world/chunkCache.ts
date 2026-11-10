// Least-recently-used cache for the 512 px city pieces. Pure: no DOM, no canvas.
export const CHUNK = 512;
export const MAX_CHUNKS = 24;

/**
 * A small LRU keyed by chunk coordinates. `get` builds a missing piece with `make`, marks it most recently
 * used, and evicts the least recently used pieces (calling `dispose`) until at most `max` remain. The piece
 * just returned is never the one evicted.
 */
export function createChunkCache<T>(
  max: number,
  make: (cx: number, cy: number) => T,
  dispose?: (t: T) => void,
): { get(cx: number, cy: number): T; size(): number } {
  const limit = Math.max(1, Math.floor(max));
  // A Map iterates in insertion order, so the first key is always the least recently used one.
  const items = new Map<number, T>();
  const key = (cx: number, cy: number): number => (cy + 1024) * 4096 + (cx + 1024);
  return {
    get(cx: number, cy: number): T {
      const k = key(cx, cy);
      if (items.has(k)) {
        const hit = items.get(k) as T;
        items.delete(k);
        items.set(k, hit);
        return hit;
      }
      const made = make(cx, cy);
      items.set(k, made);
      while (items.size > limit) {
        const oldest = items.keys().next().value as number;
        const gone = items.get(oldest) as T;
        items.delete(oldest);
        if (dispose) dispose(gone);
      }
      return made;
    },
    size(): number {
      return items.size;
    },
  };
}
