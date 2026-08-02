from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class PredictLogEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")

    date: str
    exercise: str | None = ""
    muscleGroup: str | None = ""
    sets: int | None = 0
    reps: int | None = 0
    weight: float | None = 0
    bodyWeight: float | None = 0
    exerciseTime: float | None = 0
    restTime: float | None = 0
    sleepHours: float | None = 0


class PredictRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    userId: str = Field(..., min_length=1)
    logs: list[PredictLogEntry] = Field(default_factory=list)


class PredictResponse(BaseModel):
    riskScore: int
    level: str
    reasons: list[str]
    modelVersion: str
