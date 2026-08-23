import sys
import json
import argparse
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.ai.training.trainer import run_training_pipeline
from backend.ai.evaluation.evaluator import compare_models
from backend.ai.evaluation.report_generator import generate_reports
from backend.ai.prediction.predictor import get_prediction_engine
from backend.ai.utils.logger import get_logger

logger = get_logger("AIMainCLI")

def main():
    parser = argparse.ArgumentParser(description="NetShield AI Machine Learning Pipeline CLI")
    parser.add_argument("--mode", type=str, choices=["train", "predict", "evaluate", "compare"], default="train")
    parser.add_argument('--target-accuracy', type=float, default=None, help='Desired minimum accuracy (e.g., 0.97)')
    parser.add_argument("--model", type=str, default=None)
    args = parser.parse_args()

    if args.mode == "train":
        logger.info(f"Triggering training for dataset: {args.dataset}")
        res = run_training_pipeline(dataset_name=args.dataset)
        comp = compare_models(dataset_name=args.dataset)
        generate_reports(comp, dataset_name=args.dataset)
        print(json.dumps(res, indent=2))

    elif args.mode == "compare" or args.mode == "evaluate":
        logger.info(f"Evaluating and comparing models for dataset: {args.dataset}")
        comp = compare_models(dataset_name=args.dataset)
        generate_reports(comp, dataset_name=args.dataset)
        print(json.dumps(comp, indent=2))

    elif args.mode == "predict":
        engine = get_prediction_engine()
        sample_packet = {
            "flow_duration": 4500,
            "fwd_packets": 24,
            "bwd_packets": 18,
            "flow_bytes_sec": 14500.5,
            "protocol": "TCP"
        }
        res = engine.predict_packet(sample_packet, model_name=args.model)
        print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
