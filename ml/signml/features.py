"""Landmark -> feature vector. SOURCE OF TRUTH for shared/feature-spec.md.

web/src/lib/features.ts must produce identical output; both are tested
against shared/test-vectors.json. Change them together.
"""
from __future__ import annotations

from typing import Sequence, TypedDict

import numpy as np

SPEC_VERSION = 1
NUM_LANDMARKS = 21
NUM_COORDS = 3
HAND_SIZE = NUM_LANDMARKS * NUM_COORDS  # 63
FEATURE_SIZE = 2 * HAND_SIZE  # 126
WRIST = 0
MIDDLE_MCP = 9
EPS = 1e-6


class Hand(TypedDict):
    landmarks: Sequence[Sequence[float]]  # 21 x [x, y, z]
    handedness: str  # "Left" | "Right"
    score: float


def normalize_hand(landmarks: Sequence[Sequence[float]]) -> np.ndarray:
    """Wrist-relative, scaled by wrist->middle-MCP distance. Returns shape (63,)."""
    pts = np.asarray(landmarks, dtype=np.float64).reshape(NUM_LANDMARKS, NUM_COORDS)
    wrist = pts[WRIST].copy()
    scale = float(np.linalg.norm(pts[MIDDLE_MCP] - wrist))
    if scale < EPS:
        scale = 1.0
    return ((pts - wrist) / scale).reshape(-1)


def assign_slots(hands: Sequence[Hand]) -> tuple[Hand | None, Hand | None]:
    """Return (left_slot, right_slot) following the hand-order rules in the spec."""
    # Keep at most 2 hands, highest score first (stable for ties).
    indexed = sorted(enumerate(hands), key=lambda p: (-float(p[1]["score"]), p[0]))[:2]
    left: Hand | None = None
    right: Hand | None = None
    leftovers: list[Hand] = []
    # Process in score order so the higher-score hand claims its labelled slot.
    for _, hand in indexed:
        if hand["handedness"] == "Left" and left is None:
            left = hand
        elif hand["handedness"] == "Right" and right is None:
            right = hand
        else:
            leftovers.append(hand)
    for hand in leftovers:
        if left is None:
            left = hand
        elif right is None:
            right = hand
    return left, right


def frame_features(hands: Sequence[Hand]) -> np.ndarray:
    """One frame -> 126 floats: [left slot (63), right slot (63)]. Missing hand = zeros."""
    out = np.zeros(FEATURE_SIZE, dtype=np.float64)
    left, right = assign_slots(hands)
    if left is not None:
        out[:HAND_SIZE] = normalize_hand(left["landmarks"])
    if right is not None:
        out[HAND_SIZE:] = normalize_hand(right["landmarks"])
    return out


def from_mediapipe(result) -> list[Hand]:
    """Convert a mediapipe HandLandmarkerResult into the plain Hand dicts used here."""
    hands: list[Hand] = []
    for lms, handed in zip(result.hand_landmarks, result.handedness):
        cat = handed[0]
        hands.append(
            {
                "landmarks": [[p.x, p.y, p.z] for p in lms],
                "handedness": cat.category_name,
                "score": float(cat.score),
            }
        )
    return hands
