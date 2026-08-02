from __future__ import annotations

from typing import Callable

from app.ml.model import ModelBundle

ReasonBuilder = Callable[[float, dict], str]


def _format_ratio(value: float) -> str:
    return f"{value:.2f}x"


FEATURE_REASON_BUILDERS: dict[str, ReasonBuilder] = {
    "workload_ratio": lambda value, _metadata: f"Acute workload is running at {_format_ratio(value)} of the recent 4-week baseline.",
    "fatigue_score": lambda value, _metadata: f"Accumulated fatigue remains elevated at {value:.0f} load units.",
    "fatigue_vs_avg_load": lambda value, _metadata: f"Fatigue is {_format_ratio(value)} above the user's average daily load.",
    "current_day_load_norm": lambda value, _metadata: f"Today's training load is {_format_ratio(value)} of the user's usual day.",
    "load_delta_ratio": lambda value, _metadata: f"Today's load changed to {_format_ratio(value)} of the previous training day.",
    "sleep_debt_hours": lambda value, metadata: f"Sleep is {value:.1f} hours below the user's average of {metadata.get('average_sleep', 7.0):.1f}.",
    "rest_time_norm": lambda value, metadata: f"Recent rest intervals are {_format_ratio(value)} of the user's usual {metadata.get('average_rest_time', 60.0):.0f}-second rest.",
    "top_muscle_7d_load": lambda value, metadata: f"{metadata.get('top_muscle_group', 'One muscle group')} absorbed {value:.0f} propagated load units this week.",
    "top_muscle_7d_ratio": lambda value, metadata: f"{metadata.get('top_muscle_group', 'One muscle group')} carries {_format_ratio(value)} of the last 7-day load.",
    "current_max_weight_ratio": lambda value, _metadata: f"The heaviest recent lift is {_format_ratio(value)} of the user's usual max training weight.",
}


def explain_prediction(
    model_bundle: ModelBundle,
    features: dict[str, float],
    metadata: dict,
    max_reasons: int = 3,
) -> list[str]:
    feature_names = model_bundle.feature_names
    raw_importances = getattr(model_bundle.model, "feature_importances_", None)

    if raw_importances is None or len(raw_importances) != len(feature_names):
        importances = [1.0] * len(feature_names)
    else:
        importances = [float(value) for value in raw_importances]

    ranked_features = sorted(
        (
            (
                feature_name,
                abs(float(features.get(feature_name, 0.0))) * max(importance, 0.001),
                float(features.get(feature_name, 0.0)),
            )
            for feature_name, importance in zip(feature_names, importances)
        ),
        key=lambda item: item[1],
        reverse=True,
    )

    reasons: list[str] = []
    for feature_name, contribution_score, feature_value in ranked_features:
        if contribution_score <= 0:
            continue

        reason_builder = FEATURE_REASON_BUILDERS.get(feature_name)
        if reason_builder is None:
            continue

        if feature_name == "sleep_debt_hours" and feature_value <= 0:
            continue

        if feature_name in {"current_day_load_norm", "load_delta_ratio", "current_max_weight_ratio"} and feature_value <= 1:
            continue

        if feature_name == "rest_time_norm" and feature_value >= 1:
            continue

        reasons.append(reason_builder(feature_value, metadata))
        if len(reasons) == max_reasons:
            break

    if not reasons:
        return ["Recent workload and recovery signals are currently staying within the user's normal range."]

    return reasons
