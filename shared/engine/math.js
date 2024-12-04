export function clampMagnitude(value, maxMagnitude) {
  return Math.min(Math.abs(value), maxMagnitude) * Math.sign(value);
}

export const map = (v, s0, s1, e0, e1) =>
  e0 + ((v - s0) / (s1 - s0)) * (e1 - e0);
export const mapClamped = (v, s0, s1, e0, e1) =>
  clamp(
    e0 + ((v - s0) / (s1 - s0)) * (e1 - e0),
    Math.min(e0, e1),
    Math.max(e0, e1)
  );

export const lenSq = (x, y) => x * x + y * y;
export const len = (x, y) => Math.sqrt(x * x + y * y);
export const dist = (x1, y1, x2, y2) => len(x1 - x2, y1 - y2);
export const distSq = (x1, y1, x2, y2) => lenSq(x1 - x2, y1 - y2);

export const lerp = (v1, v2, t) => v1 + (v2 - v1) * t;

export const lerpClamped = (v1, v2, t) =>
  clamp(lerp(v1, v2, t), Math.min(v1, v2), Math.max(v1, v2));
export const invLerp = (v1, v2, t) => (t - v1) / (v2 - v1);
export const invLerpClamped = (v1, v2, t) =>
  Math.min(1, Math.max((t - v1) / (v2 - v1), 0));
export const clamp = (v, min, max) => Math.min(max, Math.max(v, min));
export const clamp01 = (x) => clamp(x, 0, 1);
export const mod = (n, m) => ((n % m) + m) % m;

export const lerpAngleRad = (v1, v2, t) => {
  let diff = mod(v2 - v1, Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  return v1 + diff * t;
};
export const lerpAngleDeg = (v1, v2, t) => {
  let diff = mod(v2 - v1, 360);
  if (diff > 180) diff -= 360;
  return v1 + diff * t;
};
export function wrap(angle, period) {
  angle = mod(angle, period);
  if (angle > period / 2) angle -= period;
  return angle;
}
export function repeat(value, length) {
  return value - Math.floor(value / length) * length;
}
export const moveTowardsAngle = (a1, a2, maxChange) => {
  return a1 + clamp(deltaAngle(a1, a2), -maxChange, maxChange);
};
export const moveTowards = (a1, a2, maxChange) => {
  return a1 + clamp(a2 - a1, -maxChange, maxChange);
};

export const deltaAngleRad = (a1, a2) => {
  let diff = mod(a2 - a1, Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  return diff;
};
export const deltaAngleDeg = (a1, a2) => {
  let diff = mod(a2 - a1, 360);
  if (diff > 180) diff -= 360;
  return diff;
};
export function toRadian(a) {
  return a * (Math.PI / 180);
}

export function toDegrees(a) {
  return (a / Math.PI) * 180;
}
