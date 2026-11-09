/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VIBRATION_STORAGE_KEY, createHaptics } from './haptics.ts';
import type { HapticsStorage } from './haptics.ts';

function setup(opts: { supported?: boolean; stored?: string; throws?: boolean } = {}) {
  const calls: number[] = [];
  const data = new Map<string, string>();
  if (opts.stored !== undefined) data.set(VIBRATION_STORAGE_KEY, opts.stored);
  const storage: HapticsStorage = {
    getItem: (k) => {
      if (opts.throws) throw new Error('blocked');
      return data.get(k) ?? null;
    },
    setItem: (k, v) => {
      if (opts.throws) throw new Error('blocked');
      data.set(k, v);
    },
  };
  const clock = { t: 1000 };
  const vibrate = opts.supported === false ? null : (ms: number) => calls.push(ms);
  const h = createHaptics({ vibrate, storage, now: () => clock.t });
  return { h, calls, data, clock };
}

test('pulse durations', () => {
  const { h, calls, clock } = setup();
  h.pulse('damage');
  clock.t += 100;
  h.pulse('heavyHit');
  clock.t += 100;
  h.pulse('capoTakedown');
  assert.deepEqual(calls, [40, 25, 80]);
});

test('one pulse per 100 ms window', () => {
  const { h, calls, clock } = setup();
  h.pulse('damage');
  clock.t += 99;
  h.pulse('damage');
  h.pulse('heavyHit');
  assert.deepEqual(calls, [40]);
  clock.t += 1;
  h.pulse('heavyHit');
  assert.deepEqual(calls, [40, 25]);
});

test('longer pulse replaces a shorter one inside the window', () => {
  const { h, calls, clock } = setup();
  h.pulse('heavyHit');
  clock.t += 10;
  h.pulse('capoTakedown');
  clock.t += 10;
  h.pulse('damage');
  assert.deepEqual(calls, [25, 80]);
});

test('defaults on and persists the choice', () => {
  const { h, data } = setup();
  assert.equal(h.getVibrationEnabled(), true);
  h.setVibrationEnabled(false);
  assert.equal(data.get(VIBRATION_STORAGE_KEY), '0');
  const next = setup({ stored: '0' });
  assert.equal(next.h.getVibrationEnabled(), false);
  next.h.setVibrationEnabled(true);
  assert.equal(next.data.get(VIBRATION_STORAGE_KEY), '1');
});

test('no calls when disabled or unsupported', () => {
  const off = setup({ stored: '0' });
  off.h.pulse('capoTakedown');
  assert.deepEqual(off.calls, []);
  const none = setup({ supported: false });
  assert.equal(none.h.isVibrationSupported(), false);
  none.h.pulse('damage');
  assert.deepEqual(none.calls, []);
});

test('storage errors are caught and default stays on', () => {
  const { h, calls } = setup({ throws: true });
  assert.equal(h.getVibrationEnabled(), true);
  h.setVibrationEnabled(false);
  assert.equal(h.getVibrationEnabled(), false);
  h.pulse('damage');
  assert.deepEqual(calls, []);
});
