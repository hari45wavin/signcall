import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ML_DIR = ROOT / "ml"
SHARED = ROOT / "shared"
DATA = ML_DIR / "data"
sys.path.insert(0, str(ML_DIR))
