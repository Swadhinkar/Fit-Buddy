from __future__ import annotations

import pickle
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

from app.core.config import settings
from app.ml.feature_engineering import FEATURE_NAMES


class ModelArtifactError(RuntimeError):
    """Raised when the model artifact is missing or invalid."""


@dataclass(frozen=True)
class ModelBundle:
    model: Any
    feature_names: list[str]
    model_version: str
    metadata: dict[str, Any]


@lru_cache(maxsize=1)
def load_model_bundle() -> ModelBundle:
    model_path = Path(settings.model_path)

    if not model_path.exists():
        raise ModelArtifactError(
            f"Model artifact not found at {model_path}. Run Python/scripts/train.py before serving predictions."
        )

    if model_path.stat().st_size == 0:
        raise ModelArtifactError(
            f"Model artifact at {model_path} is empty. Run Python/scripts/train.py to generate a valid model."
        )

    with model_path.open("rb") as model_file:
        artifact = pickle.load(model_file)

    if isinstance(artifact, dict) and "model" in artifact:
        model = artifact["model"]
        feature_names = list(artifact.get("feature_names") or FEATURE_NAMES)
        model_version = str(artifact.get("model_version") or settings.model_version)
        metadata = dict(artifact.get("metadata") or {})
    else:
        model = artifact
        feature_names = list(FEATURE_NAMES)
        model_version = settings.model_version
        metadata = {}

    return ModelBundle(
        model=model,
        feature_names=feature_names,
        model_version=model_version,
        metadata=metadata,
    )


def build_feature_vector(model_bundle: ModelBundle, features: dict[str, float]) -> np.ndarray:
    ordered_values = [float(features.get(feature_name, 0.0)) for feature_name in model_bundle.feature_names]
    return np.asarray([ordered_values], dtype=float)
