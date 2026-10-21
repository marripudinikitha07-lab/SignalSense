import os
import io
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List

class CSVValidator:
    """
    Validates and preprocesses user-uploaded time-series CSV files.
    Ensures safe handling, column typing, timestamp detection, and numerical validation.
    """
    MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 # 50 MB

    @staticmethod
    def validate_and_parse(file_content: bytes, filename: str) -> Dict[str, Any]:
        # 1. Size Check
        if len(file_content) > CSVValidator.MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File size exceeds maximum allowed limit of {CSVValidator.MAX_FILE_SIZE_BYTES // (1024*1024)}MB.")

        # 2. Parsing Check
        try:
            df = pd.read_csv(io.BytesIO(file_content))
        except Exception as e:
            raise ValueError(f"Unable to parse CSV file: {str(e)}. Please verify delimiter and encoding.")

        if df.empty:
            raise ValueError("The uploaded CSV file is empty.")

        # 3. Row count check (need at least 30 observations for windowing)
        if len(df) < 30:
            raise ValueError(f"Insufficient observations: The dataset contains only {len(df)} rows. A minimum of 30 sequential observations is required for time-series modeling.")

        # 4. Identify timestamp or observation order
        timestamp_col = None
        for col in df.columns:
            col_lower = str(col).lower().strip()
            if any(term in col_lower for term in ['time', 'date', 'datetime', 'timestamp', 'epoch']):
                timestamp_col = col
                break

        # 5. Identify ground-truth label column (for evaluation only, never as model feature)
        ground_truth_col = None
        for col in df.columns:
            if col == timestamp_col:
                continue
            col_lower = str(col).lower().strip()
            if col_lower in ['known_anomaly', 'is_anomaly', 'actual_label', 'ground_truth', 'anomaly_label', 'anomaly']:
                ground_truth_col = col
                break

        # 6. Identify numerical measurement columns (strictly excluding ground-truth labels and timestamps)
        numerical_cols = []
        unsuitable_cols = []
        for col in df.columns:
            if col == timestamp_col or col == ground_truth_col:
                continue
            if pd.api.types.is_numeric_dtype(df[col]):
                # Check for zero variance / constant columns
                if df[col].nunique() <= 1:
                    unsuitable_cols.append(f"{col} (constant value)")
                else:
                    numerical_cols.append(col)
            else:
                unsuitable_cols.append(f"{col} (non-numeric text)")

        if len(numerical_cols) == 0:
            raise ValueError("We couldn't find any usable numerical measurement columns. Please upload a CSV file containing time-series measurements.")

        # 7. Check missing and invalid values in numerical columns
        missing_report = {}
        preprocessing_notes = []
        for col in numerical_cols:
            null_count = int(df[col].isnull().sum())
            if null_count > 0:
                missing_report[col] = null_count
                # Linear interpolation or forward-fill
                df[col] = df[col].interpolate(method='linear').bfill().ffill()
                preprocessing_notes.append(f"Interpolated {null_count} missing entries in '{col}'.")

        # Extract timestamps
        if timestamp_col:
            timestamps = df[timestamp_col].astype(str).tolist()
        else:
            timestamps = [f"t_{i}" for i in range(len(df))]
            preprocessing_notes.append("No explicit timestamp column detected; assigned sequential observation indices (t_0, t_1, ...).")

        # Extract ground-truth labels if present
        ground_truth_labels = None
        if ground_truth_col:
            raw_labels = df[ground_truth_col].fillna(0)
            if pd.api.types.is_bool_dtype(raw_labels):
                ground_truth_labels = raw_labels.astype(int).to_numpy()
            else:
                ground_truth_labels = (pd.to_numeric(raw_labels, errors='coerce').fillna(0) > 0).astype(int).to_numpy()
            preprocessing_notes.append(f"Detected ground-truth label column '{ground_truth_col}'. Reserved strictly for model evaluation.")

        numeric_data = df[numerical_cols].to_numpy(dtype=np.float32)

        return {
            "is_valid": True,
            "filename": filename,
            "total_rows": len(df),
            "timestamp_column": timestamp_col,
            "ground_truth_column": ground_truth_col,
            "has_ground_truth": ground_truth_col is not None,
            "ground_truth_labels": ground_truth_labels.tolist() if ground_truth_labels is not None else None,
            "numerical_columns": numerical_cols,
            "unsuitable_columns": unsuitable_cols,
            "missing_values_imputed": missing_report,
            "preprocessing_applied": preprocessing_notes,
            "data_array": numeric_data,
            "timestamps": timestamps,
            "preview_rows": df.head(50).to_dict(orient="records"),
        }
