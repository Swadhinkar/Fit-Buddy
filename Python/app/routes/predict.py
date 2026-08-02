from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import verify_service_token
from app.ml.model import ModelArtifactError
from app.schemas.request import PredictRequest
from app.services.predictor import generate_prediction

logger = logging.getLogger(__name__)
router = APIRouter()


def _normalize_prediction_result(result: dict[str, object]) -> dict[str, object]:
    risk_score = int(max(0, min(100, round(float(result.get("riskScore", 0) or 0)))))
    level = str(result.get("level") or "LOW").upper()
    if level not in {"LOW", "MEDIUM", "HIGH"}:
        level = "HIGH" if risk_score >= 67 else "MEDIUM" if risk_score >= 34 else "LOW"

    reasons = result.get("reasons")
    if not isinstance(reasons, list):
        reasons = []

    model_version = str(result.get("modelVersion") or "injury-risk-v2")

    return {
        "riskScore": risk_score,
        "risk_score": risk_score,
        "level": level,
        "riskLevel": level,
        "risk_level": level,
        "reasons": [str(reason) for reason in reasons[:3]],
        "modelVersion": model_version,
        "model_version": model_version,
    }


@router.post("/predict", response_model=None)
def predict(
    payload: PredictRequest,
    _service_claims: dict = Depends(verify_service_token),
) -> dict[str, object]:
    try:
        logger.info("[predict] Incoming request for user %s with %d rows.", payload.userId, len(payload.logs))
        result = generate_prediction(payload)
        response = _normalize_prediction_result(result)
        logger.info("[predict] Sending prediction response for user %s: %s", payload.userId, response)
        return response
    except ModelArtifactError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive production guardrail
        logger.exception("Unexpected injury prediction failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed unexpectedly.",
        ) from exc
