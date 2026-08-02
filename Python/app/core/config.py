from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:  # pragma: no cover - local fallback when dependencies are not installed yet
    def load_dotenv(*_args, **_kwargs):
        return False

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    service_auth_secret: str = os.getenv("PYTHON_SERVICE_SHARED_SECRET") or os.getenv("SHARED_SECRET", "")
    model_path: Path = Path(os.getenv("MODEL_PATH", BASE_DIR / "models" / "model.pkl"))
    model_version: str = os.getenv("RISK_MODEL_VERSION", "injury-risk-v2")
    fatigue_decay: float = float(os.getenv("FATIGUE_DECAY", "0.9"))
    model_positive_label: int = int(os.getenv("RISK_POSITIVE_LABEL", "1"))


settings = Settings()
