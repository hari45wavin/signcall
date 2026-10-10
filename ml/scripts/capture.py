"""Record the team's own samples from a webcam.

TODO(ml): open webcam with OpenCV, show the prompt label, record N frames per label per
signer, run Hand Landmarker (VIDEO mode), save to ml/data/own/<signer>/<label>/*.npy.
Aim for 30+ samples per class per person, several lighting setups and distances, plus idle.
"""
import argparse


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--signer", required=True)
    ap.add_argument("--labels", nargs="+", required=True)
    ap.add_argument("--samples", type=int, default=30)
    ap.add_argument("--mode", choices=["static", "sequence"], default="static")
    ap.parse_args()
    raise SystemExit("capture.py is not implemented yet")


if __name__ == "__main__":
    main()
