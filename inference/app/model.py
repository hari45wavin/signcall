"""Loads the exported model. Falls back to a dummy so the frontend can integrate early."""
from __future__ import annotations

import json
import os
import pickle
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
LABELS_PATH = ROOT.parent / "shared" / "labels.json"


def load_labels() -> dict:
    # In Docker the shared/ folder may not exist; export.py copies labels next to the model.
    for p in (ROOT / "models" / "labels.json", LABELS_PATH):
        if p.exists():
            return json.loads(p.read_text())
    return {"version": "unknown", "static": {"classes": ["nothing"]}, "sequence": {"window": 30, "classes": ["nothing"]}}


class Predictor:
    def __init__(self) -> None:
        self.labels = load_labels()
        self.name = "dummy"
        self._model = None
        self._classes: list[str] = self.labels["static"]["classes"]
        path = ROOT / os.environ.get("MODEL_PATH", "models/static_mlp.pkl")
        if path.exists() and path.suffix == ".pkl":
            with open(path, "rb") as f:
                bundle = pickle.load(f)
            self._model, self._classes, self.name = bundle["model"], bundle["classes"], path.name
        # TODO(inference): support .onnx via onnxruntime once export.py writes it.

    @property
    def classes(self) -> list[str]:
        return self._classes

    def predict(self, features: list[float], mode: str = "static") -> tuple[str, float, list[tuple[str, float]]]:
        if mode == "sequence":
            # TODO(inference): sequence model. Until then treat as idle.
            return "nothing", 1.0, [("nothing", 1.0)]
        if self._model is None:
            return "nothing", 1.0, [("nothing", 1.0)]
        x = np.asarray(features[:126], dtype=np.float64).reshape(1, -1)
        probs = self._model.predict_proba(x)[0]
        order = np.argsort(probs)[::-1][:3]
        top3 = [(str(self._classes[i]), float(probs[i])) for i in order]
        return top3[0][0], top3[0][1], top3
