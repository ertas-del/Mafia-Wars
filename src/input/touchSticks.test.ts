/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STICK_RADIUS,
  clearSticks,
  createTwinSticks,
  getAim,
  getMove,
  touchEnd,
  touchMove,
  touchStart,
} from './touchSticks.ts';

const W = 900;
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('dead zone gives no movement', () => {
  const s = createTwinSticks();
  touchStart(s, 1, 100, 200, W);
  touchMove(s, 1, 100 + STICK_RADIUS * 0.14, 200);
  assert.deepEqual(getMove(s), { x: 0, y: 0, sprint: false });
});

test('movement scales beyond dead zone and clamps at radius', () => {
  const s = createTwinSticks();
  touchStart(s, 1, 100, 200, W);
  touchMove(s, 1, 100 + STICK_RADIUS * 0.575, 200);
  near(getMove(s).x, 0.5);
  assert.equal(getMove(s).sprint, false);
  touchMove(s, 1, 100, 200 + STICK_RADIUS * 3);
  near(getMove(s).y, 1);
  near(s.move!.knobY, 200 + STICK_RADIUS);
});

test('sprint at 85% of radius', () => {
  const s = createTwinSticks();
  touchStart(s, 1, 100, 200, W);
  touchMove(s, 1, 100 + STICK_RADIUS * 0.84, 200);
  assert.equal(getMove(s).sprint, false);
  touchMove(s, 1, 100 + STICK_RADIUS * 0.85, 200);
  assert.equal(getMove(s).sprint, true);
});

test('sticks bind to touch ids; two at once; third ignored', () => {
  const s = createTwinSticks();
  assert.equal(touchStart(s, 7, 100, 200, W), 'move');
  assert.equal(touchStart(s, 9, 700, 200, W), 'aim');
  assert.equal(touchStart(s, 11, 150, 250, W), null);
  assert.equal(touchMove(s, 11, 300, 300), false);
  touchMove(s, 9, 700, 200 - STICK_RADIUS);
  near(getMove(s).x, 0);
  touchMove(s, 7, 100 + STICK_RADIUS, 200);
  near(getMove(s).x, 1);
  assert.equal(touchEnd(s, 11), false);
  touchEnd(s, 7);
  assert.equal(s.move, null);
  assert.notEqual(s.aim, null);
});

test('cancel clears both sticks', () => {
  const s = createTwinSticks();
  touchStart(s, 1, 100, 200, W);
  touchStart(s, 2, 700, 200, W);
  clearSticks(s);
  assert.equal(s.move, null);
  assert.equal(s.aim, null);
  assert.deepEqual(getMove(s), { x: 0, y: 0, sprint: false });
});

test('aim angle, attack only beyond dead zone, facing kept after release', () => {
  const s = createTwinSticks();
  touchStart(s, 2, 700, 200, W);
  touchMove(s, 2, 700 + STICK_RADIUS * 0.1, 200 + STICK_RADIUS * 0.1);
  assert.deepEqual(getAim(s), { active: false, angle: null, attack: false });
  touchMove(s, 2, 700, 200 + STICK_RADIUS * 0.5);
  near(getAim(s).angle!, Math.PI / 2);
  assert.equal(getAim(s).attack, true);
  touchEnd(s, 2);
  assert.equal(getAim(s).attack, false);
  near(getAim(s).angle!, Math.PI / 2);
});
