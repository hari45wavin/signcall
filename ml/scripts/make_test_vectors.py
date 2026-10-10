"""Regenerate shared/test-vectors.json from signml.features (the source of truth).

Run after ANY change to the feature spec:  python ml/scripts/make_test_vectors.py
"""
import json

import numpy as np

from _common import SHARED
from signml.features import SPEC_VERSION, frame_features


def fake_hand(rng, cx, cy, size, handedness, score):
    pts = np.stack(
        [cx + rng.normal(0, size, 21), cy + rng.normal(0, size, 21), rng.normal(0, size / 3, 21)], axis=1
    )
    return {"landmarks": np.round(pts, 6).tolist(), "handedness": handedness, "score": score}


def main():
    rng = np.random.default_rng(42)
    cases = []

    def add(name, hands):
        cases.append({"name": name, "hands": hands, "expected": frame_features(hands).tolist()})

    add("no hands", [])
    add("one right hand", [fake_hand(rng, 0.6, 0.5, 0.08, "Right", 0.97)])
    add("one left hand", [fake_hand(rng, 0.4, 0.5, 0.05, "Left", 0.91)])
    add("two hands, right listed first", [
        fake_hand(rng, 0.65, 0.5, 0.07, "Right", 0.95),
        fake_hand(rng, 0.35, 0.5, 0.07, "Left", 0.93),
    ])
    add("two hands both labelled Left, higher score keeps left slot", [
        fake_hand(rng, 0.3, 0.5, 0.06, "Left", 0.70),
        fake_hand(rng, 0.7, 0.5, 0.06, "Left", 0.90),
    ])
    add("two hands both labelled Right, equal score, first keeps right slot", [
        fake_hand(rng, 0.7, 0.4, 0.06, "Right", 0.80),
        fake_hand(rng, 0.3, 0.4, 0.06, "Right", 0.80),
    ])
    add("three hands, lowest score dropped", [
        fake_hand(rng, 0.2, 0.5, 0.05, "Left", 0.50),
        fake_hand(rng, 0.5, 0.5, 0.05, "Right", 0.99),
        fake_hand(rng, 0.8, 0.5, 0.05, "Left", 0.88),
    ])
    collapsed = {"landmarks": [[0.5, 0.5, 0.0]] * 21, "handedness": "Right", "score": 0.9}
    add("degenerate hand (all points equal) uses scale 1", [collapsed])

    out = {
        "spec_version": SPEC_VERSION,
        "tolerance": 1e-6,
        "generated_by": "ml/scripts/make_test_vectors.py",
        "cases": cases,
    }
    path = SHARED / "test-vectors.json"
    path.write_text(json.dumps(out, indent=1) + "\n")
    print(f"wrote {len(cases)} cases to {path}")


if __name__ == "__main__":
    main()
