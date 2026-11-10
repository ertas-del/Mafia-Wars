/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHUNK, CHUNKS_X, CHUNKS_Y, MAX_CHUNKS, chunksForView, createChunkCache, drawCityChunk, drawCityOverlay } from './cityRender.ts';
import { generateCity } from './cityGen.ts';
import { BRIDGES } from './cityData.ts';

test('EV-003 constants', () => {
  assert.equal(CHUNK, 512);
  assert.equal(MAX_CHUNKS, 24);
});

test('EV-003 cache never exceeds its limit and evicts least recently used', () => {
  const made: string[] = [];
  const gone: string[] = [];
  const cache = createChunkCache<string>(24, (x, y) => { made.push(`${x},${y}`); return `${x},${y}`; }, (t) => gone.push(t));
  for (let i = 0; i < 100; i++) { cache.get(i % 13, Math.floor(i / 13)); assert.ok(cache.size() <= 24); }
  assert.equal(cache.size(), 24);
  const small = createChunkCache<number>(3, (x) => x, (t) => gone.push(`s${t}`));
  gone.length = 0;
  small.get(1, 0); small.get(2, 0); small.get(3, 0);
  small.get(1, 0); // 1 is now fresh, 2 is the oldest
  small.get(4, 0);
  assert.deepEqual(gone, ['s2']);
  small.get(2, 0); // rebuilt, evicts 3
  assert.deepEqual(gone, ['s2', 's3']);
  assert.equal(small.size(), 3);
});

test('EV-003 a cache hit does not rebuild', () => {
  let n = 0;
  const c = createChunkCache<number>(2, () => ++n);
  c.get(0, 0); c.get(0, 0); c.get(0, 0);
  assert.equal(n, 1);
});

test('EV-003 view plus ring never needs more than 24 pieces, and visible pieces always fit', () => {
  for (const [w, h] of [[915, 412], [1920, 1080]]) {
    for (let x = 0; x < 6400 - w; x += 97) {
      for (let y = 0; y < 4240 - h; y += 89) {
        const list = chunksForView({ x, y, w, h }, 1);
        assert.ok(list.length <= MAX_CHUNKS, `${w}x${h} at ${x},${y}: ${list.length}`);
        const vis = chunksForView({ x, y, w, h }, 0);
        assert.ok(vis.length <= MAX_CHUNKS);
        const keys = new Set(list.map((c) => `${c.cx},${c.cy}`));
        for (const v of vis) assert.ok(keys.has(`${v.cx},${v.cy}`), 'visible piece dropped');
      }
    }
  }
  // A phone view gets its whole one-piece ring.
  for (let x = 600; x < 5000; x += 61) {
    const r = chunksForView({ x, y: 1000, w: 915, h: 412 }, 1);
    const need = (Math.floor((x + 914) / CHUNK) - Math.floor(x / CHUNK) + 3) * (Math.floor(1411 / CHUNK) - Math.floor(1000 / CHUNK) + 3);
    assert.equal(r.length, need);
  }
});

/** A recording 2D context: every method is a no-op that returns something usable, every property is settable. */
function fakeCtx(): { ctx: CanvasRenderingContext2D; calls: { n: number } } {
  const calls = { n: 0 };
  const store: Record<string, unknown> = {};
  const gradient = { addColorStop: () => { calls.n++; } };
  const ctx = new Proxy(store, {
    get(t, p: string) {
      if (p in t) return t[p];
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => { calls.n++; return gradient; };
      if (p === 'measureText') return () => ({ width: 10 });
      return () => { calls.n++; };
    },
    set(t, p: string, v) { t[p] = v; return true; },
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

test('EV-003 every piece of the generated city draws without throwing', () => {
  const city = generateCity(1984);
  const { ctx, calls } = fakeCtx();
  for (let cy = 0; cy < CHUNKS_Y; cy++) for (let cx = 0; cx < CHUNKS_X; cx++) drawCityChunk(ctx, city, cx, cy);
  assert.ok(calls.n > 1000);
  // a piece outside the world still draws (water)
  drawCityChunk(ctx, city, CHUNKS_X + 1, CHUNKS_Y + 1);
});

test('overlay draws for several views and time values without throwing', () => {
  const city = generateCity(1984);
  const { ctx, calls } = fakeCtx();
  for (const t of [0, 1.7, 33.3, 1000.123]) {
    drawCityOverlay(ctx, city, { x: 2150, y: 2150, w: 915, h: 412 }, t);
    drawCityOverlay(ctx, city, { x: 0, y: 0, w: 1920, h: 1080 }, t);
    drawCityOverlay(ctx, city, { x: 6000, y: 4000, w: 915, h: 412 }, t);
  }
  assert.ok(calls.n > 0);
});

test('every BRIDGES entry draws into at least one piece without throwing', () => {
  const city = generateCity(1984);
  for (const br of BRIDGES) {
    let drawn = 0;
    for (let cy = 0; cy < CHUNKS_Y; cy++) {
      for (let cx = 0; cx < CHUNKS_X; cx++) {
        const x0 = cx * CHUNK, y0 = cy * CHUNK;
        const touches = br.points.some((p) => p.x >= x0 && p.x < x0 + CHUNK && p.y >= y0 && p.y < y0 + CHUNK);
        if (!touches) continue;
        const { ctx, calls } = fakeCtx();
        drawCityChunk(ctx, city, cx, cy);
        assert.ok(calls.n > 0);
        drawn++;
      }
    }
    assert.ok(drawn >= 1, `${br.id} drew into no piece`);
  }
});
