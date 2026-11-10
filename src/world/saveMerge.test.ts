/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeSavedById } from './saveMerge.ts';

type R = { id: string; x: number; y: number; width: number; height: number; ownerFamily: string; level: number; uncollectedCash: number };
const KEEP: (keyof R)[] = ['ownerFamily', 'level', 'uncollectedCash'];
const defaults: R[] = [
  { id: 'a', x: 2000, y: 3000, width: 160, height: 96, ownerFamily: 'corvini', level: 1, uncollectedCash: 0 },
  { id: 'b', x: 2500, y: 3600, width: 160, height: 160, ownerFamily: 'moretti', level: 1, uncollectedCash: 0 },
  { id: 'c', x: 3000, y: 1000, width: 160, height: 128, ownerFamily: 'rastelli', level: 1, uncollectedCash: 0 },
];

test('AC-006 old positions and sizes are replaced, owner, level and cash are kept', () => {
  const saved: Partial<R>[] = [
    { id: 'a', x: 260, y: 260, width: 150, height: 105, ownerFamily: 'player', level: 4, uncollectedCash: 1234 },
    { id: 'b', x: 1260, y: 1260, width: 175, height: 115, ownerFamily: 'player', level: 2, uncollectedCash: 55 },
  ];
  const out = mergeSavedById(defaults, saved, KEEP);
  assert.deepEqual(out[0], { ...defaults[0], ownerFamily: 'player', level: 4, uncollectedCash: 1234 });
  assert.deepEqual(out[1], { ...defaults[1], ownerFamily: 'player', level: 2, uncollectedCash: 55 });
  for (const r of out.slice(0, 2)) assert.ok(r.x >= 2000 && r.width >= 160);
});

test('AC-006 ids missing from the save use the defaults', () => {
  const out = mergeSavedById(defaults, [{ id: 'a', level: 3 }], KEEP);
  assert.deepEqual(out[1], defaults[1]);
  assert.deepEqual(out[2], defaults[2]);
  assert.equal(out[0].level, 3);
  assert.equal(out[0].ownerFamily, 'corvini');
});

test('AC-006 missing or malformed saves give the defaults, unknown saved ids are dropped, defaults are not mutated', () => {
  assert.deepEqual(mergeSavedById(defaults, undefined, KEEP), defaults);
  const out = mergeSavedById(defaults, [{ id: 'zzz', level: 5 }, { id: 'c', level: 5, x: 1 }], KEEP);
  assert.equal(out.length, 3);
  assert.equal(out[2].level, 5);
  assert.equal(out[2].x, 3000);
  assert.equal(defaults[2].level, 1);
  assert.notEqual(out[0], defaults[0]);
});
