import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ml"))

from signml.features import FEATURE_SIZE, SPEC_VERSION, frame_features  # noqa: E402

VECTORS = json.loads((ROOT / "shared" / "test-vectors.json").read_text())


def test_spec_version_matches():
    assert VECTORS["spec_version"] == SPEC_VERSION


def test_vectors():
    for case in VECTORS["cases"]:
        got = frame_features(case["hands"])
        assert got.shape == (FEATURE_SIZE,), case["name"]
        np.testing.assert_allclose(got, case["expected"], atol=VECTORS["tolerance"], err_msg=case["name"])


def test_wrist_is_origin_and_scale_is_one():
    hand = {"landmarks": np.random.default_rng(0).random((21, 3)).tolist(), "handedness": "Right", "score": 1.0}
    f = frame_features([hand])[63:].reshape(21, 3)
    np.testing.assert_allclose(f[0], 0.0)
    assert abs(np.linalg.norm(f[9]) - 1.0) < 1e-9
