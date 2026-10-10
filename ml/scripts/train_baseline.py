"""Generates a synthetic baseline dataset for static sign classes and trains the initial static MLP.

Saves the bundle to inference/models/static_mlp.pkl and copies labels.json alongside it.
"""
import json
import pickle
from pathlib import Path

import numpy as np
from sklearn.neural_network import MLPClassifier

ROOT = Path(__file__).resolve().parents[2]
SHARED = ROOT / "shared"
LABELS_PATH = SHARED / "labels.json"
MODELS_DIR = ROOT / "inference" / "models"


def generate_hand_sign_sample(label: str, rng: np.random.Generator) -> np.ndarray:
    """Generate realistic wrist-normalized 63-element feature vector for a sign."""
    # 21 landmarks x 3 coords (x, y, z)
    pts = np.zeros((21, 3), dtype=np.float64)

    # Wrist at (0, 0, 0)
    pts[0] = [0.0, 0.0, 0.0]

    # Knuckle base positions (MCPs)
    pts[1] = [-0.3, 0.2, 0.0]  # Thumb CMC
    pts[2] = [-0.5, 0.4, 0.0]  # Thumb MCP
    pts[5] = [-0.3, 0.8, 0.0]  # Index MCP
    pts[9] = [0.0, 1.0, 0.0]   # Middle MCP (defines scale = 1.0)
    pts[13] = [0.3, 0.9, 0.0]  # Ring MCP
    pts[17] = [0.5, 0.7, 0.0]  # Pinky MCP

    # Helper: set finger joints (MCP -> PIP -> DIP -> Tip)
    def set_finger(base_idx: int, mcp_pos: np.ndarray, is_extended: bool, curl_dir: float = -1.0, spread: float = 0.0):
        pip_idx = base_idx + 1
        dip_idx = base_idx + 2
        tip_idx = base_idx + 3

        if is_extended:
            # Pointing upward along Y
            pts[pip_idx] = mcp_pos + np.array([spread * 0.3, 0.35, 0.0])
            pts[dip_idx] = pts[pip_idx] + np.array([spread * 0.3, 0.3, 0.0])
            pts[tip_idx] = pts[dip_idx] + np.array([spread * 0.4, 0.35, 0.0])
        else:
            # Curled down toward palm
            pts[pip_idx] = mcp_pos + np.array([0.05, 0.15, -0.1])
            pts[dip_idx] = pts[pip_idx] + np.array([0.0, -0.2, -0.15])
            pts[tip_idx] = pts[dip_idx] + np.array([0.0, -0.25, -0.1])

    # Configure finger states according to ASL sign
    if label == "A":
        # Fist with thumb upright against side
        pts[3] = pts[2] + np.array([-0.1, 0.3, 0.1])
        pts[4] = pts[3] + np.array([0.0, 0.3, 0.1])
        for base in [5, 9, 13, 17]:
            set_finger(base, pts[base], is_extended=False)
    elif label == "B":
        # 4 fingers straight up, thumb folded across palm
        pts[3] = pts[2] + np.array([0.3, 0.1, -0.1])
        pts[4] = pts[3] + np.array([0.3, 0.0, -0.1])
        for base in [5, 9, 13, 17]:
            set_finger(base, pts[base], is_extended=True, spread=0.0)
    elif label == "C":
        # Curved C shape
        for base in [5, 9, 13, 17]:
            pts[base + 1] = pts[base] + np.array([0.0, 0.2, -0.2])
            pts[base + 2] = pts[base + 1] + np.array([0.0, 0.0, -0.3])
            pts[base + 3] = pts[base + 2] + np.array([0.0, -0.2, -0.2])
        pts[3] = pts[2] + np.array([0.0, 0.2, -0.2])
        pts[4] = pts[3] + np.array([0.0, 0.1, -0.3])
    elif label == "D":
        # Index straight up, others touching thumb
        pts[3] = pts[2] + np.array([0.2, 0.2, -0.1])
        pts[4] = pts[3] + np.array([0.2, 0.2, -0.1])
        set_finger(5, pts[5], is_extended=True)
        set_finger(9, pts[9], is_extended=False)
        set_finger(13, pts[13], is_extended=False)
        set_finger(17, pts[17], is_extended=False)
    elif label == "L":
        # Index up, thumb out at 90 deg, others curled
        pts[3] = pts[2] + np.array([-0.4, 0.0, 0.0])
        pts[4] = pts[3] + np.array([-0.4, 0.0, 0.0])
        set_finger(5, pts[5], is_extended=True)
        set_finger(9, pts[9], is_extended=False)
        set_finger(13, pts[13], is_extended=False)
        set_finger(17, pts[17], is_extended=False)
    elif label == "V":
        # Index and middle in V, others curled
        pts[3] = pts[2] + np.array([0.2, 0.1, -0.1])
        pts[4] = pts[3] + np.array([0.2, 0.1, -0.1])
        set_finger(5, pts[5], is_extended=True, spread=-0.3)
        set_finger(9, pts[9], is_extended=True, spread=0.3)
        set_finger(13, pts[13], is_extended=False)
        set_finger(17, pts[17], is_extended=False)
    elif label == "W":
        # Index, middle, ring up, pinky and thumb curled
        set_finger(5, pts[5], is_extended=True, spread=-0.3)
        set_finger(9, pts[9], is_extended=True, spread=0.0)
        set_finger(13, pts[13], is_extended=True, spread=0.3)
        set_finger(17, pts[17], is_extended=False)
    elif label == "Y":
        # Thumb and pinky out, middle 3 curled
        pts[3] = pts[2] + np.array([-0.4, 0.2, 0.0])
        pts[4] = pts[3] + np.array([-0.4, 0.2, 0.0])
        set_finger(5, pts[5], is_extended=False)
        set_finger(9, pts[9], is_extended=False)
        set_finger(13, pts[13], is_extended=False)
        set_finger(17, pts[17], is_extended=True, spread=0.4)
    elif label == "I":
        # Only pinky up
        set_finger(5, pts[5], is_extended=False)
        set_finger(9, pts[9], is_extended=False)
        set_finger(13, pts[13], is_extended=False)
        set_finger(17, pts[17], is_extended=True)
    elif label == "space":
        # Open 5 hand spread out
        pts[3] = pts[2] + np.array([-0.4, 0.3, 0.0])
        pts[4] = pts[3] + np.array([-0.4, 0.3, 0.0])
        set_finger(5, pts[5], is_extended=True, spread=-0.4)
        set_finger(9, pts[9], is_extended=True, spread=-0.1)
        set_finger(13, pts[13], is_extended=True, spread=0.2)
        set_finger(17, pts[17], is_extended=True, spread=0.5)
    elif label == "del":
        # Hand tilted left/curled
        pts[3] = pts[2] + np.array([-0.3, -0.2, 0.0])
        pts[4] = pts[3] + np.array([-0.3, -0.2, 0.0])
        for base in [5, 9, 13, 17]:
            set_finger(base, pts[base], is_extended=False)
    else:
        # Default fist / curled
        for base in [5, 9, 13, 17]:
            set_finger(base, pts[base], is_extended=False)

    # Add realistic jitter noise
    pts += rng.normal(0, 0.03, pts.shape)

    # Wrist translation and scaling
    wrist = pts[0].copy()
    scale = float(np.linalg.norm(pts[9] - wrist))
    if scale < 1e-6:
        scale = 1.0
    norm_hand = ((pts - wrist) / scale).reshape(-1)
    return norm_hand


def main():
    rng = np.random.default_rng(42)
    labels_data = json.loads(LABELS_PATH.read_text())
    classes = labels_data["static"]["classes"]

    X_list = []
    y_list = []

    samples_per_class = 150

    for cls in classes:
        for _ in range(samples_per_class):
            feat = np.zeros(126, dtype=np.float64)
            if cls == "nothing":
                # Idle: zero vector or slight noise near zero
                if rng.random() > 0.5:
                    feat += rng.normal(0, 0.005, 126)
            else:
                hand_vec = generate_hand_sign_sample(cls, rng)
                # Randomly place in Right slot (indices 63:126) or Left slot (0:63)
                if rng.random() > 0.3:
                    feat[63:] = hand_vec
                else:
                    feat[:63] = hand_vec
            X_list.append(feat)
            y_list.append(cls)

    X = np.array(X_list, dtype=np.float64)
    y = np.array(y_list)

    print(f"Training MLPClassifier on {len(X)} samples across {len(classes)} classes...")
    clf = MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=200, random_state=42)
    clf.fit(X, y)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    out_bundle = MODELS_DIR / "static_mlp.pkl"
    with open(out_bundle, "wb") as f:
        pickle.dump({"model": clf, "classes": list(clf.classes_)}, f)

    # Copy labels.json to models/
    (MODELS_DIR / "labels.json").write_text(json.dumps(labels_data, indent=2))

    print(f"Model saved to {out_bundle} with {len(clf.classes_)} classes!")


if __name__ == "__main__":
    main()
