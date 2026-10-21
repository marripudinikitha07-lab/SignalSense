import os
import time
import numpy as np
import torch
import torch.nn as nn
from typing import Dict, Any, Tuple, Optional
from .lftsad_model import LFTSAD

class LFTSADBaseline:
    """
    Original LFTSAD Baseline Runner
    Executes real inference, computing point-level, sequence-level,
    and combined scores via dual reconstruction discrepancies.
    """
    def __init__(
        self,
        checkpoint_path: str = "models/lftsad_baseline.pt",
        win_size: int = 60,
        channel: int = 24,
        device: str = "cpu",
    ):
        self.device = torch.device(device)
        self.win_size = win_size
        self.channel = channel
        self.checkpoint_path = checkpoint_path

        self.model = LFTSAD(
            win_size=self.win_size,
            enc_in=self.channel,
            c_out=self.channel,
            d_model=64,
            patch_size=[6],
            patch_seq=[6],
            seq_size=5,
            channel=self.channel,
        ).to(self.device)

        self.criterion_keep = nn.MSELoss(reduction='none')

        if os.path.exists(checkpoint_path):
            state_dict = torch.load(checkpoint_path, map_location=self.device)
            self.model.load_state_dict(state_dict)
            self.model.eval()
            self.is_loaded = True
        else:
            self.is_loaded = False

    def predict_stream(
        self,
        data: np.ndarray,
        alpha: float = 0.5,
        anomaly_ratio: float = 14.5,
        target_feature_idx: int = 0,
        calibrated_threshold: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Runs dual-scale reconstruction on continuous multivariate data (T, M).
        Computes Point-Level, Sequence-Level, and Combined Scores.
        """
        self.model.eval()
        start_time = time.time()
        T, M = data.shape

        # Normalize data per channel if not pre-scaled
        mean_v = np.mean(data, axis=0, keepdims=True)
        std_v = np.std(data, axis=0, keepdims=True) + 1e-5
        norm_data = (data - mean_v) / std_v

        # Construct evaluation windows of size win_size without truncating any observations
        if T < self.win_size:
            pad_len = self.win_size - T
            padded = np.pad(norm_data, ((0, pad_len), (0, 0)), mode='edge')
            windows = padded[np.newaxis, :, :]
        elif T % self.win_size != 0:
            pad_len = self.win_size - (T % self.win_size)
            padded = np.pad(norm_data, ((0, pad_len), (0, 0)), mode='edge')
            windows = padded.reshape(-1, self.win_size, M)
        else:
            windows = norm_data.reshape(-1, self.win_size, M)
        actual_T = T

        all_point_scores = []
        all_seq_scores = []

        with torch.no_grad():
            for w in range(windows.shape[0]):
                inp = torch.tensor(windows[w : w + 1], dtype=torch.float32, device=self.device)
                series, prior, series_seq, prior_seq = self.model(inp)

                # Point-level reconstruction discrepancy across channels -> (1, win_size, M)
                pt_loss_tensor = self.criterion_keep(series[0], prior[0])
                # Sequence-level reconstruction discrepancy across channels -> (1, win_size, M)
                seq_loss_tensor = self.criterion_keep(series_seq[0], prior_seq[0])

                # Mean discrepancy across all channels for observation score -> (win_size,)
                pt_loss_obs = torch.mean(pt_loss_tensor, dim=-1).squeeze(0)
                seq_loss_obs = torch.mean(seq_loss_tensor, dim=-1).squeeze(0)

                # Softmax normal energy distribution across the window (as in LFTSAD solver.py)
                pt_metric = torch.softmax(pt_loss_obs, dim=-1).cpu().numpy()
                seq_metric = torch.softmax(seq_loss_obs, dim=-1).cpu().numpy()

                all_point_scores.append(pt_metric)
                all_seq_scores.append(seq_metric)

        flat_pt_scores = np.concatenate(all_point_scores)[:actual_T]
        flat_seq_scores = np.concatenate(all_seq_scores)[:actual_T]

        # Core LFTSAD score fusion: CombinedScore = alpha * PointScore + (1 - alpha) * SequenceScore
        combined_scores = alpha * flat_pt_scores + (1.0 - alpha) * flat_seq_scores

        # Threshold determination (percentile anomaly ratio from training/calibration)
        if calibrated_threshold is not None:
            threshold = float(calibrated_threshold)
        else:
            threshold = float(np.percentile(combined_scores, 100.0 - anomaly_ratio))

        predictions = (combined_scores > threshold).astype(int)
        anomaly_indices = np.where(predictions == 1)[0].tolist()

        inference_time_ms = (time.time() - start_time) * 1000.0

        return {
            "model_type": "baseline",
            "model_name": "Original LFTSAD Baseline",
            "alpha": float(alpha),
            "alpha_mode": "manual",
            "point_scores": flat_pt_scores.tolist(),
            "sequence_scores": flat_seq_scores.tolist(),
            "combined_scores": combined_scores.tolist(),
            "predictions": predictions.tolist(),
            "threshold": threshold,
            "detected_anomaly_indices": anomaly_indices,
            "total_anomalies": len(anomaly_indices),
            "total_observations": actual_T,
            "inference_time_ms": inference_time_ms,
        }
