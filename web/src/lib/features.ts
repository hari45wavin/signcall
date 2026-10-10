/**
 * Landmarks -> 126 features. Must match ml/signml/features.py exactly
 * (shared/feature-spec.md, tested against shared/test-vectors.json).
 */

export const SPEC_VERSION = 1;
export const NUM_LANDMARKS = 21;
export const HAND_SIZE = NUM_LANDMARKS * 3; // 63
export const FEATURE_SIZE = HAND_SIZE * 2; // 126
const WRIST = 0;
const MIDDLE_MCP = 9;
const EPS = 1e-6;

export interface Hand {
  /** 21 x [x, y, z] */
  landmarks: number[][];
  handedness: string; // "Left" | "Right"
  score: number;
}

export function normalizeHand(landmarks: number[][]): number[] {
  const [wx, wy, wz] = landmarks[WRIST];
  const [mx, my, mz] = landmarks[MIDDLE_MCP];
  let scale = Math.hypot(mx - wx, my - wy, mz - wz);
  if (scale < EPS) scale = 1;
  const out = new Array<number>(HAND_SIZE);
  for (let i = 0; i < NUM_LANDMARKS; i++) {
    const [x, y, z] = landmarks[i];
    out[i * 3] = (x - wx) / scale;
    out[i * 3 + 1] = (y - wy) / scale;
    out[i * 3 + 2] = (z - wz) / scale;
  }
  return out;
}

export function assignSlots(hands: Hand[]): [Hand | null, Hand | null] {
  const top = hands
    .map((hand, i) => ({ hand, i }))
    .sort((a, b) => b.hand.score - a.hand.score || a.i - b.i)
    .slice(0, 2)
    .map((p) => p.hand);

  let left: Hand | null = null;
  let right: Hand | null = null;
  const leftovers: Hand[] = [];
  for (const hand of top) {
    if (hand.handedness === "Left" && !left) left = hand;
    else if (hand.handedness === "Right" && !right) right = hand;
    else leftovers.push(hand);
  }
  for (const hand of leftovers) {
    if (!left) left = hand;
    else if (!right) right = hand;
  }
  return [left, right];
}

export function frameFeatures(hands: Hand[]): number[] {
  const out = new Array<number>(FEATURE_SIZE).fill(0);
  const [left, right] = assignSlots(hands);
  if (left) normalizeHand(left.landmarks).forEach((v, i) => (out[i] = v));
  if (right) normalizeHand(right.landmarks).forEach((v, i) => (out[HAND_SIZE + i] = v));
  return out;
}
