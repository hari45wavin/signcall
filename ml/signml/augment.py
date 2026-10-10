"""Augmentations applied to raw landmarks BEFORE frame_features()."""
from __future__ import annotations

import numpy as np


def jitter(landmarks: np.ndarray, sigma: float = 0.004, rng: np.random.Generator | None = None) -> np.ndarray:
    rng = rng or np.random.default_rng()
    return landmarks + rng.normal(0.0, sigma, size=landmarks.shape)


def rotate_z(landmarks: np.ndarray, max_deg: float = 15.0, rng: np.random.Generator | None = None) -> np.ndarray:
    """Rotate (21, 3) landmarks around the wrist in the image plane."""
    rng = rng or np.random.default_rng()
    theta = np.deg2rad(rng.uniform(-max_deg, max_deg))
    c, s = np.cos(theta), np.sin(theta)
    wrist = landmarks[0:1]
    rel = landmarks - wrist
    x, y = rel[:, 0] * c - rel[:, 1] * s, rel[:, 0] * s + rel[:, 1] * c
    out = rel.copy()
    out[:, 0], out[:, 1] = x, y
    return out + wrist


def scale(landmarks: np.ndarray, low: float = 0.85, high: float = 1.15, rng: np.random.Generator | None = None) -> np.ndarray:
    rng = rng or np.random.default_rng()
    return landmarks * rng.uniform(low, high)
