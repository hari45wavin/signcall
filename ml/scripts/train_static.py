"""Train the static (letter) classifier on extracted features.

Starts with a scikit-learn MLP baseline. Split is BY SIGNER when signer ids exist.
"""
import argparse
import json
import pickle
from pathlib import Path

import numpy as np
from sklearn.metrics import classification_report
from sklearn.model_selection import GroupShuffleSplit, train_test_split
from sklearn.neural_network import MLPClassifier

from _common import ML_DIR, SHARED


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("data", type=Path, nargs="+", help=".npz files from extract_landmarks.py")
    ap.add_argument("--out", type=Path, default=ML_DIR / "checkpoints" / "static_mlp.pkl")
    args = ap.parse_args()

    classes = json.loads((SHARED / "labels.json").read_text())["static"]["classes"]
    parts = [np.load(p) for p in args.data]
    X = np.concatenate([p["X"] for p in parts])
    y = np.concatenate([p["y"] for p in parts])
    signer = np.concatenate([p["signer"] for p in parts])
    keep = np.isin(y, classes)
    X, y, signer = X[keep], y[keep], signer[keep]

    if len(set(signer)) > 1:
        tr, va = next(GroupShuffleSplit(test_size=0.2, random_state=0).split(X, y, signer))
    else:
        print("WARNING: one signer only, falling back to a random split (accuracy will look too good)")
        tr, va = train_test_split(np.arange(len(y)), test_size=0.2, random_state=0, stratify=y)

    clf = MLPClassifier(hidden_layer_sizes=(256, 128), max_iter=300, early_stopping=True, random_state=0)
    clf.fit(X[tr], y[tr])
    print(classification_report(y[va], clf.predict(X[va]), zero_division=0))

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "wb") as f:
        pickle.dump({"model": clf, "classes": list(clf.classes_)}, f)
    print(f"saved {args.out}")


if __name__ == "__main__":
    main()
