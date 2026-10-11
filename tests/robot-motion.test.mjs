import test from 'node:test';
import assert from 'node:assert/strict';
import { POSES, POSE_NAMES, mixPose, solveStance, smoothStep, cursorGaze } from '../src/robot-motion.js';

test('cursor gaze is centered on the head, bounded, and neutral without a pointer', () => {
  const head = { x: 1100, y: 250 }, viewport = { width: 1536, height: 760 };
  assert.deepEqual(cursorGaze(head, head, viewport), { x: 0, y: 0 });
  assert.deepEqual(cursorGaze(null, head, viewport), { x: 0, y: 0 });
  assert.ok(cursorGaze({ x: 1400, y: 150 }, head, viewport).x > 0);
  assert.ok(cursorGaze({ x: 1400, y: 150 }, head, viewport).y > 0);
  assert.ok(cursorGaze({ x: 800, y: 550 }, head, viewport).x < 0);
  assert.ok(cursorGaze({ x: 800, y: 550 }, head, viewport).y < 0);
  assert.deepEqual(cursorGaze({ x: -10000, y: 10000 }, head, viewport), { x: -1, y: -1 });
});

test('all three poses and every transition keep front and rear soles on the same floor', () => {
  for (const from of POSE_NAMES) for (const to of POSE_NAMES) for (let i = 0; i <= 100; i++) {
    const pose = mixPose(POSES[from], POSES[to], i / 100);
    const stance = solveStance(pose);
    assert.ok(Number.isFinite(stance.pitch) && Number.isFinite(stance.height));
    assert.ok(Math.abs(stance.frontFloor - stance.rearFloor) < 1e-10);
    assert.ok(stance.height > 0 && stance.height < .5);
    assert.ok(pose.frontCalf >= -2.7227 && pose.frontCalf <= -.83776);
    assert.ok(pose.rearCalf >= -2.7227 && pose.rearCalf <= -.83776);
  }
});
test('pose transitions ease in and out without a discontinuity', () => {
  assert.equal(smoothStep(0), 0); assert.equal(smoothStep(1), 1);
  assert.ok(smoothStep(.001) < 1e-7);
  assert.ok(1 - smoothStep(.999) < 1e-7);
  assert.deepEqual(mixPose(POSES.seated, POSES.standing, 0), POSES.seated);
  for (const key of Object.keys(POSES.standing)) assert.ok(Math.abs(mixPose(POSES.seated, POSES.standing, 1)[key] - POSES.standing[key]) < 1e-12);
});
