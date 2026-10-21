import os
import uuid
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from ..datasets.swan_loader import SWANLoader
from ..datasets.csv_validator import CSVValidator
from ..models.improved_model import ImprovedLFTSAD
from ..evaluation.comparison import get_real_model_comparison

# Compute workspace project root dynamically
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DEFAULT_DATA_DIR = os.path.join(PROJECT_ROOT, "data", "swan")
DEFAULT_CKPT_PATH = os.path.join(PROJECT_ROOT, "models", "lftsad_baseline.pt")

class AnalysisService:
    def __init__(self, data_dir: Optional[str] = None, checkpoint_path: Optional[str] = None):
        self.data_dir = data_dir if data_dir is not None else DEFAULT_DATA_DIR
        actual_ckpt = checkpoint_path if checkpoint_path is not None else DEFAULT_CKPT_PATH

        self.swan_loader = SWANLoader(data_dir=self.data_dir)
        self.custom_datasets: Dict[str, Dict[str, Any]] = {}

        # Initialize ImprovedLFTSAD Suite
        self.model_suite = ImprovedLFTSAD(
            checkpoint_path=actual_ckpt,
            win_size=60,
            channel=24,
            feature_names=self.swan_loader.feature_names,
        )

        # Fit training reference correlation
        try:
            train_ref = self.swan_loader.load_train_reference()
            self.model_suite.fit_normal_reference(train_ref)
            print("[AnalysisService] Successfully fitted reference correlation matrix on SWAN train continuous stream.")
        except Exception as e:
            print(f"[AnalysisService] Notice: Could not fit normal reference immediately: {e}")

    def list_datasets(self):
        datasets = [
            {
                "id": "swan",
                "name": "SWAN-SF (Space Weather Solar Flares)",
                "type": "official_benchmark",
                "features_count": len(self.swan_loader.feature_names),
                "is_default": True,
            }
        ]
        for ds_id, ds_data in self.custom_datasets.items():
            datasets.append({
                "id": ds_id,
                "name": ds_data["filename"],
                "type": "user_uploaded",
                "features_count": len(ds_data["numerical_columns"]),
                "is_default": False,
            })
        return datasets

    def get_metadata(self, dataset_id: str):
        if dataset_id == "swan":
            return self.swan_loader.get_metadata()
        if dataset_id in self.custom_datasets:
            ds = self.custom_datasets[dataset_id]
            return {
                "id": dataset_id,
                "name": ds["filename"],
                "source": "User-Uploaded CSV",
                "feature_names": ds["numerical_columns"],
                "feature_count": len(ds["numerical_columns"]),
                "numerical_columns": ds["numerical_columns"],
                "total_rows": ds["total_rows"],
                "timestamp_column": ds["timestamp_column"],
                "has_ground_truth": ds["has_ground_truth"],
                "ground_truth_column": ds["ground_truth_column"],
                "preprocessing_applied": ds["preprocessing_applied"],
            }
        raise KeyError(f"Dataset '{dataset_id}' not found.")

    def get_preview(self, dataset_id: str, limit: int = 50):
        if dataset_id == "swan":
            _, _, df = self.swan_loader.load_continuous_test_data()
            preview_df = df.head(limit)
            return {
                "dataset_id": "swan",
                "total_rows": len(df),
                "columns": list(df.columns),
                "rows": preview_df.to_dict(orient="records"),
            }
        if dataset_id in self.custom_datasets:
            ds = self.custom_datasets[dataset_id]
            return {
                "dataset_id": dataset_id,
                "total_rows": ds["total_rows"],
                "columns": ds["numerical_columns"],
                "rows": ds["preview_rows"][:limit],
            }
        raise KeyError(f"Dataset '{dataset_id}' not found.")

    def register_custom_csv(self, file_content: bytes, filename: str):
        validated = CSVValidator.validate_and_parse(file_content, filename)
        dataset_id = f"custom_{uuid.uuid4().hex[:8]}"
        self.custom_datasets[dataset_id] = validated

        return {
            "dataset_id": dataset_id,
            "filename": filename,
            "rows_count": validated["total_rows"],
            "feature_names": validated["numerical_columns"],
            "numerical_columns": validated["numerical_columns"],
            "timestamp_column": validated["timestamp_column"],
            "has_ground_truth": validated["has_ground_truth"],
            "ground_truth_column": validated["ground_truth_column"],
            "preprocessing": validated["preprocessing_applied"],
            "preview": {
                "columns": validated["numerical_columns"],
                "rows": validated["preview_rows"][:50],
            }
        }

    def detect(self, config: Dict[str, Any]):
        dataset_id = config.get("dataset_id", "swan")
        model_type = config.get("model_type", "baseline")
        feature_name = config.get("feature_name", "USFLUX")
        alpha_mode = config.get("alpha_mode", "manual")
        alpha = config.get("alpha", 0.5)
        correlation_weight = config.get("correlation_weight", 0.3)
        anomaly_ratio = config.get("anomaly_ratio", 14.5)

        if dataset_id == "swan":
            X_test, _, df = self.swan_loader.load_continuous_test_data()
            timestamps = df["timestamp"].tolist()
            feature_idx = self.swan_loader.feature_names.index(feature_name) if feature_name in self.swan_loader.feature_names else 0

            # Load validation partition for leakage-free alpha selection
            val_X = self.swan_loader.load_validation_partition()
            val_pt, val_seq = None, None
            if val_X is not None:
                # Get validation discrepancy distribution
                val_res = self.model_suite.baseline.predict_stream(val_X, alpha=0.5)
                val_pt = np.asarray(val_res["point_scores"])
                val_seq = np.asarray(val_res["sequence_scores"])

            res = self.model_suite.run_inference(
                data=X_test,
                model_type=model_type,
                alpha_mode=alpha_mode,
                alpha=alpha,
                correlation_weight=correlation_weight,
                anomaly_ratio=anomaly_ratio,
                target_feature_idx=feature_idx,
                val_point_scores=val_pt,
                val_seq_scores=val_seq,
                timestamps=timestamps,
            )

            # Attach ground-truth evaluation for SWAN if available
            if "ground_truth_anomaly" in df.columns:
                from ..evaluation.metrics import compute_evaluation_metrics
                gt_slice = df["ground_truth_anomaly"].to_numpy()[:res["total_observations"]]
                eval_metrics = compute_evaluation_metrics(
                    y_true=gt_slice,
                    y_pred=np.asarray(res["predictions"]),
                    anomaly_scores=np.asarray(res["combined_scores"])
                )
                res["has_ground_truth"] = True
                res["ground_truth_column"] = "ground_truth_anomaly"
                res["ground_truth_labels"] = gt_slice.tolist()
                res["ground_truth_evaluation"] = eval_metrics
            else:
                res["has_ground_truth"] = False

            return res

        elif dataset_id in self.custom_datasets:
            ds = self.custom_datasets[dataset_id]
            data = ds["data_array"]
            num_cols = ds["numerical_columns"]
            timestamps = ds["timestamps"]
            feature_idx = num_cols.index(feature_name) if feature_name in num_cols else 0
            actual_feature_name = num_cols[feature_idx]

            # If user dataset has less or more than 24 features, tile or slice
            M = data.shape[1]
            if M < 24:
                repeats = int(np.ceil(24 / M))
                padded_data = np.tile(data, (1, repeats))[:, :24]
            else:
                padded_data = data[:, :24]

            res = self.model_suite.run_inference(
                data=padded_data,
                model_type=model_type,
                alpha_mode=alpha_mode,
                alpha=alpha,
                correlation_weight=correlation_weight,
                anomaly_ratio=anomaly_ratio,
                target_feature_idx=feature_idx % 24,
                timestamps=timestamps,
            )
            # Restore true feature values from user's data
            res["feature_values"] = data[:res["total_observations"], feature_idx].tolist()
            res["selected_feature"] = actual_feature_name

            # Check if ground truth labels exist in the uploaded CSV
            gt = ds.get("ground_truth_labels")
            if gt is not None:
                from ..evaluation.metrics import compute_evaluation_metrics
                gt_slice = np.asarray(gt[:res["total_observations"]]).astype(int)
                eval_metrics = compute_evaluation_metrics(
                    y_true=gt_slice,
                    y_pred=np.asarray(res["predictions"]),
                    anomaly_scores=np.asarray(res["combined_scores"])
                )
                res["has_ground_truth"] = True
                res["ground_truth_column"] = ds.get("ground_truth_column", "known_anomaly")
                res["ground_truth_labels"] = gt_slice.tolist()
                res["ground_truth_evaluation"] = eval_metrics
            else:
                res["has_ground_truth"] = False

            return res

        raise KeyError(f"Dataset '{dataset_id}' not found.")

    def recalculate(self, payload: Dict[str, Any]):
        new_alpha = float(payload.get("alpha", 0.5))
        pt_scores = np.asarray(payload["point_scores"])
        seq_scores = np.asarray(payload["sequence_scores"])
        corr_scores = payload.get("correlation_scores")
        corr_weight = float(payload.get("correlation_weight", 0.3))
        anomaly_ratio = float(payload.get("anomaly_ratio", 14.5))

        # Recalculate combined score using formula: alpha * pt + (1 - alpha) * seq
        combined = new_alpha * pt_scores + (1.0 - new_alpha) * seq_scores

        if corr_scores is not None and len(corr_scores) == len(combined):
            corr_arr = np.asarray(corr_scores)
            final_scores = combined * (1.0 + corr_weight * corr_arr)
        else:
            final_scores = combined

        threshold = float(np.percentile(final_scores, 100.0 - anomaly_ratio))
        predictions = (final_scores > threshold).astype(int)
        anomaly_indices = np.where(predictions == 1)[0].tolist()

        return {
            "alpha": new_alpha,
            "threshold": threshold,
            "combined_scores": final_scores.tolist(),
            "predictions": predictions.tolist(),
            "detected_anomaly_indices": anomaly_indices,
            "total_anomalies": len(anomaly_indices),
        }

    def auto_alpha(self, dataset_id: str, criterion: str = "variance_separation"):
        if dataset_id == "swan":
            val_X = self.swan_loader.load_validation_partition()
            if val_X is not None:
                val_res = self.model_suite.baseline.predict_stream(val_X, alpha=0.5)
                pt = np.asarray(val_res["point_scores"])
                seq = np.asarray(val_res["sequence_scores"])
                return self.model_suite.alpha_selector.select_optimal_alpha(pt, seq, criterion=criterion)
        # Fallback to test continuous data
        X_test, _, _ = self.swan_loader.load_continuous_test_data()
        res = self.model_suite.baseline.predict_stream(X_test, alpha=0.5)
        pt = np.asarray(res["point_scores"])
        seq = np.asarray(res["sequence_scores"])
        return self.model_suite.alpha_selector.select_optimal_alpha(pt, seq, criterion=criterion)

    def get_comparison(self, dataset_id: str = "swan"):
        return get_real_model_comparison(data_dir=self.data_dir)
