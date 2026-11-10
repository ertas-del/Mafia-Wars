// Small pure geometry helpers shared by the city data and generator.
import type { Pt } from '../cityData.ts';

/** Even-odd point-in-polygon test. */
export function pointInPoly(x: number, y: number, poly: readonly Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function ellipsePoly(cx: number, cy: number, rx: number, ry: number, n = 20): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    out.push({ x: Math.round(cx + Math.cos(t) * rx), y: Math.round(cy + Math.sin(t) * ry) });
  }
  return out;
}

/** Sutherland-Hodgman clip of a polygon to the horizontal band ymin <= y <= ymax. */
export function clipPolyY(poly: readonly Pt[], ymin: number, ymax: number): Pt[] {
  const clipEdge = (pts: Pt[], inside: (p: Pt) => boolean, edgeY: number): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i < pts.length; i++) {
      const cur = pts[i];
      const prev = pts[(i + pts.length - 1) % pts.length];
      const ci = inside(cur);
      const pi = inside(prev);
      if (ci !== pi) {
        const t = (edgeY - prev.y) / (cur.y - prev.y);
        out.push({ x: Math.round(prev.x + (cur.x - prev.x) * t), y: edgeY });
      }
      if (ci) out.push(cur);
    }
    return out;
  };
  let pts: Pt[] = poly.map((p) => ({ x: p.x, y: p.y }));
  if (Number.isFinite(ymin)) pts = clipEdge(pts, (p) => p.y >= ymin, ymin);
  if (Number.isFinite(ymax)) pts = clipEdge(pts, (p) => p.y <= ymax, ymax);
  return pts;
}

export function distToSegment(px: number, py: number, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  let t = l2 === 0 ? 0 : ((px - a.x) * dx + (py - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}
