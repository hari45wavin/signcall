"""Download candidate datasets into ml/data/raw/ (needs ~/.kaggle/kaggle.json).

Verify each dataset's contents and licence before training on it.
"""
import argparse
import subprocess

from _common import DATA

DATASETS = {
    "asl-alphabet": "grassknoted/asl-alphabet",
    "isl-csltr": "drblack00/isl-csltr-indian-sign-language-dataset",
    "isl-static": "prekshapalva/indian-sign-language",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("names", nargs="*", default=list(DATASETS), choices=list(DATASETS))
    args = ap.parse_args()
    for name in args.names:
        dest = DATA / "raw" / name
        dest.mkdir(parents=True, exist_ok=True)
        print(f"-> {DATASETS[name]} into {dest}")
        subprocess.run(["kaggle", "datasets", "download", "-d", DATASETS[name], "-p", str(dest), "--unzip"], check=True)


if __name__ == "__main__":
    main()
