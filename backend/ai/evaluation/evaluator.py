import json
from pathlib import Path
from backend.ai.config.config import SAVED_MODELS_DIR, REPORTS_DIR
from backend.ai.utils.logger import get_logger

logger = get_logger("Evaluator")

def compare_models(dataset_name="CICIDS2017"):
    """
    Compares all trained models and generates a side-by-side performance breakdown.
    Recommends the optimal model based on weighted composite score (F1, Precision, Recall, Inference Time).
    """
    registry_file = SAVED_MODELS_DIR / "model_registry.json"
    if not registry_file.exists():
        logger.warning("No model_registry.json found. Triggering quick benchmark train...")
        from backend.ai.training.trainer import run_training_pipeline
        run_training_pipeline(dataset_name=dataset_name)

    with open(registry_file, "r") as f:
        registry = json.load(f)

    models_dict = registry.get("models", {})
    comparison_table = []

    best_score = -1.0
    recommended_model = None

    for m_name, metrics in models_dict.items():
        acc = metrics.get("accuracy", 0.0)
        prec = metrics.get("precision", 0.0)
        rec = metrics.get("recall", 0.0)
        f1 = metrics.get("f1Score", 0.0)
        t_time = metrics.get("trainingTimeMs", 0)
        inf_time = metrics.get("inferenceTimeMs", 0)
        mem = metrics.get("memoryUsageMb", 0.0)

        # Composite score: 45% F1 + 25% Recall + 20% Precision + 10% Speed
        speed_score = max(0, 1.0 - (inf_time / 1000.0))
        composite = round((f1 * 0.45) + (rec * 0.25) + (prec * 0.20) + (speed_score * 0.10), 4)

        entry = {
            "modelName": m_name,
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1Score": f1,
            "rocAuc": metrics.get("rocAuc", 0.0),
            "trainingTimeMs": t_time,
            "inferenceTimeMs": inf_time,
            "memoryUsageMb": mem,
            "compositeScore": composite,
            "isRecommended": False
        }
        comparison_table.append(entry)

        if composite > best_score:
            best_score = composite
            recommended_model = m_name

    for entry in comparison_table:
        if entry["modelName"] == recommended_model:
            entry["isRecommended"] = True

    result = {
        "datasetName": registry.get("datasetName", dataset_name),
        "recommendedModel": recommended_model,
        "recommendationReason": f"Highest composite score ({best_score}) balancing accuracy, recall, and real-time inference latency.",
        "comparison": comparison_table,
        "lastEvaluatedAt": registry.get("lastTrainedAt")
    }

    # Save to comparison report
    with open(REPORTS_DIR / "model_comparison_report.json", "w") as f:
        json.dump(result, f, indent=2)

    return result
