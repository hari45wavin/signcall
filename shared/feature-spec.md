# Feature spec (v1)

**Source of truth:** `ml/signml/features.py`. The browser copy is `web/src/lib/features.ts`. Both must pass `shared/test-vectors.json`.

## Input

MediaPipe Hand Landmarker output for one video frame, **not mirrored** (mirror only the on-screen preview, never the frame sent to MediaPipe):

- up to 2 hands
- each hand: 21 landmarks with normalized `x`, `y`, `z`, plus a handedness label `"Left"` or `"Right"` and a score

## Output

A flat list of **126 floats** = 2 slots × 21 landmarks × 3 coords.

| Index | Content |
|---|---|
| 0–62 | Left slot: landmark 0 x,y,z, landmark 1 x,y,z, … landmark 20 x,y,z |
| 63–125 | Right slot, same layout |

## Steps (per hand)

1. **Translate:** subtract the wrist (landmark 0) from every landmark, so the wrist becomes (0, 0, 0).
2. **Scale:** divide every coordinate by `s`, the 3D Euclidean distance from the wrist to the middle-finger MCP (landmark 9) *before* translation. If `s < 1e-6`, use `s = 1`.
3. Do **not** rotate, mirror or clip.

## Hand order

1. Use the handedness label: `"Left"` goes to the left slot, `"Right"` to the right slot.
2. If both hands have the same label, the hand with the higher handedness score keeps its label's slot and the other hand takes the other slot. On equal scores, the hand that came first in the input keeps it.
3. More than 2 hands: keep the 2 with the highest scores, then apply the rules above.

## Missing hands

An empty slot is 63 zeros. A frame with no hands is 126 zeros.

## Precision

Compute in 64-bit floats. Tests compare with absolute tolerance `1e-6`.

## Sequences

The word model takes a window of `labels.json → sequence.window` consecutive frames (30), shape `[30, 126]`, oldest first. Frames are sampled at ~15 fps.

## Changing this spec

Bump the version at the top, update `features.py` and `features.ts` together, run `python ml/scripts/make_test_vectors.py`, and get a frontend and an ML review.
