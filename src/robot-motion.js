export const POSES = {
  seated: { frontThigh: 1.101593208, frontCalf: -.84, rearThigh: 1.711593208, rearCalf: -2.45 },
  standing: { frontThigh: .66, frontCalf: -1.32, rearThigh: .66, rearCalf: -1.32 },
  resting: { frontThigh: 1.36, frontCalf: -2.65, rearThigh: 1.36, rearCalf: -2.65 },
};
export const POSE_NAMES = Object.keys(POSES);
export function cursorGaze(cursor, head, viewport) {
  if (!cursor) return { x: 0, y: 0 };
  const clamp = value => Math.max(-1, Math.min(1, value));
  return {
    x: clamp((cursor.x - head.x) / Math.max(viewport.width * .45, 160)),
    y: clamp((head.y - cursor.y) / Math.max(viewport.height * .45, 160)),
  };
}
export const smoothStep = value => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export function mixPose(from, to, progress) {
  const weight = smoothStep(progress);
  return Object.fromEntries(Object.keys(from).map(key => [key, from[key] + (to[key] - from[key]) * weight]));
}

// Solve body pitch from the two leg chains so front and rear soles share a floor.
export function solveStance(pose) {
  const foot = (hip, thigh, calf) => ({
    x: hip - .213 * Math.sin(thigh) - .213 * Math.sin(thigh + calf),
    z: -.213 * Math.cos(thigh) - .213 * Math.cos(thigh + calf),
  });
  const front = foot(.1934, pose.frontThigh, pose.frontCalf);
  const rear = foot(-.1934, pose.rearThigh, pose.rearCalf);
  const pitch = Math.atan2(front.z - rear.z, front.x - rear.x);
  const z = point => -Math.sin(pitch) * point.x + Math.cos(pitch) * point.z;
  return { pitch, height: .024 - z(front), frontFloor: z(front), rearFloor: z(rear) };
}
