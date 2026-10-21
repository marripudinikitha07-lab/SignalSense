# SignalSense Data Directory

This directory houses the benchmark and user datasets for SignalSense.

## Contents
- `swan/`: Directory containing the verified SWAN-SF continuous and windowed partitions (`metadata.json`, `*.npy`, `*.csv`).
- `sample_multivariate_timeseries.csv`: Sample 300-row 24-feature time-series CSV provided for testing custom upload validation and inference.

## User CSV Upload Requirements
When uploading custom CSV files through the web interface:
1. Format: Standard comma-separated values (`.csv`).
2. Length: Minimum 30 rows.
3. Content: At least 1 numerical measurement column.
4. Timestamps: Optional ISO-8601 or date format column (auto-detected). If absent, observation indices `t_0, t_1, ...` are automatically assigned.
