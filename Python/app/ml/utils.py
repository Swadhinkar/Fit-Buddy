from __future__ import annotations

from datetime import date, datetime, timedelta

MUSCLE_GRAPH: dict[str, dict[str, float]] = {
    "chest": {"shoulder": 0.3, "triceps": 0.4},
    "back": {"biceps": 0.5},
    "legs": {"lower_back": 0.4},
}

MUSCLE_GROUP_PATTERNS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("chest", ("bench press", "chest", "push up", "push-up", "dip", "pec", "fly")),
    ("back", ("row", "pull up", "pull-up", "chin up", "chin-up", "lat", "deadlift", "back")),
    (
        "shoulder",
        ("shoulder", "overhead press", "military press", "lateral raise", "front raise", "arnold press"),
    ),
    ("biceps", ("curl", "bicep", "hammer curl", "preacher curl")),
    ("triceps", ("tricep", "skull crusher", "pushdown", "close grip", "close-grip", "overhead extension")),
    (
        "legs",
        (
            "squat",
            "leg press",
            "lunge",
            "split squat",
            "step up",
            "step-up",
            "quad",
            "hamstring",
            "romanian deadlift",
            "rdl",
            "leg curl",
            "hip thrust",
            "glute",
            "calf",
        ),
    ),
    ("core", ("plank", "crunch", "sit up", "sit-up", "leg raise", "ab wheel", "core", "twist")),
)


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def safe_float(value: object, default: float = 0.0) -> float:
    try:
        if value in ("", None):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def safe_int(value: object, default: int = 0) -> int:
    try:
        if value in ("", None):
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def parse_date_key(value: object) -> date | None:
    if isinstance(value, date):
        return value

    if not value:
        return None

    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except ValueError:
        return None


def daterange(start_date: date, end_date: date) -> list[date]:
    total_days = (end_date - start_date).days
    return [start_date + timedelta(days=offset) for offset in range(total_days + 1)]


def normalize_muscle_group(value: str | None) -> str:
    return (value or "").strip().lower().replace(" ", "_")


def infer_muscle_group(exercise: str | None = "", preferred: str | None = "") -> str:
    normalized_preferred = normalize_muscle_group(preferred)
    if normalized_preferred:
        return normalized_preferred

    normalized_exercise = (exercise or "").strip().lower()
    if not normalized_exercise:
        return "recovery"

    for group, keywords in MUSCLE_GROUP_PATTERNS:
        if any(keyword in normalized_exercise for keyword in keywords):
            return group

    return "full_body"


def propagate_muscle_load(muscle_group: str, volume: float) -> dict[str, float]:
    normalized_group = normalize_muscle_group(muscle_group) or "full_body"
    propagated = {normalized_group: volume}

    for connected_group, weight in MUSCLE_GRAPH.get(normalized_group, {}).items():
        propagated[connected_group] = propagated.get(connected_group, 0.0) + (volume * weight)

    return propagated


def humanize_muscle_group(value: str) -> str:
    return value.replace("_", " ").title()
