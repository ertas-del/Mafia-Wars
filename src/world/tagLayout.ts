/**
 * Name-tag layout: places tag boxes so that no two overlap. Pure module.
 *
 * A request's `x`, `y` is the top-left corner of its tag box where it would like to sit
 * (normally centred just above the head), `w`, `h` its size, all in the same pixel space.
 * Higher `priority` is placed first (ties keep input order). Each later tag is lifted upward
 * in small steps until it clears every tag already placed; a tag that cannot clear within
 * MAX_STEPS steps is dropped. At most `max` tags are returned, each with its final top-left.
 */

export interface TagRequest {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  priority: number;
}

export interface PlacedTag {
  id: string;
  x: number;
  y: number;
}

/** How many upward steps a tag may take before it is dropped. */
export const TAG_MAX_STEPS = 12;

/** Step size for a tag of height h: a quarter of its height, at least 2 px. */
export function tagStep(h: number): number {
  return Math.max(2, Math.round(h / 4));
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** True when the two boxes share interior area (touching edges do not count). */
export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function layoutTags(reqs: readonly TagRequest[], max = 4): PlacedTag[] {
  const limit = Number.isFinite(max) ? Math.floor(max) : 0;
  if (limit <= 0 || !reqs || reqs.length === 0) return [];
  const order = reqs
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r && Number.isFinite(r.x) && Number.isFinite(r.y) && Number.isFinite(r.w) && Number.isFinite(r.h) && r.w > 0 && r.h > 0)
    .sort((a, b) => (b.r.priority || 0) - (a.r.priority || 0) || a.i - b.i);

  const placed: Box[] = [];
  const out: PlacedTag[] = [];
  const seen = new Set<string>();
  for (const { r } of order) {
    if (out.length >= limit) break;
    if (seen.has(r.id)) continue;
    const step = tagStep(r.h);
    for (let s = 0; s <= TAG_MAX_STEPS; s++) {
      const box = { x: r.x, y: r.y - s * step, w: r.w, h: r.h };
      if (!placed.some((p) => boxesOverlap(p, box))) {
        placed.push(box);
        out.push({ id: r.id, x: box.x, y: box.y });
        seen.add(r.id);
        break;
      }
    }
  }
  return out;
}
