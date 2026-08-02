from __future__ import annotations

import logging
from secrets import compare_digest

from fastapi import Header, HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)


def verify_service_token(x_shared_secret: str | None = Header(None, alias="X-Shared-Secret")) -> dict[str, bool]:
    if not settings.service_auth_secret:
        logger.error("SHARED_SECRET is missing on the Python prediction service.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Service authentication is not configured.",
        )

    if not x_shared_secret or not compare_digest(x_shared_secret, settings.service_auth_secret):
        logger.warning("Rejected prediction request with missing or invalid shared secret.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized service request.",
        )

    return {"authenticated": True}
