from functools import lru_cache
from pathlib import Path
import json
from typing import Dict, Any


@lru_cache()
def get_ml_config() -> Dict[str, Any]:
    """Load ML parameters from `app/ml_config.json`.

    Cached to avoid repeated disk reads. Returns an empty dict on error.
    """
    try:
        base = Path(__file__).resolve().parents[1]
        cfg_path = base / "ml_config.json"
        if not cfg_path.exists():
            return {}
        with cfg_path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}
