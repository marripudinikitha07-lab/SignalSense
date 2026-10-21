import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional

class SWANLoader:
    """
    Dedicated Data Loader for SWAN-SF Space Weather Benchmark.
    Handles continuous multi-variate solar active region series,
    photospheric magnetic feature names, and calibration partitions.
    """
    def __init__(self, data_dir: str = "data/swan"):
        self.data_dir = data_dir
        self.meta: Dict[str, Any] = {}
        self.feature_names = []
        self._load_metadata()

    def _load_metadata(self):
        meta_path = os.path.join(self.data_dir, "metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                self.meta = json.load(f)
            self.feature_names = self.meta.get("feature_names", [])
        else:
            self.feature_names = [f"F_{i}" for i in range(24)]

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "id": "swan",
            "name": self.meta.get("dataset_name", "SWAN-SF (Space Weather ANalytics for Solar Flares)"),
            "source": self.meta.get("source", "SDO-HMI SHARP Active Regions"),
            "feature_names": self.feature_names,
            "feature_count": len(self.feature_names),
            "sequence_length": self.meta.get("sequence_length", 60),
            "train_samples": self.meta.get("train_samples", 80),
            "val_samples": self.meta.get("val_samples", 30),
            "test_samples": self.meta.get("test_samples", 40),
            "continuous_train_shape": self.meta.get("continuous_train_shape", [4800, 24]),
            "continuous_test_shape": self.meta.get("continuous_test_shape", [2400, 24]),
            "test_anomalous_sequences": self.meta.get("test_anomalous_sequences", 14),
            "test_normal_sequences": self.meta.get("test_normal_sequences", 26),
        }

    def load_continuous_test_data(self) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
        """Returns continuous test array (2400, 24), ground truth labels (2400,), and timestamps."""
        test_path = os.path.join(self.data_dir, "SWANSF_test_continuous.npy")
        label_path = os.path.join(self.data_dir, "SWANSF_test_label_continuous.npy")

        if not os.path.exists(test_path):
            raise FileNotFoundError(f"SWAN test file not found at {test_path}")

        X_test = np.load(test_path).astype(np.float32)
        y_test = np.load(label_path).astype(np.int32) if os.path.exists(label_path) else np.zeros(len(X_test), dtype=np.int32)

        # Generate realistic 12-minute cadence timestamps
        timestamps = pd.date_range("2026-05-01 00:00:00", periods=len(X_test), freq="12min")
        df = pd.DataFrame(X_test, columns=self.feature_names)
        df.insert(0, "timestamp", timestamps.astype(str))
        df["ground_truth_anomaly"] = y_test

        return X_test, y_test, df

    def load_train_reference(self) -> np.ndarray:
        """Loads normal quiet sun continuous training stream for reference correlation."""
        train_path = os.path.join(self.data_dir, "SWANSF_train_continuous.npy")
        if os.path.exists(train_path):
            return np.load(train_path).astype(np.float32)
        # Fallback to test if train missing
        test_path = os.path.join(self.data_dir, "SWANSF_test_continuous.npy")
        return np.load(test_path).astype(np.float32)

    def load_validation_partition(self) -> Optional[np.ndarray]:
        """Loads calibration validation sequences for leakage-free alpha selection."""
        val_path = os.path.join(self.data_dir, "X_val.npy")
        if os.path.exists(val_path):
            val_arr = np.load(val_path) # (30, 60, 24)
            return val_arr.reshape(-1, val_arr.shape[-1]).astype(np.float32)
        return None
