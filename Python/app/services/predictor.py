from __future__ import annotations

import logging

from app.core.config import settings
from app.ml.explain import explain_prediction
from app.ml.feature_engineering import engineer_features
from app.ml.model import ModelArtifactError, build_feature_vector, load_model_bundle
from app.schemas.request import PredictRequest

logger = logging.getLogger(__name__)


def _resolve_level(risk_score: int) -> str:
    if risk_score < 34:
        return "LOW"
    if risk_score < 67:
        return "MEDIUM"
    return "HIGH"


def generate_prediction(payload: PredictRequest) -> dict[str, object]:
    feature_bundle = engineer_features([log.model_dump() for log in payload.logs])

    has_training_signal = any(
        float(feature_bundle.features.get(feature_name, 0.0)) > 0
        for feature_name in ("acute_load", "fatigue_score", "current_day_load", "top_muscle_7d_load")
    )

    if not payload.logs or not feature_bundle.cleaned_logs or not has_training_signal:
        return {
            "riskScore": 0,
            "level": "LOW",
            "reasons": ["Not enough workout history is available yet. Keep logging workouts and recovery details."],
            "modelVersion": settings.model_version,
        }

    model_bundle = load_model_bundle()
    feature_vector = build_feature_vector(model_bundle, feature_bundle.features)

    logger.info("Input logs received for user %s: %d", payload.userId, len(payload.logs))
    logger.info("Engineered features for user %s: %s", payload.userId, feature_bundle.features)

    if feature_bundle.warnings:
        logger.warning("Feature-engineering warnings for user %s: %s", payload.userId, feature_bundle.warnings)

    try:
        risk_probability = float(model_bundle.model.predict_proba(feature_vector)[0][settings.model_positive_label])
    except AttributeError as exc:
        raise ModelArtifactError("Loaded model does not support predict_proba().") from exc

    risk_probability = max(0.0, min(1.0, risk_probability))
    risk_score = int(risk_probability * 100)
    level = _resolve_level(risk_score)
    reasons = explain_prediction(model_bundle, feature_bundle.features, feature_bundle.metadata)

    logger.info(
        "Prediction value for user %s: probability=%.4f risk_score=%d level=%s",
        payload.userId,
        risk_probability,
        risk_score,
        level,
    )

    return {
        "riskScore": risk_score,
        "level": level,
        "reasons": reasons,
        "modelVersion": model_bundle.model_version,
    }
