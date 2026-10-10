"""Run MediaPipe Hand Landmarker over an image folder and save features.

Expected layout: <input>/<label>/<image>.jpg  (signer id optional: <input>/<signer>/<label>/...)
Output: .npz with X (N, 126), y (labels as strings), signer, path.

Download the model once:
  curl -L -o ml/data/hand_landmarker.task \
    https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
"""
import argparse
from pathlib import Path

import numpy as np
from tqdm import tqdm

from _common import DATA
from signml.features import frame_features, from_mediapipe


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=Path)
    ap.add_argument("output", type=Path)
    ap.add_argument("--model", type=Path, default=DATA / "hand_landmarker.task")
    ap.add_argument("--with-signer", action="store_true", help="input is <signer>/<label>/<img>")
    ap.add_argument("--limit-per-class", type=int, default=0)
    args = ap.parse_args()

    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions, RunningMode

    opts = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(args.model)),
        running_mode=RunningMode.IMAGE,
        num_hands=2,
    )
    X, y, signers, paths = [], [], [], []
    imgs = sorted(p for p in args.input.rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png"})
    per_class: dict[str, int] = {}
    skipped = 0
    with HandLandmarker.create_from_options(opts) as lm:
        for p in tqdm(imgs):
            rel = p.relative_to(args.input).parts
            label = rel[1] if args.with_signer else rel[0]
            signer = rel[0] if args.with_signer else "unknown"
            if args.limit_per_class and per_class.get(label, 0) >= args.limit_per_class:
                continue
            result = lm.detect(mp.Image.create_from_file(str(p)))
            hands = from_mediapipe(result)
            if not hands and label != "nothing":
                skipped += 1
                continue
            X.append(frame_features(hands))
            y.append(label)
            signers.append(signer)
            paths.append(str(p))
            per_class[label] = per_class.get(label, 0) + 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(args.output, X=np.array(X), y=np.array(y), signer=np.array(signers), path=np.array(paths))
    print(f"saved {len(X)} samples to {args.output} ({skipped} images had no hands)")


if __name__ == "__main__":
    main()
