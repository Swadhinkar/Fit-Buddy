from __future__ import annotations

import os
import json
import pickle
import sys
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from statistics import mean

import numpy as np
from pymongo import MongoClient
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

PROJECT_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PROJECT_ROOT.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.core.config import settings
from app.ml.feature_engineering import FEATURE_NAMES, engineer_features

MONGO_URI = os.getenv("MONGO_URI", "")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "")
DAILY_LOG_COLLECTION = os.getenv("MONGO_DAILY_LOG_COLLECTION", "dailylogs")
SAMPLE_LOG_PATH = Path(os.getenv("SAMPLE_LOG_PATH", REPO_ROOT / "Backend" / "fitness_logs.json"))


def _resolve_database(client: MongoClient):
    if MONGO_DB_NAME:
        return client[MONGO_DB_NAME]

    default_database = client.get_default_database()
    if default_database is not None:
        return default_database

    raise RuntimeError("Unable to resolve MongoDB database name. Set MONGO_DB_NAME or include it in MONGO_URI.")


def _has_workout(log_document: dict) -> bool:
    exercises = log_document.get("exercises") or []
    return bool(log_document.get("didExercise") or float(log_document.get("exerciseTime") or 0) > 0 or exercises)


def _flatten_daily_log(log_document: dict) -> list[dict]:
    sleep_hours = float(log_document.get("sleepHours") or 0)
    body_weight = float(log_document.get("weight") or 0)
    exercise_time = float(log_document.get("exerciseTime") or 0)
    exercises = log_document.get("exercises") or []

    if not exercises:
        return [
            {
                "date": log_document["date"],
                "exercise": "",
                "muscleGroup": "recovery",
                "sets": 0,
                "reps": 0,
                "weight": 0,
                "bodyWeight": body_weight,
                "exerciseTime": exercise_time,
                "restTime": 0,
                "sleepHours": sleep_hours,
            }
        ]

    flattened_entries = []
    for exercise in exercises:
        flattened_entries.append(
            {
                "date": log_document["date"],
                "exercise": exercise.get("name", ""),
                "muscleGroup": exercise.get("muscleGroup", ""),
                "sets": int(exercise.get("sets", 0) or 0),
                "reps": int(exercise.get("reps", 0) or 0),
                "weight": float(exercise.get("weight", 0) or 0),
                "bodyWeight": body_weight,
                "exerciseTime": exercise_time,
                "restTime": float(exercise.get("restTime", 0) or 0),
                "sleepHours": sleep_hours,
            }
        )

    return flattened_entries


def _normalize_user_id(value: object) -> str:
    if isinstance(value, dict):
        return str(value.get("$oid") or value.get("oid") or "")

    return str(value or "")


def _safe_risk_score(log_document: dict) -> float | None:
    try:
        value = log_document.get("riskScore")
        if value in ("", None):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _reference_date_minus_window(reference_date: str) -> str:
    parsed_reference = datetime.strptime(reference_date, "%Y-%m-%d").date()
    return (parsed_reference - timedelta(days=29)).isoformat()


def _select_window(log_documents: list[dict], index: int) -> list[dict]:
    reference_date = log_documents[index]["date"]
    selected: list[dict] = []
    workout_count = 0

    for log_document in reversed(log_documents[: index + 1]):
        if log_document["date"] >= _reference_date_minus_window(reference_date):
            selected.append(log_document)
            if _has_workout(log_document):
                workout_count += 1
            continue

        if _has_workout(log_document) and workout_count < 25:
            selected.append(log_document)
            workout_count += 1
            continue

        if workout_count >= 25:
            break

    selected.sort(key=lambda document: document["date"])
    return selected


def load_training_logs() -> list[dict]:
    if MONGO_URI:
        try:
            with MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000) as client:
                database = _resolve_database(client)
                cursor = database[DAILY_LOG_COLLECTION].find(
                    {},
                    {
                        "userId": 1,
                        "date": 1,
                        "didExercise": 1,
                        "exerciseTime": 1,
                        "sleepHours": 1,
                        "exercises": 1,
                        "riskScore": 1,
                    },
                ).sort([("userId", 1), ("date", 1)])
                documents = list(cursor)
                if documents:
                    return documents
        except Exception as exc:
            print(f"Mongo training load failed, falling back to sample logs: {exc}")

    if not SAMPLE_LOG_PATH.exists():
        raise RuntimeError(
            "No training logs were found. Set MONGO_URI/MONGO_DB_NAME or provide SAMPLE_LOG_PATH."
        )

    with SAMPLE_LOG_PATH.open("r", encoding="utf-8") as sample_file:
        documents = json.load(sample_file)

    if not isinstance(documents, list) or not documents:
        raise RuntimeError(f"Sample training file is empty or invalid: {SAMPLE_LOG_PATH}")

    return documents


def build_training_samples(log_documents: list[dict]) -> list[dict]:
    logs_by_user: dict[str, list[dict]] = defaultdict(list)
    for log_document in log_documents:
        user_id = _normalize_user_id(log_document.get("userId"))
        if not user_id or not log_document.get("date"):
            continue
        logs_by_user[user_id].append(log_document)

    samples: list[dict] = []
    for user_id, user_logs in logs_by_user.items():
        user_logs.sort(key=lambda document: document["date"])
        for index, log_document in enumerate(user_logs):
            selected_window = _select_window(user_logs, index)
            flattened_window = [
                flattened_entry
                for selected_log in selected_window
                for flattened_entry in _flatten_daily_log(selected_log)
            ]
            feature_bundle = engineer_features(flattened_window)
            samples.append(
                {
                    "user_id": user_id,
                    "date": log_document["date"],
                    "features": feature_bundle.features,
                    "metadata": feature_bundle.metadata,
                    "risk_score": _safe_risk_score(log_document),
                }
            )

    return samples


def train_model() -> None:
    raw_logs = load_training_logs()
    samples = build_training_samples(raw_logs)

    if len(samples) < 10:
        raise RuntimeError("Not enough workout history was found to train the injury-risk model.")

    fatigue_values = [sample["features"]["fatigue_score"] for sample in samples]
    fatigue_threshold = float(np.percentile(fatigue_values, 75))

    labels = np.asarray(
        [
            1
            if (
                (sample.get("risk_score") is not None and float(sample["risk_score"]) >= 60)
                or (
                    sample.get("risk_score") is None
                    and (
                        sample["features"]["workload_ratio"] > 1.5
                        or sample["features"]["fatigue_score"] >= fatigue_threshold
                    )
                )
            )
            else 0
            for sample in samples
        ],
        dtype=int,
    )

    unique_labels = np.unique(labels)
    if unique_labels.size < 2:
        raise RuntimeError(
            "Training labels produced only one class. Add more varied workout history before retraining."
        )

    feature_matrix = np.asarray(
        [[float(sample["features"][feature_name]) for feature_name in FEATURE_NAMES] for sample in samples],
        dtype=float,
    )

    class_counts = np.bincount(labels)
    stratify_labels = labels if unique_labels.size > 1 and np.min(class_counts[class_counts > 0]) >= 2 else None

    X_train, X_test, y_train, y_test = train_test_split(
        feature_matrix,
        labels,
        test_size=0.2,
        random_state=42,
        stratify=stratify_labels,
    )

    negative_count = max(int((y_train == 0).sum()), 1)
    positive_count = max(int((y_train == 1).sum()), 1)

    model = XGBClassifier(
        n_estimators=140,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        scale_pos_weight=negative_count / positive_count,
        n_jobs=1,
    )
    model.fit(X_train, y_train)

    test_predictions = model.predict(X_test)
    validation_accuracy = float(accuracy_score(y_test, test_predictions))
    print("Training samples:", len(samples))
    print("Positive labels:", int(labels.sum()))
    print("Average acute/chronic ratio:", round(mean(sample["features"]["workload_ratio"] for sample in samples), 3))
    print("Fatigue threshold:", round(fatigue_threshold, 3))
    print("Validation accuracy:", round(validation_accuracy, 3))
    print(classification_report(y_test, test_predictions, digits=3))

    settings.model_path.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "model": model,
        "feature_names": list(FEATURE_NAMES),
        "model_version": settings.model_version,
        "metadata": {
            "fatigue_threshold": fatigue_threshold,
            "training_samples": len(samples),
            "positive_labels": int(labels.sum()),
            "validation_accuracy": validation_accuracy,
        },
    }

    with settings.model_path.open("wb") as model_file:
        pickle.dump(artifact, model_file)

    print(f"Saved model artifact to {settings.model_path}")


if __name__ == "__main__":
    train_model()
