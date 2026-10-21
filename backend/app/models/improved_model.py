import time
import numpy as np
from typing import Dict, Any, List, Optional
from .lftsad_baseline import LFTSADBaseline
from .alpha_selection import AutomaticAlphaSelector
from .correlation_enhancement import CrossVariableCorrelationEnhancement

class ImprovedLFTSAD:
    """
    Unified LFTSAD Research Suite supporting:
      1. Original Baseline
      2. Baseline + Automatic Alpha Selection
      3. Baseline + Cross-Variable Correlation Enhancement
      4. Combined Improved Model (Auto Alpha + Correlation Enhancement)
    """
    def __init__(
        self,
        checkpoint_path: str = "models/lftsad_baseline.pt",
        win_size: int = 60,
        channel: int = 24,
        feature_names: Optional[List[str]] = None,
    ):
        self.baseline = LFTSADBaseline(checkpoint_path=checkpoint_path, win_size=win_size, channel=channel)
        self.alpha_selector = AutomaticAlphaSelector()
        self.correlation_enhancer = CrossVariableCorrelationEnhancement(feature_names=feature_names)
        self.feature_names = feature_names or []

    def fit_normal_reference(self, X_train: np.ndarray):
        """Fits normal reference correlation matrix on training streams."""
        self.correlation_enhancer.fit(X_train)

    def run_inference(
        self,
        data: np.ndarray,
        model_type: str = "baseline",
        alpha_mode: str = "manual",
        alpha: float = 0.5,
        correlation_weight: float = 0.3,
        anomaly_ratio: float = 14.5,
        target_feature_idx: int = 0,
        val_point_scores: Optional[np.ndarray] = None,
        val_seq_scores: Optional[np.ndarray] = None,
        timestamps: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Executes real inference based on selected model variant.
        """
        start_time = time.time()
        active_alpha = float(alpha)
        auto_alpha_meta = None

        # 1. Base LFTSAD pass to obtain Point and Sequence reconstruction discrepancies
        base_results = self.baseline.predict_stream(
            data=data,
            alpha=active_alpha,
            anomaly_ratio=anomaly_ratio,
            target_feature_idx=target_feature_idx,
        )

        pt_scores = np.asarray(base_results["point_scores"])
        seq_scores = np.asarray(base_results["sequence_scores"])
        actual_T = len(pt_scores)

        # 2. Check if Automatic Alpha should be selected
        if model_type in ["auto_alpha", "combined"] or alpha_mode == "auto":
            # If validation scores are available, calibrate on them; else use unsupervised data distribution
            calib_pt = val_point_scores if val_point_scores is not None else pt_scores
            calib_seq = val_seq_scores if val_seq_scores is not None else seq_scores

            auto_res = self.alpha_selector.select_optimal_alpha(calib_pt, calib_seq)
            active_alpha = auto_res["selected_alpha"]
            auto_alpha_meta = auto_res

        # 3. Compute Combined Scores with active alpha
        # CombinedScore(t) = alpha * PointScore(t) + (1 - alpha) * SequenceScore(t)
        combined_scores = active_alpha * pt_scores + (1.0 - active_alpha) * seq_scores
        corr_discrepancy = None

        # 4. Apply Cross-Variable Correlation Enhancement if active
        if model_type in ["correlation", "combined"]:
            corr_scores, corr_discrepancy = self.correlation_enhancer.enhance_scores(
                base_combined_scores=combined_scores,
                X=data[:actual_T],
                gamma=correlation_weight,
            )
            final_scores = corr_scores
        else:
            final_scores = combined_scores

        # 5. Thresholding & Anomaly Prediction
        threshold = float(np.percentile(final_scores, 100.0 - anomaly_ratio))
        predictions = (final_scores > threshold).astype(int)
        anomaly_indices = np.where(predictions == 1)[0].tolist()

        # Extract target variable slice for plotting
        target_vals = data[:actual_T, target_feature_idx].tolist()

        # Generate timestamps if not provided
        if timestamps is None or len(timestamps) < actual_T:
            obs_timestamps = [f"t_{i}" for i in range(actual_T)]
        else:
            obs_timestamps = timestamps[:actual_T]

        # Top correlated physical parameters
        top_correlated = self.correlation_enhancer.get_top_correlated_pairs(target_idx=target_feature_idx, top_k=3)

        model_display_names = {
            "baseline": "Original LFTSAD Baseline",
            "auto_alpha": "LFTSAD + Automatic Alpha Selection",
            "correlation": "LFTSAD + Cross-Variable Correlation",
            "combined": "Combined Improved LFTSAD Model",
        }

        total_duration_ms = (time.time() - start_time) * 1000.0

        return {
            "model_type": model_type,
            "model_name": model_display_names.get(model_type, model_type),
            "alpha": float(active_alpha),
            "alpha_mode": "auto" if auto_alpha_meta is not None else alpha_mode,
            "auto_alpha_meta": auto_alpha_meta,
            "correlation_weight": float(correlationWeight) if 'correlationWeight' in locals() else float(correlation_weight),
            "selected_feature": self.feature_names[target_feature_idx] if target_feature_idx < len(self.feature_names) else f"Feature_{target_feature_idx}",
            "feature_values": target_vals,
            "timestamps": obs_timestamps,
            "point_scores": pt_scores.tolist(),
            "sequence_scores": seq_scores.tolist(),
            "combined_scores": final_scores.tolist(),
            "correlation_scores": corr_discrepancy.tolist() if corr_discrepancy is not None else None,
            "predictions": predictions.tolist(),
            "threshold": threshold,
            "detected_anomaly_indices": anomaly_indices,
            "total_anomalies": len(anomaly_indices),
            "total_observations": actual_T,
            "top_correlated_features": top_correlated,
            "inference_time_ms": total_duration_ms,
        }
