from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from statistics import mean
from typing import Any

from app.core.config import settings
from app.ml.utils import (
    clamp,
    daterange,
    humanize_muscle_group,
    infer_muscle_group,
    parse_date_key,
    propagate_muscle_load,
    safe_float,
    safe_int,
)

FEATURE_NAMES: tuple[str, ...] = (
    "acute_load",
    "chronic_load",
    "workload_ratio",
    "fatigue_score",
    "fatigue_vs_avg_load",
    "current_day_load",
    "current_day_load_norm",
    "load_delta_ratio",
    "sleep_hours",
    "sleep_debt_hours",
    "rest_time_recent",
    "rest_time_norm",
    "top_muscle_7d_load",
    "top_muscle_7d_ratio",
    "unique_muscles_7d",
    "current_max_weight",
    "current_max_weight_ratio",
)


@dataclass(frozen=True)
class FeatureBundle:
    features: dict[str, float]
    metadata: dict[str, Any]
    cleaned_logs: list[dict[str, Any]]
    warnings: list[str]


def _average(values: list[float], default: float) -> float:
    return float(mean(values)) if values else default


BODYWEIGHT_LOAD_FACTORS: tuple[tuple[tuple[str, ...], float], ...] = (
    (("push up", "push-up", "dip", "plank"), 0.65),
    (("pull up", "pull-up", "chin up", "chin-up"), 1.0),
    (("squat", "lunge", "split squat", "step up", "step-up"), 0.5),
    (("crunch", "sit up", "sit-up", "leg raise"), 0.35),
)


def _estimate_bodyweight_load(exercise: str, muscle_group: str, body_weight: float) -> float:
    if body_weight <= 0:
        body_weight = 70.0

    normalized_exercise = exercise.lower()
    for keywords, load_factor in BODYWEIGHT_LOAD_FACTORS:
        if any(keyword in normalized_exercise for keyword in keywords):
            return body_weight * load_factor

    if muscle_group in {"recovery", ""}:
        return 0.0

    return body_weight * 0.45


def _build_empty_day(day_value):
    return {
        "date": day_value,
        "daily_load": 0.0,
        "sleep_hours": 0.0,
        "rest_time": 0.0,
        "max_weight": 0.0,
        "muscle_loads": defaultdict(float),
        "fatigue": 0.0,
    }


def engineer_features(logs: list[dict[str, Any]]) -> FeatureBundle:
    warnings: list[str] = []
    cleaned_logs: list[dict[str, Any]] = []

    for raw_log in logs:
        parsed_date = parse_date_key(raw_log.get("date"))
        if parsed_date is None:
            warnings.append(f"Skipped log with invalid date: {raw_log.get('date')!r}")
            continue

        raw_weight = safe_float(raw_log.get("weight"), 0.0)
        cleaned_weight = clamp(raw_weight, 0.0, 500.0)
        if raw_weight > 500:
            warnings.append(
                f"Capped unrealistic weight on {parsed_date.isoformat()} from {raw_weight:.2f}kg to 500.00kg."
            )

        sets = max(safe_int(raw_log.get("sets"), 0), 0)
        reps = max(safe_int(raw_log.get("reps"), 0), 0)
        rest_time = max(safe_float(raw_log.get("restTime"), 0.0), 0.0)
        sleep_hours = clamp(safe_float(raw_log.get("sleepHours"), 0.0), 0.0, 24.0)
        exercise_time = max(safe_float(raw_log.get("exerciseTime"), 0.0), 0.0)
        body_weight = clamp(safe_float(raw_log.get("bodyWeight"), 0.0), 0.0, 500.0)
        exercise = (raw_log.get("exercise") or "").strip()
        muscle_group = infer_muscle_group(exercise, raw_log.get("muscleGroup"))
        effective_weight = cleaned_weight

        if effective_weight <= 0 and sets > 0 and reps > 0:
            effective_weight = _estimate_bodyweight_load(exercise, muscle_group, body_weight)

        if sets > 0 and reps > 0:
            volume = float(sets * reps * effective_weight)
        elif exercise_time > 0:
            volume = float(exercise_time * 8.0)
        else:
            volume = 0.0

        cleaned_logs.append(
            {
                "date": parsed_date,
                "exercise": exercise,
                "muscle_group": muscle_group,
                "sets": sets,
                "reps": reps,
                "weight": effective_weight,
                "rest_time": rest_time,
                "sleep_hours": sleep_hours,
                "volume": volume,
            }
        )

    if not cleaned_logs:
        empty_features = {feature_name: 0.0 for feature_name in FEATURE_NAMES}
        metadata = {
            "reference_date": None,
            "top_muscle_group": "Recovery",
            "top_muscle_load": 0.0,
            "warnings": warnings,
        }
        return FeatureBundle(empty_features, metadata, cleaned_logs, warnings)

    cleaned_logs.sort(key=lambda entry: entry["date"])
    reference_date = cleaned_logs[-1]["date"]
    earliest_date = min(cleaned_logs[0]["date"], reference_date.fromordinal(reference_date.toordinal() - 27))

    daily_rows = {day_value: _build_empty_day(day_value) for day_value in daterange(earliest_date, reference_date)}

    for entry in cleaned_logs:
        current_day = daily_rows[entry["date"]]
        current_day["daily_load"] += entry["volume"]
        current_day["max_weight"] = max(current_day["max_weight"], entry["weight"])

        if entry["sleep_hours"] > 0:
            current_day["sleep_hours"] = entry["sleep_hours"]

        if entry["rest_time"] > 0:
            if current_day["rest_time"] <= 0:
                current_day["rest_time"] = entry["rest_time"]
            else:
                current_day["rest_time"] = (current_day["rest_time"] + entry["rest_time"]) / 2.0

        for muscle_group, propagated_volume in propagate_muscle_load(entry["muscle_group"], entry["volume"]).items():
            current_day["muscle_loads"][muscle_group] += propagated_volume

    timeline = [daily_rows[day_value] for day_value in sorted(daily_rows)]

    fatigue = 0.0
    for day_snapshot in timeline:
        fatigue = (fatigue * settings.fatigue_decay) + day_snapshot["daily_load"]
        day_snapshot["fatigue"] = fatigue

    recent_7_days = timeline[-7:]
    recent_28_days = timeline[-28:]
    current_day = timeline[-1]
    prior_training_days = [day for day in timeline[:-1] if day["daily_load"] > 0]
    previous_training_day = prior_training_days[-1] if prior_training_days else None

    acute_load = sum(day["daily_load"] for day in recent_7_days)
    chronic_load = sum(day["daily_load"] for day in recent_28_days) / 4.0 if recent_28_days else 0.0
    workload_ratio = acute_load / max(chronic_load, 1.0)

    average_daily_load = _average([day["daily_load"] for day in timeline], 1.0)
    average_sleep = _average([day["sleep_hours"] for day in timeline if day["sleep_hours"] > 0], 7.0)
    average_rest_time = _average([day["rest_time"] for day in timeline if day["rest_time"] > 0], 60.0)
    average_max_weight = _average([day["max_weight"] for day in timeline if day["max_weight"] > 0], 1.0)

    muscle_totals = defaultdict(float)
    for day_snapshot in recent_7_days:
        for muscle_group, muscle_load in day_snapshot["muscle_loads"].items():
            muscle_totals[muscle_group] += muscle_load

    if muscle_totals:
        top_muscle_group, top_muscle_load = max(muscle_totals.items(), key=lambda item: item[1])
    else:
        top_muscle_group, top_muscle_load = "recovery", 0.0

    current_sleep_hours = current_day["sleep_hours"] or average_sleep
    current_rest_time = _average([day["rest_time"] for day in recent_7_days if day["rest_time"] > 0], average_rest_time)
    previous_training_load = previous_training_day["daily_load"] if previous_training_day else 0.0

    features = {
        "acute_load": float(acute_load),
        "chronic_load": float(chronic_load),
        "workload_ratio": float(workload_ratio),
        "fatigue_score": float(current_day["fatigue"]),
        "fatigue_vs_avg_load": float(current_day["fatigue"] / max(average_daily_load, 1.0)),
        "current_day_load": float(current_day["daily_load"]),
        "current_day_load_norm": float(current_day["daily_load"] / max(average_daily_load, 1.0)),
        "load_delta_ratio": float(
            current_day["daily_load"] / max(previous_training_load, 1.0) if current_day["daily_load"] > 0 else 0.0
        ),
        "sleep_hours": float(current_sleep_hours),
        "sleep_debt_hours": float(max(0.0, average_sleep - current_sleep_hours)),
        "rest_time_recent": float(current_rest_time),
        "rest_time_norm": float(current_rest_time / max(average_rest_time, 1.0)),
        "top_muscle_7d_load": float(top_muscle_load),
        "top_muscle_7d_ratio": float(top_muscle_load / max(acute_load, 1.0)),
        "unique_muscles_7d": float(sum(1 for load_value in muscle_totals.values() if load_value > 0)),
        "current_max_weight": float(current_day["max_weight"]),
        "current_max_weight_ratio": float(current_day["max_weight"] / max(average_max_weight, 1.0)),
    }

    metadata = {
        "reference_date": reference_date.isoformat(),
        "top_muscle_group": humanize_muscle_group(top_muscle_group),
        "top_muscle_load": float(top_muscle_load),
        "average_daily_load": float(average_daily_load),
        "average_sleep": float(average_sleep),
        "average_rest_time": float(average_rest_time),
        "average_max_weight": float(average_max_weight),
        "warnings": warnings,
    }

    return FeatureBundle(features, metadata, cleaned_logs, warnings)
